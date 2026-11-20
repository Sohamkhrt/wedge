import type { LlmMode, Metrics } from "../types";

interface Props {
  metrics: Metrics | null;
  llmMode: LlmMode | null;
  stageIndex: number;
  onHome: () => void;
  showNav: boolean;
}

const STAGES = ["Idea", "Evidence", "Your call", "Route"];

const providerLabel = (p?: string) =>
  p === "groq" ? "Groq · Llama 3.3" : p === "gemini" ? "Gemini 2.5 Flash" : p === "offline-template" ? "Offline template" : "Idle";

function Lamp({ state }: { state: "off" | "green" | "amber" | "red" }) {
  const c = { off: "bg-box-600", green: "bg-aspect-lamp text-aspect-lamp", amber: "bg-aspect-amber text-aspect-amber", red: "bg-aspect-redlit text-aspect-redlit" }[state];
  return <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${c} ${state !== "off" ? "shadow-[0_0_10px_1px_currentColor]" : ""}`} />;
}

function Reading({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className="text-[10px] uppercase tracking-[0.12em] text-enamel-dim/80">{label}</span>
      <span className={`code mt-1 text-[13px] ${accent ? "text-aspect-lamp" : "text-enamel"}`}>{value}</span>
    </span>
  );
}

export default function HeaderMetrics({ metrics: m, llmMode, stageIndex, onHome, showNav }: Props) {
  const lamp = !m || m.provider === "none" ? "off" : llmMode === "offline-template" ? "amber" : m.fallback_triggered ? "amber" : "green";
  return (
    <header className="sticky top-0 z-30 border-b-2 border-box-950 bg-box-900/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        {/* nameboard */}
        <button onClick={onHome} className="plate flex items-center gap-2 rounded-md px-3 py-1" aria-label="Wedge, back to start">
          <span className="sign text-[22px] tracking-[0.06em] text-enamel-ink sm:text-[26px]">Wedge</span>
          <span className="hidden border-l border-enamel-ink/30 pl-2 text-[10px] font-semibold uppercase leading-tight tracking-wider text-enamel-soft sm:block">
            Signal
            <br />
            box
          </span>
        </button>

        {showNav ? (
          <nav className="hidden items-center gap-5 text-sm font-semibold text-enamel-dim md:flex">
            <a href="#how" className="hover:text-enamel">How it works</a>
            <a href="#rules" className="hover:text-enamel">Rules of the box</a>
            <a href="#own" className="hover:text-enamel">Your own idea</a>
          </nav>
        ) : (
          <ol className="hidden items-center gap-1.5 md:flex" aria-label="Progress">
            {STAGES.map((s, i) => (
              <li
                key={s}
                aria-current={i === stageIndex ? "step" : undefined}
                className={`sign rounded px-2.5 py-1.5 text-[15px] ${
                  i === stageIndex
                    ? i === 2
                      ? "bg-aspect-red text-enamel"
                      : "bg-enamel text-enamel-ink"
                    : i < stageIndex
                      ? "bg-box-700 text-enamel-dim"
                      : "text-box-500"
                }`}
              >
                {s}
              </li>
            ))}
          </ol>
        )}

        {/* instrument panel */}
        <div
          className="ml-auto flex items-center gap-3 rounded-md border-2 border-box-950 bg-box-950/70 px-2.5 py-1.5 sm:gap-4 sm:px-3.5"
          title="Live AI usage across every LangGraph node"
        >
          <span className="flex items-center gap-2">
            <Lamp state={lamp} />
            <Reading label="Line" value={providerLabel(m?.provider)} />
          </span>
          <Reading label="Tokens" value={(m?.total_tokens ?? 0).toLocaleString()} />
          <span className="hidden sm:flex">
            <Reading label="Calls" value={String(m?.total_calls ?? 0)} />
          </span>
          <Reading label="Cost" value="€0.00" accent />
          <span className="hidden sm:flex">
            <Reading label="BM25 saved" value={`~${m?.estimated_tokens_saved_pct ?? 0}%`} />
          </span>
          {m?.fallback_triggered && llmMode !== "offline-template" && (
            <span className="code hidden text-aspect-amber lg:inline" title="Groq failed; the router switched to Gemini automatically">
              fallback used
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
