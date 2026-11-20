import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SANS, SIGN, signText } from "./theme";

/** Every scene sits in the green room, with a soft fade at both ends. */
export const Room: React.FC<{ children: React.ReactNode; fade?: number }> = ({ children, fade = 8 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, fade, durationInFrames - fade, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: C.ground, fontFamily: SANS, color: C.enamel }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, transparent 55%, rgba(8,20,13,0.55) 100%)" }} />
      <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Board: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: C.panel,
      border: `3px solid ${C.deep}`,
      borderRadius: 18,
      boxShadow: "inset 0 3px 10px rgba(0,0,0,0.45)",
      padding: "18px 28px",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Plate: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; screws?: boolean }> = ({ children, style, screws = true }) => (
  <div style={{ position: "relative", background: C.enamel, color: C.ink, borderRadius: 14, boxShadow: "0 12px 26px -10px rgba(0,0,0,0.6)", ...style }}>
    {screws && (
      <>
        <span style={{ position: "absolute", top: 12, left: 12, width: 11, height: 11, borderRadius: 99, background: C.enamelDeep, boxShadow: "inset 0 1px 1px rgba(0,0,0,0.35)" }} />
        <span style={{ position: "absolute", top: 12, right: 12, width: 11, height: 11, borderRadius: 99, background: C.enamelDeep, boxShadow: "inset 0 1px 1px rgba(0,0,0,0.35)" }} />
      </>
    )}
    {children}
  </div>
);

/** Lever in the frame: handle rotates with `pull` (0..1), plate lights when thrown. */
export const Lever: React.FC<{ pull: number; color: string; number: number | string; label: string; sub?: string; width?: number }> = ({
  pull,
  color,
  number,
  label,
  sub,
  width = 300,
}) => {
  const lit = pull > 0.55;
  const outline = color === C.leverBlack ? `0 0 0 3px ${C.enamel}AA` : "0 0 0 3px rgba(0,0,0,0.4)";
  return (
    <div style={{ width, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", margin: "0 auto", width: 84, height: 150, background: C.raised, borderRadius: "10px 10px 0 0", boxShadow: "inset 0 3px 8px rgba(0,0,0,0.45)" }}>
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: "50%",
            transform: `translateX(-50%) rotate(${pull * 24}deg)`,
            transformOrigin: "bottom center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: 54, height: 30, borderRadius: 9, background: color, boxShadow: outline }} />
          <div style={{ width: 15, height: 100, background: color, boxShadow: color === C.leverBlack ? `0 0 0 2px ${C.enamel}AA` : "none" }} />
        </div>
      </div>
      <div
        style={{
          background: lit ? C.lamp : C.enamel,
          color: C.ink,
          borderRadius: "0 0 14px 14px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 12px 26px -10px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ ...signText, width: 56, height: 56, borderRadius: 6, background: C.ink, color: C.enamel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0 }}>
          {number}
        </div>
        <div>
          <div style={{ ...signText, fontSize: 30 }}>{label}</div>
          {sub && <div style={{ fontFamily: SANS, fontSize: 18, color: C.inkSoft, marginTop: 4 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
};

export const Lamp: React.FC<{ color: string; on: number; size?: number }> = ({ color, on, size = 22 }) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: 99,
      background: on > 0.5 ? color : "rgba(22,36,27,0.2)",
      boxShadow: on > 0.5 ? `0 0 ${16 * on}px ${3 * on}px ${color}` : "none",
      flexShrink: 0,
    }}
  />
);

export const Caption: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: SIGN, fontWeight: 700, fontSize: 30, letterSpacing: "0.04em", textTransform: "uppercase", color: C.enamelDim, ...style }}>{children}</div>
);
