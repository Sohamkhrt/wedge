import { useMemo, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import Lever from "./Lever";
import TrackDiagram from "./TrackDiagram";
import { EvidencePill } from "./EvidenceDrawer";
import { LENS_META, ROUTE_OF } from "../types";
import type { DirectionId, DirectionOption, HumanDecision, LlmMode, Route, RulingStatus } from "../types";

interface Props {
  directions: DirectionOption[];
  llmMode: LlmMode | null;
  submitting: boolean;
  onOpenEvidence: (id: string) => void;
  onSubmit: (decision: HumanDecision) => void;
}

const ASPECTS: { status: RulingStatus; label: string; lamp: string; on: string }[] = [
  { status: "confident", label: "Confident", lamp: "bg-aspect-lamp", on: "border-aspect-lamp bg-aspect-lamp/15 text-enamel-ink" },
  { status: "accept_risk", label: "Accept risk", lamp: "bg-aspect-amber", on: "border-aspect-amber bg-aspect-amber/20 text-enamel-ink" },
  { status: "unverified", label: "Unverified", lamp: "bg-aspect-red", on: "border-aspect-red bg-aspect-red/10 text-enamel-ink" },
];

export default function DirectionBoard({ directions, llmMode, submitting, onOpenEvidence, onSubmit }: Props) {
  const [selected, setSelected] = useState<DirectionId | null>(null);
  const [preview, setPreview] = useState<DirectionId | null>(null);
  const [tweaks, setTweaks] = useState<Record<string, string>>({});
  const [rulings, setRulings] = useState<Record<string, { status: RulingStatus; note: string }>>({});

  const chosen = directions.find((d) => d.id === selected) ?? null;
  const ruled = chosen ? chosen.assumptions.filter((a) => rulings[a.id]).length : 0;
  const total = chosen?.assumptions.length ?? 3;
  const ready = !!chosen && ruled === total;

  const decision = useMemo<HumanDecision | null>(() => {
    if (!chosen || !ready) return null;
    return {
      selected_direction_id: chosen.id,
      founder_tweak: (tweaks[chosen.id] ?? "").trim(),
      assumption_rulings: chosen.assumptions.map((a) => ({ assumption_id: a.id, status: rulings[a.id].status, note: rulings[a.id].note.trim() })),
    };
  }, [chosen, ready, tweaks, rulings]);

  const pick = (id: DirectionId) => {
    setSelected(id);
    window.setTimeout(() => document.getElementById("ruling")?.scrollIntoView({ behavior: "smooth", block: "start" }), 340);
  };
  const byRoute = (r: Route) => directions.find((d) => ROUTE_OF[d.id] === r);

  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-40 pt-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <h1 className="sign text-[clamp(2.6rem,6vw,4.4rem)] text-enamel">
            Held at the signal.
            <span className="block text-aspect-amber">Set the route.</span>
          </h1>
          <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-enamel-dim">
            Three routes for the same idea, each citing its sources. The run is paused on the server and goes nowhere until you pull one lever and rule on what that route assumes.
          </p>
        </div>
        <div className="rounded-xl border-2 border-box-950 bg-box-900 shadow-well lg:col-span-7">
          <div className="overflow-x-auto">
            <div className="min-w-[620px] px-3 py-3">
              <TrackDiagram
                phase="held"
                selected={selected ? ROUTE_OF[selected] : preview ? ROUTE_OF[preview] : null}
                onRouteClick={(r) => {
                  const d = byRoute(r);
                  if (d) pick(d.id);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {llmMode === "offline-template" && (
        <div role="note" className="mt-8 flex items-start gap-3 rounded-md bg-aspect-amber px-4 py-3 text-[14px] font-medium leading-snug text-enamel-ink">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            No AI provider answered, so these routes come from Wedge's fixed offline template, not from analysis of the evidence. Add GROQ_API_KEY or
            GEMINI_API_KEY to backend/.env for routes written from the sources.
          </span>
        </div>
      )}

      {/* route sheets, aligned over the lever frame */}
      <section aria-label="Three proposed routes" className="mt-10">
        <div className="grid gap-x-6 gap-y-10 lg:grid-cols-3">
          {directions.map((d) => {
            const meta = LENS_META[d.lens];
            const isSel = d.id === selected;
            const dim = selected !== null && !isSel;
            return (
              <article
                key={d.id}
                onMouseEnter={() => setPreview(d.id)}
                onMouseLeave={() => setPreview(null)}
                onFocus={() => setPreview(d.id)}
                onBlur={() => setPreview(null)}
                className={`flex flex-col transition-opacity duration-300 ${dim ? "opacity-50 hover:opacity-80" : ""}`}
                aria-current={isSel ? "true" : undefined}
              >
                <div className={`border-t-4 pt-4 transition-colors duration-300 ${isSel ? "border-aspect-lamp" : "border-enamel/70"}`}>
                  <h2 className="sign text-[2.15rem] text-enamel">{d.title}</h2>
                  <p className="mt-2 flex items-baseline justify-between gap-3 text-[14px] font-semibold text-enamel-dim">
                    <span>
                      Route {meta.route}, {meta.label.toLowerCase()}
                    </span>
                    <span className="code font-medium text-enamel-dim/70">{d.id}</span>
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-enamel/90">{d.summary}</p>
                </div>
                <dl className="mt-5 space-y-4 text-[14px] leading-relaxed">
                  <div>
                    <dt className="sign text-base text-aspect-amber">The gap it uses</dt>
                    <dd className="mt-1 text-enamel-dim">{d.market_gap}</dd>
                  </div>
                  <div>
                    <dt className="sign text-base text-aspect-amber">What it costs you</dt>
                    <dd className="mt-1 text-enamel-dim">{d.tradeoff}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[12px] font-semibold uppercase tracking-wider text-enamel-dim">Sources</span>
                  {d.evidence_ids.map((id) => (
                    <EvidencePill key={id} id={id} onOpen={onOpenEvidence} />
                  ))}
                </div>
                <div className="mt-auto pt-7">
                  <div className="rounded-lg border-2 border-box-950 bg-box-900 p-3 shadow-well">
                    <Lever
                      number={meta.route}
                      color="black"
                      pulled={isSel}
                      onClick={() => pick(d.id)}
                      ariaLabel={`Set route ${meta.route}: ${d.title}`}
                      label={isSel ? "Route set" : `Set route ${meta.route}`}
                      sub={meta.label}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* the ruling */}
      {chosen && (
        <section id="ruling" className="mt-16 scroll-mt-24 animate-rise" aria-labelledby="ruling-title">
          <div className="plate plate-screws px-5 pb-8 pt-9 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-enamel-ink pb-4">
              <h2 id="ruling-title" className="sign text-4xl text-enamel-ink sm:text-5xl">
                Your ruling on route {LENS_META[chosen.lens].route}
              </h2>
              <span className="code text-enamel-soft">
                {ruled} of {total} assumptions ruled
              </span>
            </div>

            <div className="mt-7 grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <label htmlFor="tweak" className="sign block text-2xl text-enamel-ink">
                  Steer it <span className="text-base text-enamel-soft">· optional</span>
                </label>
                <p className="mt-1 text-[14px] leading-snug text-enamel-soft">How should this route bend to fit what you are good at, or who you already know?</p>
                <textarea
                  id="tweak"
                  className="field-light mt-3 min-h-[132px]"
                  value={tweaks[chosen.id] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTweaks((prev) => ({ ...prev, [chosen.id]: v }));
                  }}
                  placeholder="Start with tier-2 engineering colleges. I already know three placement officers."
                  maxLength={500}
                />
              </div>

              <div className="lg:col-span-8">
                <h3 className="sign text-2xl text-enamel-ink">
                  Give each assumption an aspect <span className="text-base text-aspect-red">· required</span>
                </h3>
                <p className="mt-1 text-[14px] leading-snug text-enamel-soft">Anything you mark unverified becomes the target of your interview questions.</p>
                <ul className="mt-4 divide-y-2 divide-enamel-ink/15 border-y-2 border-enamel-ink/15">
                  {chosen.assumptions.map((a) => {
                    const r = rulings[a.id];
                    return (
                      <li key={a.id} className="py-4">
                        <p className="text-[15px] font-medium leading-snug text-enamel-ink">
                          <span className="code mr-2 text-enamel-soft">{a.id}</span>
                          {a.statement}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={`Aspect for ${a.id}`}>
                          {ASPECTS.map((x) => {
                            const on = r?.status === x.status;
                            return (
                              <button
                                key={x.status}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => setRulings((prev) => ({ ...prev, [a.id]: { status: x.status, note: prev[a.id]?.note ?? "" } }))}
                                className={`flex items-center gap-2 rounded-md border-2 px-3 py-1.5 font-sign text-[17px] font-bold uppercase tracking-wide transition-colors ${
                                  on ? x.on : "border-enamel-ink/20 text-enamel-soft hover:border-enamel-ink/60 hover:text-enamel-ink"
                                }`}
                              >
                                <span className={`h-3 w-3 rounded-full ${on ? x.lamp : "bg-enamel-ink/20"}`} aria-hidden />
                                {x.label}
                              </button>
                            );
                          })}
                        </div>
                        {r && (
                          <input
                            aria-label={`Note on ${a.id}`}
                            className="field-light mt-3 py-2 text-[14px]"
                            value={r.note}
                            onChange={(e) => {
                              const note = e.target.value;
                              setRulings((prev) => ({ ...prev, [a.id]: { ...prev[a.id], note } }));
                            }}
                            placeholder="Optional: why you believe it, or what would prove it wrong"
                            maxLength={240}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* the signal lever */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-box-950 bg-box-900/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <p className="flex items-center gap-3 text-[14px] text-enamel-dim" aria-live="polite">
            <span className={`h-3 w-3 shrink-0 rounded-full ${ready ? "bg-aspect-lamp shadow-[0_0_10px_#3FD08A]" : "animate-blink bg-aspect-redlit shadow-[0_0_10px_#FF4A3D]"}`} aria-hidden />
            {!chosen
              ? "Signal at danger. Pull one of the three route levers."
              : ready
                ? `Route ${LENS_META[chosen.lens].route} set, ${tweaks[chosen.id]?.trim() ? "steered," : "no steer,"} all ${total} assumptions ruled.`
                : `Route ${LENS_META[chosen.lens].route} set. Rule on ${total - ruled} more assumption${total - ruled === 1 ? "" : "s"} to clear the signal.`}
          </p>
          <button
            type="button"
            disabled={!decision || submitting}
            onClick={() => decision && onSubmit(decision)}
            className="inline-flex items-center gap-2 rounded-md bg-aspect-red px-6 py-3 font-sign text-xl font-extrabold uppercase tracking-wide text-enamel shadow-plate transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:bg-box-700 disabled:text-enamel-dim/60 disabled:shadow-none"
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            Clear the signal · build route card
          </button>
        </div>
      </div>
    </main>
  );
}
