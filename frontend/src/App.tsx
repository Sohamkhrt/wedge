import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronDown, OctagonAlert, X } from "lucide-react";
import { api } from "./api";
import HeaderMetrics from "./components/HeaderMetrics";
import SetupForm from "./components/SetupForm";
import DirectionBoard from "./components/DirectionBoard";
import EvidenceDrawer from "./components/EvidenceDrawer";
import PlaybookReport from "./components/PlaybookReport";
import TrackDiagram from "./components/TrackDiagram";
import { ROUTE_OF } from "./types";
import type { Demo, DirectionOption, DirectionPlaybook, EvidenceItem, HumanDecision, LlmMode, Metrics, StartupInput } from "./types";

type Stage = "setup" | "analyzing" | "checkpoint" | "building" | "done";

function InTransit({ title, note, building, route }: { title: string; note: string; building: boolean; route: 1 | 2 | 3 | null }) {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-12 sm:px-6" aria-busy="true">
      <h1 className="sign text-[clamp(2.6rem,6vw,4.4rem)] text-enamel">{title}</h1>
      <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-enamel-dim" aria-live="polite">
        {note}
      </p>
      <div className="mt-10 rounded-xl border-2 border-box-950 bg-box-900 shadow-well">
        <div className="overflow-x-auto">
          <div className="min-w-[680px] px-2 py-4 sm:px-6">
            <TrackDiagram phase={building ? "clear" : "running"} selected={route} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [stage, setStage] = useState<Stage>("setup");
  const [demos, setDemos] = useState<Demo[]>([]);
  const [demosError, setDemosError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [startupName, setStartupName] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [directions, setDirections] = useState<DirectionOption[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [llmMode, setLlmMode] = useState<LlmMode | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [decision, setDecision] = useState<HumanDecision | null>(null);
  const [playbook, setPlaybook] = useState<DirectionPlaybook | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    api.demos().then(setDemos).catch(() => setDemosError(true));
  }, []);

  const openEvidence = useCallback((id: string | null) => {
    setFocusId(id);
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const start = async (input: StartupInput) => {
    setError(null);
    setStartupName(input.startup_name);
    setStage("analyzing");
    window.scrollTo({ top: 0 });
    try {
      const r = await api.start(input);
      setThreadId(r.thread_id);
      setEvidence(r.evidence);
      setDirections(r.directions);
      setMetrics(r.metrics);
      setLlmMode(r.llm_mode);
      setLogs(r.logs);
      setStage("checkpoint");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(`The run stopped before the signal: ${(e as Error).message}`);
      setStage("setup");
    }
  };

  const decide = async (d: HumanDecision) => {
    if (!threadId) return;
    setError(null);
    setDecision(d);
    setStage("building");
    window.scrollTo({ top: 0 });
    try {
      const r = await api.decide(threadId, d);
      setPlaybook(r.playbook);
      setMetrics(r.metrics);
      setLlmMode(r.llm_mode);
      setLogs(r.logs);
      setStage("done");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(`The route card could not be built: ${(e as Error).message}. Your ruling is still on the board; try clearing the signal again.`);
      setStage("checkpoint");
    }
  };

  const reset = () => {
    setStage("setup");
    setThreadId(null);
    setEvidence([]);
    setDirections([]);
    setMetrics(null);
    setLlmMode(null);
    setLogs([]);
    setDecision(null);
    setPlaybook(null);
    setError(null);
    setShowLogs(false);
    window.scrollTo({ top: 0 });
  };

  const stageIndex = { setup: 0, analyzing: 1, checkpoint: 2, building: 3, done: 3 }[stage];
  const chosen = decision ? directions.find((d) => d.id === decision.selected_direction_id) : undefined;

  return (
    <div className="min-h-screen">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-enamel focus:px-3 focus:py-2 focus:text-enamel-ink">
        Skip to content
      </a>
      <HeaderMetrics metrics={metrics} llmMode={llmMode} stageIndex={stageIndex} onHome={reset} showNav={stage === "setup"} />

      {error && (
        <div className="mx-auto mt-6 max-w-[1240px] px-4 sm:px-6">
          <div className="flex items-start gap-3 rounded-md bg-aspect-red px-4 py-3 text-[14px] font-medium leading-snug text-enamel" role="alert">
            <OctagonAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="rounded p-0.5 hover:bg-black/20" aria-label="Dismiss message">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div id="content">
        {stage === "setup" && <SetupForm demos={demos} demosError={demosError} onSubmit={start} />}

        {stage === "analyzing" && (
          <InTransit
            title={`${startupName || "Your idea"} is on the approach.`}
            note="Reading public pages, Hacker News and Reddit, ranking the chunks locally, then drafting three routes. The train will stop at the signal and wait for you. Usually 10 to 30 seconds."
            building={false}
            route={null}
          />
        )}

        {stage === "building" && (
          <InTransit
            title="Signal clear. Writing the route card."
            note="Your route, your steer and your three aspects go to the model. Interview questions are aimed at what you marked unverified."
            building
            route={decision ? ROUTE_OF[decision.selected_direction_id] : null}
          />
        )}

        {(stage === "checkpoint" || stage === "done") && (
          <div className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b-2 border-box-950 pb-3 text-[13px]">
              <button onClick={() => openEvidence(null)} className="inline-flex items-center gap-1.5 font-semibold text-enamel hover:text-aspect-amber">
                <BookOpen className="h-4 w-4" aria-hidden /> Evidence register · {evidence.length} sources
              </button>
              <span className="code text-enamel-dim">
                BM25 kept {metrics?.kept_chunks ?? 0} of {metrics?.raw_chunks ?? 0} chunks · run {threadId}
              </span>
              <button
                onClick={() => setShowLogs((s) => !s)}
                aria-expanded={showLogs}
                className="ml-auto inline-flex items-center gap-1 font-semibold text-enamel-dim hover:text-enamel"
              >
                Box log <ChevronDown className={`h-4 w-4 transition-transform ${showLogs ? "rotate-180" : ""}`} aria-hidden />
              </button>
            </div>
            {showLogs && (
              <pre className="code mt-3 max-h-64 overflow-auto rounded-md bg-box-950 p-4 leading-relaxed text-enamel-dim shadow-well">{logs.join("\n")}</pre>
            )}
          </div>
        )}

        {stage === "checkpoint" && (
          <DirectionBoard directions={directions} llmMode={llmMode} submitting={false} onOpenEvidence={openEvidence} onSubmit={decide} />
        )}

        {stage === "done" && playbook && decision && chosen && threadId && (
          <PlaybookReport
            playbook={playbook}
            direction={chosen}
            decision={decision}
            exportUrl={api.exportUrl(threadId)}
            onOpenEvidence={openEvidence}
            onReset={reset}
          />
        )}
      </div>

      <EvidenceDrawer open={drawerOpen} focusId={focusId} evidence={evidence} onClose={closeDrawer} />
    </div>
  );
}
