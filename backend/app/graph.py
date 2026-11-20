"""LangGraph workflow:

ingest_evidence -> bm25_filter -> generate_directions -> human_checkpoint (interrupt) -> build_playbook

The graph is compiled with MemorySaver, so `human_checkpoint` physically pauses execution until
`POST /api/session/{thread_id}/decide` resumes it with `Command(resume=decision)`.
"""
from __future__ import annotations

import json
import operator
from typing import Annotated, Any, TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from . import demos
from .frugality import bm25_filter as run_bm25
from .llm_router import LLMUnavailableWithUsage, empty_metrics, merge_usage, router
from .schemas import DirectionOption, DirectionPlaybook, DirectionSet, EvidenceItem, HumanDecision
from .scraper import collect_public_evidence

MIN_CHUNKS = 5
LENS_ORDER = [("DIR-A", "niche_wedge"), ("DIR-B", "distribution_channel"), ("DIR-C", "pricing_flip")]


class WedgeState(TypedDict, total=False):
    input: dict[str, Any]
    raw_docs: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    directions: list[dict[str, Any]]
    human_decision: dict[str, Any]
    playbook: dict[str, Any]
    metrics: dict[str, Any]
    llm_mode: str  # "llm" | "offline-template"
    logs: Annotated[list[str], operator.add]


# --------------------------------------------------------------------------- nodes
async def ingest_evidence(state: WedgeState) -> dict[str, Any]:
    inp = state["input"]
    logs: list[str] = ["[ingest] Collecting GDPR-safe public evidence (no PII, no LinkedIn)"]
    docs: list[dict[str, Any]] = []
    if not inp.get("use_demo_cache"):
        docs = await collect_public_evidence(inp.get("competitor_urls", []), inp.get("competitor_names", []), logs, inp.get("search_terms"))
    else:
        logs.append("[ingest] use_demo_cache=True -> skipping live fetch")

    from .frugality import chunk_text

    live_chunks = sum(len(chunk_text(d["text"])) for d in docs)
    if inp.get("use_demo_cache") or live_chunks < MIN_CHUNKS:
        cache = demos.cached_docs(inp.get("demo_id"))
        docs.extend(cache)
        logs.append(f"[ingest] Live chunks={live_chunks} (<{MIN_CHUNKS} or cache forced): merged {len(cache)} cached public summaries")
    logs.append(f"[ingest] {len(docs)} source documents ready")
    return {"raw_docs": docs, "logs": logs, "metrics": state.get("metrics") or empty_metrics()}


async def bm25_filter(state: WedgeState) -> dict[str, Any]:
    inp = state["input"]
    query = f"{inp['pitch']} {inp.get('target_audience', '')}"
    evidence, stats = run_bm25(state.get("raw_docs", []), query)
    evidence = [EvidenceItem.model_validate(e).model_dump() for e in evidence]
    metrics = {**state["metrics"], **stats}
    return {
        "evidence": evidence,
        "metrics": metrics,
        "raw_docs": [],  # drop raw text from checkpointed state once filtered
        "logs": [f"[bm25] {stats['raw_chunks']} chunks -> kept top {stats['kept_chunks']} "
                 f"(~{stats['estimated_tokens_saved_pct']}% tokens saved, 0 LLM tokens used)"],
    }


DIRECTIONS_SYSTEM = """You are Wedge, a blunt startup strategist. The founder's CORE IDEA IS FIXED — never tell them to abandon or pivot it.
Your job: propose exactly 3 distinct strategic directions for executing that SAME idea, grounded ONLY in the supplied evidence.

Direction lenses (one each, in this order):
- DIR-A "niche_wedge": a narrow beachhead / underserved segment to win first.
- DIR-B "distribution_channel": an uncrowded go-to-market / acquisition channel.
- DIR-C "pricing_flip": a differentiated pricing or packaging model vs. competitors.

Hard rules:
- Every direction MUST cite 1-4 evidence_ids that exist in the evidence list (format "EV-01"). Never invent IDs.
- market_gap must name a concrete competitor weakness or user frustration that the cited evidence shows.
- tradeoff must be an honest downside.
- Exactly 3 assumptions per direction: specific, testable, falsifiable statements that must be true for the direction to work.
- title: sharp, 4-6 words.  summary: 2-3 sentences on steering the founder's EXISTING idea.
Return ONLY JSON of this exact shape:
{"directions":[{"id":"DIR-A","lens":"niche_wedge","title":"...","summary":"...","market_gap":"...","tradeoff":"...","evidence_ids":["EV-01"],"assumptions":[{"id":"DIR-A-1","statement":"..."},{"id":"DIR-A-2","statement":"..."},{"id":"DIR-A-3","statement":"..."}]}, ...]}"""


