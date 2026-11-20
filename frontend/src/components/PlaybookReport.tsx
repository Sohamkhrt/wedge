import { Download, RotateCcw } from "lucide-react";
import TrackDiagram from "./TrackDiagram";
import { EvidencePill } from "./EvidenceDrawer";
import { LENS_META } from "../types";
import type { DirectionOption, DirectionPlaybook, HumanDecision, RulingStatus } from "../types";

interface Props {
  playbook: DirectionPlaybook;
  direction: DirectionOption;
  decision: HumanDecision;
  exportUrl: string;
  onOpenEvidence: (id: string) => void;
  onReset: () => void;
}

const ASPECT: Record<RulingStatus, { label: string; lamp: string }> = {
  confident: { label: "Confident", lamp: "bg-aspect-lamp" },
  accept_risk: { label: "Accept risk", lamp: "bg-aspect-amber" },
  unverified: { label: "Unverified", lamp: "bg-aspect-redlit" },
};

export default function PlaybookReport({ playbook, direction, decision, exportUrl, onOpenEvidence, onReset }: Props) {
  const meta = LENS_META[direction.lens];
  const statusOf = (id: string) => decision.assumption_rulings.find((r) => r.assumption_id === id)?.status;
  const statement = (id: string) => direction.assumptions.find((a) => a.id === id)?.statement ?? "";

  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-6">
          <h1 className="sign text-[clamp(2.6rem,6vw,4.6rem)] text-enamel">{playbook.chosen_direction_title}</h1>
          <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-aspect-lamp">
            <span className="h-2.5 w-2.5 rounded-full bg-aspect-lamp shadow-[0_0_10px_#3FD08A]" aria-hidden />
            Signal clear on route {meta.route}, {meta.label.toLowerCase()}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={exportUrl} download className="btn-cream">
              <Download className="h-5 w-5" aria-hidden /> Download logbook (.md)
            </a>
            <button type="button" onClick={onReset} className="btn-line">
              <RotateCcw className="h-5 w-5" aria-hidden /> New run
            </button>
          </div>
        </div>
        <div className="rounded-xl border-2 border-box-950 bg-box-900 shadow-well lg:col-span-6">
          <div className="overflow-x-auto">
            <div className="min-w-[560px] px-3 py-3">
              <TrackDiagram phase="arrived" selected={meta.route} />
            </div>
          </div>
        </div>
      </div>

      {/* what the human changed */}
      <section className="mt-12 grid gap-8 rounded-xl bg-box-900 p-6 shadow-well sm:p-8 lg:grid-cols-12" aria-labelledby="impact">
        <div className="lg:col-span-7">
          <h2 id="impact" className="sign text-3xl text-aspect-amber">What your ruling changed</h2>
          <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-enamel">{playbook.human_judgment_impact}</p>
        </div>
        <ul className="space-y-2.5 lg:col-span-5" aria-label="Your ruling">
          <li className="flex items-start gap-3 text-[14px] text-enamel-dim">
            <span className="sign w-16 shrink-0 text-base text-enamel">Route</span>
            <span>
              {meta.route} · {direction.title}
            </span>
          </li>
          {decision.founder_tweak && (
            <li className="flex items-start gap-3 text-[14px] text-enamel-dim">
              <span className="sign w-16 shrink-0 text-base text-enamel">Steer</span>
              <span>{decision.founder_tweak}</span>
            </li>
          )}
          {decision.assumption_rulings.map((r) => (
            <li key={r.assumption_id} className="flex items-start gap-3 text-[14px] text-enamel-dim">
              <span className="flex w-16 shrink-0 items-center gap-1.5 pt-0.5">
                <span className={`h-2.5 w-2.5 rounded-full ${ASPECT[r.status].lamp}`} aria-hidden />
                <span className="code text-enamel">{r.assumption_id.slice(-1)}</span>
              </span>
              <span>
                <span className="font-semibold text-enamel">{ASPECT[r.status].label}.</span> {statement(r.assumption_id)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* the route card */}
      <article className="plate plate-screws mt-8 overflow-hidden" aria-label="Route card">
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-enamel-ink px-6 pb-4 pt-9 sm:px-10">
          <h2 className="sign text-4xl text-enamel-ink sm:text-5xl">Route card</h2>
          <span className="code text-enamel-soft">valid for the first 14 days</span>
        </header>

        <div className="grid lg:grid-cols-12">
          <div className="px-6 py-8 sm:px-10 lg:col-span-7 lg:border-r-2 lg:border-enamel-ink/15">
            <h3 className="sign text-2xl text-enamel-ink">Positioning</h3>
            <p className="mt-3 text-[19px] leading-relaxed text-enamel-ink">{playbook.sharpened_positioning}</p>

            <h3 className="sign mt-10 text-2xl text-enamel-ink">Departures</h3>
            <ol className="mt-4">
              {playbook.first_14_days_plan.map((step, i) => (
                <li key={i} className="relative flex gap-5 pb-6 last:pb-0">
                  {i < playbook.first_14_days_plan.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-1 bg-enamel-ink/80" aria-hidden />}
                  <span className="sign relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-enamel-ink bg-enamel text-lg text-enamel-ink">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-[15px] leading-relaxed text-enamel-ink">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-enamel-deep/60 px-6 py-8 sm:px-10 lg:col-span-5">
            <h3 className="sign text-2xl text-enamel-ink">Landing page hook</h3>
            <div className="mt-4 rounded-lg bg-box-800 px-6 py-8 text-enamel shadow-plate">
              <p className="sign text-[2.1rem] text-enamel">{playbook.landing_page_hook.headline}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-enamel-dim">{playbook.landing_page_hook.subheadline}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] font-semibold uppercase tracking-wider text-enamel-soft">Cited</span>
              {playbook.landing_page_hook.cited_evidence_ids.map((id) => (
                <EvidencePill key={id} id={id} tone="light" onOpen={onOpenEvidence} />
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* interview script */}
      <section className="mt-16" aria-labelledby="script">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="script" className="sign text-5xl text-enamel">Interview script</h2>
          <p className="max-w-[46ch] text-[14px] text-enamel-dim">Mom Test rules: ask about what people already did and paid for, never whether they would use it.</p>
        </div>
        <ol className="mt-6 divide-y-2 divide-box-950 border-y-2 border-box-950">
          {playbook.mom_test_questions.map((q, i) => {
            const st = statusOf(q.target_assumption_id);
            return (
              <li key={i} className="grid gap-3 py-6 md:grid-cols-12 md:gap-8">
                <span className="sign text-4xl text-aspect-amber md:col-span-1">Q{i + 1}</span>
                <p className="text-[19px] font-medium leading-snug text-enamel md:col-span-7">{q.question}</p>
                <div className="text-[13px] leading-snug text-enamel-dim md:col-span-4">
                  <span className="mb-1.5 flex items-center gap-2">
                    {st && <span className={`h-2.5 w-2.5 rounded-full ${ASPECT[st].lamp}`} aria-hidden />}
                    <span className="code text-enamel">{q.target_assumption_id}</span>
                    {st && <span>{ASPECT[st].label}</span>}
                  </span>
                  {q.what_it_validates || statement(q.target_assumption_id)}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
