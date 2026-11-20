import React from "react";
import { AbsoluteFill } from "remotion";
import { Board, Plate } from "./Parts";
import { Track } from "./Track";
import { C, MONO, SANS, signText } from "./theme";

/** 3:2 submission thumbnail (1500 x 1000). */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: C.ground, fontFamily: SANS, color: C.enamel, padding: "56px 80px" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, transparent 55%, rgba(8,20,13,0.55) 100%)" }} />
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Plate style={{ padding: "16px 40px 12px" }}>
        <span style={{ ...signText, fontSize: 84, letterSpacing: "0.06em", color: C.ink }}>Wedge</span>
      </Plate>
      <span style={{ fontFamily: MONO, fontSize: 24, color: C.enamelDim, textAlign: "right", lineHeight: 1.5 }}>
        AI Agents for Founders
        <br />
        HETIC 2026
      </span>
    </div>
    <div style={{ position: "relative", marginTop: 40 }}>
      <div style={{ ...signText, fontSize: 104 }}>The agent stops at red.</div>
      <div style={{ ...signText, fontSize: 104, color: C.amber, marginTop: 8 }}>You throw the lever.</div>
    </div>
    <Board style={{ position: "relative", marginTop: 36, padding: "4px 22px" }}>
      <Track trainX={316} stationsLit={3} redPulse={0.9} selected={1} routeT={null} />
    </Board>
  </AbsoluteFill>
);
