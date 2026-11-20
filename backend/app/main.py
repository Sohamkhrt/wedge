"""Wedge FastAPI app — 5 endpoints."""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from langgraph.types import Command
from pydantic import ValidationError

from . import demos
from .graph import wedge_graph
from .llm_router import empty_metrics
from .schemas import HumanDecision, StartupInput
from .scraper import name_from_url

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("wedge.api")

app = FastAPI(title="Wedge API", version="1.0.0", description="Evidence-backed strategic direction engine for founders")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


def _config(thread_id: str) -> dict[str, Any]:
    return {"configurable": {"thread_id": thread_id}}


def _values(thread_id: str) -> dict[str, Any]:
    snap = wedge_graph.get_state(_config(thread_id))
    if not snap or not snap.values:
        raise HTTPException(404, f"Unknown session {thread_id}")
    return snap.values


def _is_waiting(thread_id: str) -> bool:
    snap = wedge_graph.get_state(_config(thread_id))
    return bool(snap and "human_checkpoint" in (snap.next or ()))


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/demos")
async def get_demos() -> list[dict[str, Any]]:
    return demos.public_demos()


@app.post("/api/session/start")
async def start_session(body: StartupInput) -> dict[str, Any]:
    inp = body.model_dump()
    inp["competitor_urls"] = [u for u in inp["competitor_urls"] if u.strip()]
    if not inp["competitor_names"]:
        inp["competitor_names"] = [name_from_url(u) for u in inp["competitor_urls"]]
    thread_id = uuid.uuid4().hex[:12]
    init = {"input": inp, "metrics": empty_metrics(), "logs": [f"[session] {thread_id} started for {inp['startup_name']}"]}
    try:
        await wedge_graph.ainvoke(init, _config(thread_id))
    except Exception as e:
        log.exception("graph start failed")
        raise HTTPException(500, f"Pipeline failed: {type(e).__name__}: {e}") from e

    if not _is_waiting(thread_id):
        raise HTTPException(500, "Graph did not pause at the human checkpoint")
    v = _values(thread_id)
    return {
        "thread_id": thread_id,
        "status": "awaiting_human_decision",
        "evidence": v.get("evidence", []),
        "directions": v.get("directions", []),
        "metrics": v.get("metrics", {}),
        "llm_mode": v.get("llm_mode", "llm"),
        "logs": v.get("logs", []),
    }


@app.post("/api/session/{thread_id}/decide")
async def decide(thread_id: str, body: dict[str, Any]) -> dict[str, Any]:
    v = _values(thread_id)
    if not _is_waiting(thread_id):
        raise HTTPException(409, "Session is not awaiting a human decision")
    try:
        decision = HumanDecision.model_validate(body)
    except ValidationError as e:
        raise HTTPException(422, e.errors()) from e

    direction = next((d for d in v["directions"] if d["id"] == decision.selected_direction_id), None)
    if direction is None:
        raise HTTPException(422, f"Unknown direction {decision.selected_direction_id}")
    required = {a["id"] for a in direction["assumptions"]}
    ruled = {r.assumption_id for r in decision.assumption_rulings}
    missing = required - ruled
    if missing:
        raise HTTPException(422, f"Every assumption must be ruled on. Missing: {sorted(missing)}")
    extra = ruled - required
    if extra:
        raise HTTPException(422, f"Rulings reference assumptions outside the selected direction: {sorted(extra)}")

    try:
        await wedge_graph.ainvoke(Command(resume=decision.model_dump()), _config(thread_id))
    except Exception as e:
        log.exception("graph resume failed")
        raise HTTPException(500, f"Playbook failed: {type(e).__name__}: {e}") from e

    v = _values(thread_id)
    if not v.get("playbook"):
        raise HTTPException(500, "Playbook was not produced")
    return {
        "thread_id": thread_id,
        "status": "completed",
        "playbook": v["playbook"],
        "metrics": v.get("metrics", {}),
        "llm_mode": v.get("llm_mode", "llm"),
        "logs": v.get("logs", []),
    }


def _md_escape(s: str) -> str:
    return (s or "").replace("\n", " ").strip()


def _ev_link(eid: str, ev: dict[str, dict[str, Any]]) -> str:
    return f"[{eid}]({ev[eid]['url']})" if eid in ev else eid


