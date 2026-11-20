import { Easing, interpolate } from "remotion";
import { loadFont as loadSign } from "@remotion/google-fonts/BigShoulders";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Same tokens as wedge/DESIGN.md: the signal box world.
export const C = {
  ground: "#1A3326",
  panel: "#132A1E",
  deep: "#0E1F16",
  raised: "#24432F",
  rule: "#2F5240",
  muted: "#4A6D58",
  enamel: "#F1E9D2",
  enamelDim: "#CFC6AC",
  enamelDeep: "#E2D7B8",
  ink: "#16241B",
  inkSoft: "#45503F",
  red: "#D7261E",
  redLit: "#FF4A3D",
  amber: "#E8B21A",
  lamp: "#3FD08A",
  leverBlack: "#151815",
};

export const SIGN = loadSign("normal", { weights: ["700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const SANS = loadArchivo("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily;

export const FPS = 30;

const out = Easing.bezier(0.16, 1, 0.3, 1);

/** 0→1 progress between two frames with an exponential ease-out. */
export const prog = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: out });

/** Fade + rise entrance. */
export const rise = (frame: number, start: number, dur = 18, dist = 28): React.CSSProperties => {
  const p = prog(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
};

export const signText: React.CSSProperties = {
  fontFamily: SIGN,
  fontWeight: 800,
  textTransform: "uppercase",
  lineHeight: 0.9,
  letterSpacing: "0.01em",
};
