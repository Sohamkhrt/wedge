import React from "react";
import { C, MONO, SIGN } from "./theme";

export type Route = 1 | 2 | 3;

const LINE_Y = 180;
const SIGNAL_X = 352;
const ROUTE_Y: Record<Route, number> = { 1: 74, 2: LINE_Y, 3: 286 };
const STATIONS = [
  { x: 74, label: "INGEST", sub: "public pages" },
  { x: 164, label: "BM25", sub: "0 tokens" },
  { x: 254, label: "DRAFT", sub: "3 routes" },
];
const LABELS: Record<Route, string> = { 1: "NICHE WEDGE", 2: "DISTRIBUTION CHANNEL", 3: "PRICING FLIP" };

const routeD = (r: Route) =>
  r === 2 ? `M${SIGNAL_X - 20} ${LINE_Y} H975` : `M${SIGNAL_X - 20} ${LINE_Y} H440 C 505 ${LINE_Y} 525 ${ROUTE_Y[r]} 600 ${ROUTE_Y[r]} H975`;

// Sampled polyline of a route so the train can travel it deterministically (no DOM measuring in render).
const cubic = (t: number, a: number, b: number, c: number, d: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
const samples: Record<Route, { x: number; y: number }[]> = { 1: [], 2: [], 3: [] };
([1, 2, 3] as Route[]).forEach((r) => {
  const pts: { x: number; y: number }[] = [];
  if (r === 2) {
    for (let x = SIGNAL_X - 20; x <= 975; x += 4) pts.push({ x, y: LINE_Y });
  } else {
    for (let x = SIGNAL_X - 20; x <= 440; x += 4) pts.push({ x, y: LINE_Y });
    for (let i = 1; i <= 60; i++) {
      const t = i / 60;
      pts.push({ x: cubic(t, 440, 505, 525, 600), y: cubic(t, LINE_Y, LINE_Y, ROUTE_Y[r], ROUTE_Y[r]) });
    }
    for (let x = 604; x <= 975; x += 4) pts.push({ x, y: ROUTE_Y[r] });
  }
  samples[r] = pts;
});
const onRoute = (r: Route, t: number) => {
  const pts = samples[r];
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const target = Math.max(0, Math.min(1, t)) * lens[lens.length - 1];
  let i = lens.findIndex((l) => l >= target);
  if (i <= 0) i = 1;
  const k = (target - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
  const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k;
  const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k;
  const angle = (Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x) * 180) / Math.PI;
  return { x, y, angle };
};

interface Props {
  draw?: number; // 0..1 how much of the track is drawn
  trainX?: number | null; // position on the approach line
  stationsLit?: number; // 0..3
  signal?: "red" | "green";
  redPulse?: number; // 0..1 glow intensity
  plates?: [number, number, number]; // per-plate entrance 0..1
  selected?: Route | null;
  routeT?: number | null; // train progress along selected route
  dimOthers?: number; // 0..1
}

export const Track: React.FC<Props & { style?: React.CSSProperties }> = ({
  draw = 1,
  trainX = 316,
  stationsLit = 0,
  signal = "red",
  redPulse = 0.6,
  plates = [1, 1, 1],
  selected = null,
  routeT = null,
  dimOthers = 0,
  style,
}) => {
  const green = signal === "green";
  const train = selected && routeT !== null ? onRoute(selected, routeT) : trainX !== null ? { x: trainX, y: LINE_Y, angle: 0 } : null;
  return (
    <svg viewBox="0 0 1000 360" style={{ width: "100%", height: "auto", display: "block", ...style }}>
      <path d={`M24 ${LINE_Y} H${SIGNAL_X - 20}`} stroke={green ? C.lamp : C.enamel} strokeOpacity={green ? 1 : 0.6} strokeWidth={6} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
      {trainX !== null && !selected && stationsLit > 0 && (
        <path d={`M24 ${LINE_Y} H${trainX}`} stroke={C.amber} strokeWidth={6} strokeLinecap="round" fill="none" />
      )}
      {([1, 2, 3] as Route[]).map((r, i) => {
        const set = selected === r;
        const lit = set && green;
        const op = selected && !set ? 0.6 - 0.45 * dimOthers : set ? 1 : 0.6;
        const p = plates[i];
        return (
          <g key={r}>
            <path d={routeD(r)} fill="none" stroke={lit ? C.lamp : C.enamel} strokeOpacity={op} strokeWidth={set ? 8 : 6} strokeLinecap="round"
              pathLength={1} strokeDasharray={set && !green ? "0.025 0.012" : "1"} strokeDashoffset={set && !green ? 0 : 1 - draw} />
            <rect x={972} y={ROUTE_Y[r] - 14} width={8} height={28} rx={2} fill={lit ? C.lamp : C.enamel} fillOpacity={draw >= 1 ? op : 0} />
            <g transform={`translate(640 ${ROUTE_Y[r] - 52}) translate(150 18) scale(${0.6 + 0.4 * p}) translate(-150 -18)`} opacity={p * (selected && !set ? 1 - 0.6 * dimOthers : 1)}>
              <rect width={300} height={36} rx={5} fill={lit ? C.lamp : C.enamel} />
              <rect width={40} height={36} rx={5} fill={C.ink} />
              <text x={20} y={27} textAnchor="middle" fontFamily={SIGN} fontWeight={900} fontSize={26} fill={C.enamel}>{r}</text>
              <text x={54} y={25.5} fontFamily={SIGN} fontWeight={800} fontSize={20} letterSpacing={0.5} fill={C.ink}>{LABELS[r]}</text>
            </g>
          </g>
        );
      })}
      {STATIONS.map((s, i) => (
        <g key={s.label} opacity={draw >= 0.5 ? 1 : 0}>
          <circle cx={s.x} cy={LINE_Y} r={9} fill={stationsLit > i ? C.amber : C.panel} stroke={C.enamel} strokeWidth={3} />
          <text x={s.x} y={LINE_Y + 38} textAnchor="middle" fontFamily={SIGN} fontWeight={800} fontSize={19} fill={C.enamel} letterSpacing={0.6}>{s.label}</text>
          <text x={s.x} y={LINE_Y + 56} textAnchor="middle" fontFamily={MONO} fontSize={11} fill={C.enamelDim}>{s.sub}</text>
        </g>
      ))}
      <g opacity={draw >= 0.3 ? 1 : 0}>
        <rect x={SIGNAL_X - 2} y={LINE_Y - 64} width={4} height={58} fill={C.enamel} />
        <rect x={SIGNAL_X - 16} y={LINE_Y - 128} width={32} height={66} rx={16} fill={C.deep} stroke={C.enamel} strokeWidth={2.5} />
        <circle cx={SIGNAL_X} cy={LINE_Y - 111} r={10} fill={green ? "#3a1310" : C.redLit} />
        {!green && <circle cx={SIGNAL_X} cy={LINE_Y - 111} r={14 + 10 * redPulse} fill={C.redLit} opacity={0.12 + 0.25 * redPulse} />}
        <circle cx={SIGNAL_X} cy={LINE_Y - 79} r={10} fill={green ? C.lamp : "#0f3322"} />
        {green && <circle cx={SIGNAL_X} cy={LINE_Y - 79} r={20} fill={C.lamp} opacity={0.3} />}
        <text x={SIGNAL_X + 28} y={LINE_Y - 108} fontFamily={SIGN} fontWeight={900} fontSize={20} fill={C.enamel} letterSpacing={0.6}>HOME SIGNAL</text>
        <text x={SIGNAL_X + 28} y={LINE_Y - 89} fontFamily={MONO} fontSize={11.5} fill={green ? C.lamp : "#FF8A80"}>{green ? "clear · route set" : "danger · held for you"}</text>
        <text x={SIGNAL_X + 28} y={LINE_Y - 73} fontFamily={MONO} fontSize={11} fill={C.enamelDim}>langgraph interrupt()</text>
      </g>
      {train && (
        <g transform={`translate(${train.x} ${train.y}) rotate(${train.angle})`}>
          <rect x={-50} y={-12} width={52} height={24} rx={5} fill={C.enamel} stroke={C.ink} strokeWidth={2} />
          <rect x={-42} y={-6} width={30} height={8} rx={2} fill={C.ink} />
          <circle cx={-4} cy={0} r={3.5} fill={green ? C.lamp : C.amber} />
        </g>
      )}
    </svg>
  );
};