def build_markdown(thread_id: str, v: dict[str, Any]) -> str:
    inp = v["input"]
    ev = {e["id"]: e for e in v.get("evidence", [])}
    m = v.get("metrics", {})
    hd = v.get("human_decision") or {}
    pb = v.get("playbook") or {}
    L: list[str] = []
    L += [f"# Wedge Audit Trail — {inp['startup_name']}", "",
          f"- Session: `{thread_id}`", f"- Exported: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
          f"- Generation mode: {v.get('llm_mode', 'llm')}", ""]
    L += ["## 1. Core Idea (kept intact)", "", f"**Pitch:** {_md_escape(inp['pitch'])}", "",
          f"**Target audience:** {_md_escape(inp['target_audience'])}", "",
          f"**Competitors:** {', '.join(inp.get('competitor_names') or []) or '—'}", ""]
    for u in inp.get("competitor_urls", []):
        L.append(f"- <{u}>")
    L += ["", "## 2. Cited Evidence (BM25-filtered, public sources only)", "",
          "_`demo_cache` items are paraphrased summaries of public pages/searches; all other items are verbatim extracts._", ""]
    for e in v.get("evidence", []):
        L += [f"**[{e['id']}]** `{e['source_type']}` — [{_md_escape(e['title'])}]({e['url']})", "",
              f"> {_md_escape(e['snippet'])}", ""]
    L += ["## 3. All 3 Proposed Directions", ""]
    for d in v.get("directions", []):
        chosen = " ✅ **CHOSEN**" if d["id"] == hd.get("selected_direction_id") else ""
        L += [f"### {d['id']} · {d['title']} (`{d['lens']}`){chosen}", "",
              f"{_md_escape(d['summary'])}", "",
              f"- **Market gap:** {_md_escape(d['market_gap'])}",
              f"- **Tradeoff:** {_md_escape(d['tradeoff'])}",
              f"- **Evidence:** {', '.join(_ev_link(i, ev) for i in d['evidence_ids'])}",
              "- **Assumptions:**"]
        for a in d["assumptions"]:
            L.append(f"  - `{a['id']}` {_md_escape(a['statement'])}")
        L.append("")
    L += ["## 4. Founder's Choice & Tweaks (Human Judgment Checkpoint)", ""]
    if hd:
        L += [f"- **Selected direction:** {hd['selected_direction_id']}",
              f"- **Founder tweak:** {_md_escape(hd.get('founder_tweak') or '') or '_(none)_'}", "",
              "| Assumption | Ruling | Note |", "|---|---|---|"]
        for r in hd.get("assumption_rulings", []):
            L.append(f"| {r['assumption_id']} | {r['status']} | {_md_escape(r.get('note') or '')} |")
    else:
        L.append("_Awaiting founder decision._")
    L.append("")
    if pb:
        hook = pb["landing_page_hook"]
        L += ["## 5. Final Direction Playbook", "", f"### {pb['chosen_direction_title']}", "",
              f"**Human judgment impact:** {_md_escape(pb['human_judgment_impact'])}", "",
              f"**Sharpened positioning:** {_md_escape(pb['sharpened_positioning'])}", "",
              "**Landing page hook**", "", f"- Headline: {_md_escape(hook['headline'])}",
              f"- Subheadline: {_md_escape(hook['subheadline'])}",
              f"- Cited evidence: {', '.join(hook.get('cited_evidence_ids', []))}", "",
              "**First 14 days**", ""]
        L += [f"{i}. {_md_escape(s)}" for i, s in enumerate(pb["first_14_days_plan"], 1)]
        L += ["", "## 6. Mom Test Script", ""]
        for i, q in enumerate(pb["mom_test_questions"], 1):
            L += [f"{i}. **{_md_escape(q['question'])}**", f"   - Tests: `{q['target_assumption_id']}` — {_md_escape(q['what_it_validates'])}"]
        L.append("")
    L += ["## 7. AI Disclosure Metrics", "", "| Metric | Value |", "|---|---|",
          f"| Final provider | {m.get('provider')} ({m.get('model')}) |",
          f"| LLM calls | {m.get('total_calls', 0)} |",
          f"| Prompt tokens | {m.get('prompt_tokens', 0)} |",
          f"| Completion tokens | {m.get('completion_tokens', 0)} |",
          f"| Fallback triggered | {m.get('fallback_triggered', False)} |",
          f"| BM25 chunks raw → kept | {m.get('raw_chunks', 0)} → {m.get('kept_chunks', 0)} |",
          f"| Est. tokens saved by BM25 | ~{m.get('estimated_tokens_saved_pct', 0)}% |",
          "| Cost | €0.00 (free tiers) |", "",
          "_Human decision was mandatory: the LangGraph run physically paused at `interrupt()` until the founder selected a direction and ruled on every assumption._", ""]
    return "\n".join(L)


@app.get("/api/session/{thread_id}/export")
async def export(thread_id: str) -> PlainTextResponse:
    v = _values(thread_id)
    md = build_markdown(thread_id, v)
    fname = f"wedge-audit-{v['input']['startup_name'].lower().replace(' ', '-')}-{thread_id}.md"
    return PlainTextResponse(md, media_type="text/markdown; charset=utf-8",
                             headers={"Content-Disposition": f'attachment; filename="{fname}"'})