def _evidence_block(evidence: list[dict[str, Any]]) -> str:
    return "\n".join(f"[{e['id']}] ({e['source_type']}) {e['title']} — \"{e['snippet']}\"" for e in evidence)


def _make_directions_validator(valid_ids: set[str]):
    def validate(ds: DirectionSet) -> DirectionSet:
        fixed = []
        for (dir_id, lens), d in zip(LENS_ORDER, ds.directions):
            ev = [e for e in dict.fromkeys(d.evidence_ids) if e in valid_ids]
            if not ev:
                raise ValueError(f"{dir_id} cites no valid evidence ids ({d.evidence_ids})")
            assumptions = [{"id": f"{dir_id}-{i}", "statement": a.statement} for i, a in enumerate(d.assumptions, 1)]
            fixed.append(DirectionOption.model_validate({
                **d.model_dump(), "id": dir_id, "lens": lens, "evidence_ids": ev[:4], "assumptions": assumptions,
            }))
        return DirectionSet(directions=fixed)

    return validate


def _lc_first(s: str) -> str:
    """Lowercase the first letter only for an ordinary word ("Final-year" -> "final-year", "SaaS" stays)."""
    word = s.split(" ", 1)[0]
    return s[:1].lower() + s[1:] if word[1:] == word[1:].lower() else s


def _first_sentence(s: str) -> str:
    s = s.strip()
    end = s.find(". ")
    return s if end == -1 else s[: end + 1]


