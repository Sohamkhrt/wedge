import { useEffect, useRef, useState } from "react";
import type { Route } from "../types";

export type TrackPhase = "idle" | "running" | "held" | "clear" | "arrived";

interface Props {
  phase: TrackPhase;
  selected: Route | null;
  /** Optional labels shown on the route plates (defaults to the lens names). */
  labels?: Partial<Record<Route, string>>;
  onRouteClick?: (r: Route) => void;
  className?: string;
}

// Geometry of the board (viewBox 1000 x 360). Shapes are specified exactly; no illustration.
const LINE_Y = 180;
const SIGNAL_X = 352;
const HOLD_X = 316; // where the train waits, nose short of the signal
const ROUTE_Y: Record<Route, number> = { 1: 74, 2: LINE_Y, 3: 286 };
const routePath = (r: Route) =>
  r === 2 ? `M${SIGNAL_X - 20} ${LINE_Y} H975` : `M${SIGNAL_X - 20} ${LINE_Y} H440 C 505 ${LINE_Y} 525 ${ROUTE_Y[r]} 600 ${ROUTE_Y[r]} H975`;
const STATIONS = [
  { x: 74, label: "Ingest", sub: "public pages" },
  { x: 164, label: "BM25", sub: "0 tokens" },
  { x: 254, label: "Draft", sub: "3 routes" },
];
const DEFAULT_LABELS: Record<Route, string> = { 1: "Niche wedge", 2: "Distribution channel", 3: "Pricing flip" };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function TrackDiagram({ phase, selected, labels, onRouteClick, className = "" }: Props) {
  const pathRefs = useRef<Record<Route, SVGPathElement | null>>({ 1: null, 2: null, 3: null });
  const [train, setTrain] = useState({ x: HOLD_X, y: LINE_Y, angle: 0 });
  const [approachX, setApproachX] = useState(HOLD_X);

  useEffect(() => {
    let raf = 0;
    const animate = (duration: number, step: (k: number) => void) => {
      if (reduced()) {
        step(1);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / duration);
        step(easeOut(k));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const onRoute = (r: Route, frac: number) => {
      const p = pathRefs.current[r];
      if (!p) return;
      const len = p.getTotalLength();
      const a = p.getPointAtLength(Math.max(0, frac * len));
      const b = p.getPointAtLength(Math.min(len, frac * len + 2));
      setTrain({ x: a.x, y: a.y, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
    };

    if (phase === "idle" || phase === "held") {
      setTrain({ x: HOLD_X, y: LINE_Y, angle: 0 });
      setApproachX(HOLD_X);
    } else if (phase === "running") {
      // The request takes 10-25 s; ease out so the train is near the signal when the graph pauses.
      animate(16000, (k) => {
        const x = 30 + (HOLD_X - 30) * k;
        setApproachX(x);
        setTrain({ x, y: LINE_Y, angle: 0 });
      });
    } else if (selected) {
      const end = phase === "arrived" ? 0.88 : 0.88;
      const dur = phase === "arrived" ? 900 : 9000;
      setApproachX(SIGNAL_X);
      animate(dur, (k) => onRoute(selected, 0.05 + (end - 0.05) * k));
    }
    return () => cancelAnimationFrame(raf);
  }, [phase, selected]);

  const stopped = phase === "idle" || phase === "running" || phase === "held";
  const routeLabel = (r: Route) => labels?.[r] ?? DEFAULT_LABELS[r];

  return (
    <svg
      viewBox="0 0 1000 360"
      className={`block h-auto w-full select-none ${className}`}
      role="img"
      aria-label={`Track diagram. Signal is ${stopped ? "at danger: the agent is held until you choose" : "clear"}${selected ? `; route ${selected} is set` : ""}.`}
    >
      {/* rails */}
      <path d={`M24 ${LINE_Y} H${SIGNAL_X - 20}`} stroke="#F1E9D2" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" fill="none" />
      {phase === "running" && (
        <path d={`M24 ${LINE_Y} H${approachX}`} stroke="#E8B21A" strokeWidth="6" strokeLinecap="round" fill="none" />
      )}
      {!stopped && <path d={`M24 ${LINE_Y} H${SIGNAL_X - 20}`} stroke="#3FD08A" strokeWidth="6" strokeLinecap="round" fill="none" />}

      {([1, 2, 3] as Route[]).map((r) => {
        const set = selected === r;
        const lit = set && !stopped;
        return (
          <g key={r}>
            <path
              ref={(el) => (pathRefs.current[r] = el)}
              d={routePath(r)}
              fill="none"
              stroke={lit ? "#3FD08A" : set ? "#F1E9D2" : "#F1E9D2"}
              strokeOpacity={lit ? 1 : set ? 0.95 : selected ? 0.2 : 0.55}
              strokeWidth={set ? 8 : 6}
              strokeLinecap="round"
              strokeDasharray={set && stopped ? "18 10" : undefined}
              className="transition-[stroke-opacity,stroke-width] duration-300"
            />
            {/* buffer stop */}
            <rect x="972" y={ROUTE_Y[r] - 14} width="8" height="28" rx="2" fill={lit ? "#3FD08A" : "#F1E9D2"} fillOpacity={selected && !set ? 0.25 : 0.8} />
            {/* route plate */}
            <g
              transform={`translate(640 ${ROUTE_Y[r] - 52})`}
              onClick={onRouteClick ? () => onRouteClick(r) : undefined}
              style={{ cursor: onRouteClick ? "pointer" : "default" }}
              opacity={selected && !set ? 0.4 : 1}
              className="transition-opacity duration-300"
            >
              <rect width="300" height="36" rx="5" fill={set ? (lit ? "#3FD08A" : "#F1E9D2") : "#F1E9D2"} />
              <rect x="0" width="40" height="36" rx="5" fill="#16241B" />
              <text x="20" y="27" textAnchor="middle" fontFamily="Big Shoulders Display" fontWeight="900" fontSize="26" fill="#F1E9D2">
                {r}
              </text>
              <text x="54" y="25.5" fontFamily="Big Shoulders Display" fontWeight="800" fontSize="20" letterSpacing="0.5" fill="#16241B">
                {routeLabel(r).toUpperCase().slice(0, 26)}
              </text>
            </g>
          </g>
        );
      })}

      {/* approach stations */}
      {STATIONS.map((s) => {
        const passed = !stopped || phase === "held" || (phase === "running" && approachX >= s.x);
        return (
          <g key={s.label}>
            <circle cx={s.x} cy={LINE_Y} r="9" fill={passed ? "#E8B21A" : "#132A1E"} stroke="#F1E9D2" strokeWidth="3" className="transition-colors duration-300" />
            <text x={s.x} y={LINE_Y + 38} textAnchor="middle" fontFamily="Big Shoulders Display" fontWeight="800" fontSize="19" fill="#F1E9D2" letterSpacing="0.6">
              {s.label.toUpperCase()}
            </text>
            <text x={s.x} y={LINE_Y + 56} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fill="#CFC6AC">
              {s.sub}
            </text>
          </g>
        );
      })}

      {/* home signal: the human checkpoint */}
      <g>
        <rect x={SIGNAL_X - 2} y={LINE_Y - 64} width="4" height="58" fill="#F1E9D2" />
        <rect x={SIGNAL_X - 16} y={LINE_Y - 128} width="32" height="66" rx="16" fill="#0E1F16" stroke="#F1E9D2" strokeWidth="2.5" />
        <circle cx={SIGNAL_X} cy={LINE_Y - 111} r="10" fill={stopped ? "#FF4A3D" : "#3a1310"} />
        {stopped && <circle cx={SIGNAL_X} cy={LINE_Y - 111} r="17" fill="#FF4A3D" opacity="0.25" />}
        <circle cx={SIGNAL_X} cy={LINE_Y - 79} r="10" fill={stopped ? "#0f3322" : "#3FD08A"} />
        {!stopped && <circle cx={SIGNAL_X} cy={LINE_Y - 79} r="17" fill="#3FD08A" opacity="0.25" />}
        <text x={SIGNAL_X + 28} y={LINE_Y - 108} fontFamily="Big Shoulders Display" fontWeight="900" fontSize="20" fill="#F1E9D2" letterSpacing="0.6">
          HOME SIGNAL
        </text>
        <text x={SIGNAL_X + 28} y={LINE_Y - 89} fontFamily="JetBrains Mono" fontSize="11.5" fill={stopped ? "#FF8A80" : "#3FD08A"}>
          {stopped ? "danger · held for you" : "clear · route set"}
        </text>
        <text x={SIGNAL_X + 28} y={LINE_Y - 73} fontFamily="JetBrains Mono" fontSize="11" fill="#CFC6AC">
          langgraph interrupt()
        </text>
      </g>

      {/* the train (the agent) */}
      <g transform={`translate(${train.x} ${train.y}) rotate(${train.angle})`}>
        <rect x="-50" y="-12" width="52" height="24" rx="5" fill="#F1E9D2" stroke="#16241B" strokeWidth="2" />
        <rect x="-42" y="-6" width="30" height="8" rx="2" fill="#16241B" />
        <circle cx="-4" cy="0" r="3.5" fill={stopped ? "#E8B21A" : "#3FD08A"} />
      </g>
    </svg>
  );
}