def _offline_directions(inp: dict[str, Any], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deterministic, clearly-labelled template used ONLY when no LLM provider is reachable."""
    ids = [e["id"] for e in evidence] or ["EV-01"]
    pick = lambda i: [ids[i % len(ids)], ids[(i + 3) % len(ids)]]  # noqa: E731
    name, aud = inp["startup_name"], _lc_first(inp["target_audience"])
    return [
        {
            "id": "DIR-A", "lens": "niche_wedge",
            "title": "Own one underserved segment first",
            "summary": f"Keep {name} as-is but launch for a single, sharply defined slice of {aud} whose workflow incumbents ignore. Win that slice completely before widening.",
            "market_gap": "Cited sources show incumbents position for a broad general audience, leaving segment-specific needs unaddressed.",
            "tradeoff": "A smaller initial market caps early revenue and may look 'too small' to investors.",
            "evidence_ids": list(dict.fromkeys(pick(0))),
            "assumptions": [
                {"id": "DIR-A-1", "statement": "The chosen segment feels a sharper version of the pain than the general market."},
                {"id": "DIR-A-2", "statement": "This segment can be reached through a small number of shared places or gatekeepers."},
                {"id": "DIR-A-3", "statement": "Winning this segment creates credible proof to expand into adjacent segments."},
            ],
        },
        {
            "id": "DIR-B", "lens": "distribution_channel",
            "title": "Go through trusted community gatekeepers",
            "summary": f"Distribute {name} through the communities and institutions where {aud} already gather, instead of competing on paid search with incumbents.",
            "market_gap": "Cited sources show users discover tools through peers and communities, while incumbents rely on broad paid acquisition.",
            "tradeoff": "Partnership and community channels are slow to open and depend on a few relationships.",
            "evidence_ids": list(dict.fromkeys(pick(1))),
            "assumptions": [
                {"id": "DIR-B-1", "statement": "Gatekeepers or community moderators will endorse or share the tool."},
                {"id": "DIR-B-2", "statement": "Peer recommendations convert at a meaningfully higher rate than ads for this audience."},
                {"id": "DIR-B-3", "statement": "The channel can deliver the first 100 active users within 60 days."},
            ],
        },
        {
            "id": "DIR-C", "lens": "pricing_flip",
            "title": "Flip subscriptions to pay-per-outcome",
            "summary": f"Keep {name}'s core product but replace the incumbent-style recurring subscription with one-time or per-outcome pricing that matches how {aud} actually use it.",
            "market_gap": "Cited sources show frustration with recurring subscriptions for tools that are used occasionally or for a single job.",
            "tradeoff": "Less predictable revenue and lower lifetime value than a subscription.",
            "evidence_ids": list(dict.fromkeys(pick(2))),
            "assumptions": [
                {"id": "DIR-C-1", "statement": "Users actively prefer outcome-based pricing over a free tier plus subscription."},
                {"id": "DIR-C-2", "statement": "Per-outcome price points cover acquisition cost within the first purchase."},
                {"id": "DIR-C-3", "statement": "Competitors will not quickly copy the pricing model."},
            ],
        },
    ]


async def generate_directions(state: WedgeState) -> dict[str, Any]:
    inp, evidence = state["input"], state["evidence"]
    valid_ids = {e["id"] for e in evidence}
    user_prompt = (
        f"STARTUP: {inp['startup_name']}\nCORE IDEA (fixed): {inp['pitch']}\nTARGET AUDIENCE: {inp['target_audience']}\n"
        f"COMPETITORS: {', '.join(inp.get('competitor_names') or inp.get('competitor_urls') or ['unknown'])}\n\n"
        f"EVIDENCE (cite only these IDs):\n{_evidence_block(evidence)}\n\nReturn the JSON now."
    )
    try:
        result, usage = await router.generate(DIRECTIONS_SYSTEM, user_prompt, DirectionSet, _make_directions_validator(valid_ids))
        metrics = merge_usage(state["metrics"], usage)
        msg = f"[directions] 3 cited directions via {usage.provider} ({usage.model})" + (" — FALLBACK triggered" if usage.fallback_triggered else "")
        return {"directions": [d.model_dump() for d in result.directions], "metrics": metrics, "llm_mode": "llm", "logs": [msg]}
    except LLMUnavailableWithUsage as e:
        metrics = merge_usage(state["metrics"], e.usage)
        metrics["provider"], metrics["model"] = "offline-template", "deterministic"
        dirs = [DirectionOption.model_validate(d).model_dump() for d in _offline_directions(inp, evidence)]
        return {
            "directions": dirs, "metrics": metrics, "llm_mode": "offline-template",
            "logs": [f"[directions] WARN all LLM providers failed ({e}). Using clearly-labelled offline template — add GROQ_API_KEY / GEMINI_API_KEY for AI directions."],
        }


async def human_checkpoint(state: WedgeState) -> dict[str, Any]:
    decision = interrupt({"directions": state["directions"], "evidence": state["evidence"]})
    decision = HumanDecision.model_validate(decision).model_dump()
    return {"human_decision": decision, "logs": [f"[checkpoint] Founder locked {decision['selected_direction_id']} "
                                                 f"with {len(decision['assumption_rulings'])} assumption rulings"]}


PLAYBOOK_SYSTEM = """You are Wedge. The founder has chosen ONE strategic direction for their FIXED core idea and ruled on its assumptions.
Write a focused execution playbook that obeys the founder's judgment:
- Incorporate the founder_tweak explicitly into sharpened_positioning and the plan.
- first_14_days_plan: 4-5 concrete, near-zero-budget actions, ordered, each starting with a verb. Actions that de-risk "unverified" assumptions come first.
- Assumptions marked "accept_risk" are acknowledged but not tested first; "confident" ones are taken as given.
- mom_test_questions: exactly 5 non-leading Mom Test interview questions (about past behaviour and real spending, never "would you use..."). Target assumptions marked "unverified" (if none are unverified, target "accept_risk", then any). target_assumption_id must be one of the direction's assumption IDs.
- landing_page_hook.cited_evidence_ids must be real evidence IDs from the list.
- human_judgment_impact: 2-4 sentences explaining concretely how the founder's choice, tweak and rulings changed this playbook.
Return ONLY JSON of this exact shape:
{"chosen_direction_title":"...","sharpened_positioning":"...","first_14_days_plan":["...","...","...","..."],"landing_page_hook":{"headline":"...","subheadline":"...","cited_evidence_ids":["EV-01"]},"mom_test_questions":[{"question":"...","target_assumption_id":"DIR-A-1","what_it_validates":"..."}],"human_judgment_impact":"..."}"""


def _target_order(direction: dict[str, Any], rulings: list[dict[str, Any]]) -> list[str]:
    by_status = {r["assumption_id"]: r["status"] for r in rulings}
    ids = [a["id"] for a in direction["assumptions"]]
    return ([i for i in ids if by_status.get(i) == "unverified"]
            or [i for i in ids if by_status.get(i) == "accept_risk"]
            or ids)


def _make_playbook_validator(direction: dict[str, Any], valid_ev: set[str], targets: list[str]):
    assumption_ids = {a["id"] for a in direction["assumptions"]}

    def validate(pb: DirectionPlaybook) -> DirectionPlaybook:
        data = pb.model_dump()
        data["chosen_direction_title"] = direction["title"]
        cited = [e for e in data["landing_page_hook"]["cited_evidence_ids"] if e in valid_ev]
        data["landing_page_hook"]["cited_evidence_ids"] = cited or direction["evidence_ids"][:2]
        for n, q in enumerate(data["mom_test_questions"]):
            if q["target_assumption_id"] not in assumption_ids or q["target_assumption_id"] not in targets:
                q["target_assumption_id"] = targets[n % len(targets)]
        return DirectionPlaybook.model_validate(data)

    return validate


def _offline_playbook(inp: dict[str, Any], direction: dict[str, Any], decision: dict[str, Any], targets: list[str]) -> dict[str, Any]:
    tweak = decision.get("founder_tweak") or ""
    statements = {a["id"]: a["statement"] for a in direction["assumptions"]}
    qs_templates = [
        "Tell me about the last time you dealt with this problem. What happened?",
        "What have you already tried to solve it, and what did that cost you?",
        "Walk me through how you decided on the tool or method you use today.",
        "When did this last cost you time or money? How much?",
        "Who else was involved the last time this came up, and what did they do?",
    ]
    counts = {"confident": 0, "accept_risk": 0, "unverified": 0}
    for r in decision["assumption_rulings"]:
        counts[r["status"]] += 1
    return {
        "chosen_direction_title": direction["title"],
        "sharpened_positioning": f"{inp['startup_name']}: {_first_sentence(inp['pitch'])} Focus: {direction['title'].lower()}, "
                                 f"starting with {_lc_first(inp['target_audience'])}."
                                 + (f" Founder steer: {tweak.rstrip('.')}." if tweak else ""),
        "first_14_days_plan": [
            f"Interview 8 people from {_lc_first(inp['target_audience'])} using the Mom Test script below, focused on the unverified assumptions.",
            f"Publish a one-page landing page with the hook below and track sign-ups for the '{direction['title']}' angle.",
            "Post a genuinely useful, non-promotional answer in two communities where the target users already ask about this problem.",
            "Hand-deliver the core outcome manually (concierge) for the first 3 sign-ups to validate value before building more.",
            "On day 14, review interview notes against each assumption and decide: double down, adjust, or switch direction.",
        ],
        "landing_page_hook": {
            "headline": direction["title"],
            "subheadline": direction["market_gap"],
            "cited_evidence_ids": direction["evidence_ids"][:2],
        },
        "mom_test_questions": [
            {"question": qs_templates[i], "target_assumption_id": targets[i % len(targets)],
             "what_it_validates": statements.get(targets[i % len(targets)], "")}
            for i in range(5)
        ],
        "human_judgment_impact": f"The founder chose {direction['id']} ({direction['title']}) over two alternatives"
                                 + (f", steered it with: \"{tweak.rstrip('.')}\"" if tweak else "")
                                 + f". They marked {counts['unverified']} assumption(s) unverified, {counts['accept_risk']} as accepted risk and {counts['confident']} as confident, "
                                 "so every interview question targets the unverified ones first. (Offline template — add LLM keys for a tailored playbook.)",
    }


async def build_playbook(state: WedgeState) -> dict[str, Any]:
    inp, decision = state["input"], state["human_decision"]
    direction = next(d for d in state["directions"] if d["id"] == decision["selected_direction_id"])
    others = [d for d in state["directions"] if d["id"] != direction["id"]]
    valid_ev = {e["id"] for e in state["evidence"]}
    targets = _target_order(direction, decision["assumption_rulings"])

    statements = {a["id"]: a["statement"] for a in direction["assumptions"]}
    rulings_txt = "\n".join(
        f"- {r['assumption_id']} [{r['status'].upper()}] {statements.get(r['assumption_id'], '')}" + (f" (founder note: {r['note']})" if r.get("note") else "")
        for r in decision["assumption_rulings"]
    )
    user_prompt = (
        f"STARTUP: {inp['startup_name']}\nCORE IDEA (fixed): {inp['pitch']}\nTARGET AUDIENCE: {inp['target_audience']}\n\n"
        f"CHOSEN DIRECTION:\n{json.dumps(direction, ensure_ascii=False)}\n\n"
        f"REJECTED DIRECTIONS: {', '.join(d['title'] for d in others)}\n\n"
        f"FOUNDER TWEAK: {decision.get('founder_tweak') or '(none)'}\n\n"
        f"ASSUMPTION RULINGS:\n{rulings_txt}\n\nPRIORITY TARGETS FOR MOM TEST: {', '.join(targets)}\n\n"
        f"EVIDENCE:\n{_evidence_block(state['evidence'])}\n\nReturn the JSON now."
    )
    if state.get("llm_mode") != "offline-template":
        try:
            pb, usage = await router.generate(PLAYBOOK_SYSTEM, user_prompt, DirectionPlaybook,
                                              _make_playbook_validator(direction, valid_ev, targets))
            metrics = merge_usage(state["metrics"], usage)
            return {"playbook": pb.model_dump(), "metrics": metrics,
                    "logs": [f"[playbook] Built via {usage.provider} ({usage.model})" + (" — FALLBACK triggered" if usage.fallback_triggered else "")]}
        except LLMUnavailableWithUsage as e:
            metrics = merge_usage(state["metrics"], e.usage)
            metrics["provider"], metrics["model"] = "offline-template", "deterministic"
            pb = DirectionPlaybook.model_validate(_offline_playbook(inp, direction, decision, targets)).model_dump()
            return {"playbook": pb, "metrics": metrics, "llm_mode": "offline-template",
                    "logs": [f"[playbook] WARN all LLM providers failed ({e}). Using offline template."]}
    pb = DirectionPlaybook.model_validate(_offline_playbook(inp, direction, decision, targets)).model_dump()
    return {"playbook": pb, "logs": ["[playbook] Offline template (no LLM provider available)"]}


# --------------------------------------------------------------------------- graph
def build_graph():
    g = StateGraph(WedgeState)
    g.add_node("ingest_evidence", ingest_evidence)
    g.add_node("bm25_filter", bm25_filter)
    g.add_node("generate_directions", generate_directions)
    g.add_node("human_checkpoint", human_checkpoint)
    g.add_node("build_playbook", build_playbook)
    g.add_edge(START, "ingest_evidence")
    g.add_edge("ingest_evidence", "bm25_filter")
    g.add_edge("bm25_filter", "generate_directions")
    g.add_edge("generate_directions", "human_checkpoint")
    g.add_edge("human_checkpoint", "build_playbook")
    g.add_edge("build_playbook", END)
    return g.compile(checkpointer=MemorySaver())


wedge_graph = build_graph()
