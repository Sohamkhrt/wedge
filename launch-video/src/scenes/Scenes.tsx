import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Board, Caption, Lamp, Lever, Plate, Room } from "../Parts";
import { Track } from "../Track";
import { C, MONO, prog, rise, SANS, SIGN, signText } from "../theme";

const pulse = (f: number) => 0.5 + 0.5 * Math.sin(f / 6);

/* ───────────── 1 · Cold open: a red lamp, and the problem ───────────── */
export const ColdOpen: React.FC = () => {
  const f = useCurrentFrame();
  const lamp = prog(f, 0, 22);
  const strike = prog(f, 72, 16);
  return (
    <Room>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 64 }}>
        <div style={{ opacity: lamp, transform: `scale(${0.8 + 0.2 * lamp})`, width: 92, height: 190, borderRadius: 99, background: C.deep, border: `5px solid ${C.enamel}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-around", padding: "18px 0" }}>
          <span style={{ width: 56, height: 56, borderRadius: 99, background: C.redLit, boxShadow: `0 0 ${30 + 30 * pulse(f)}px ${8 + 6 * pulse(f)}px ${C.redLit}88` }} />
          <span style={{ width: 56, height: 56, borderRadius: 99, background: "#0f3322" }} />
        </div>
        <div style={{ ...signText, fontSize: 96, textAlign: "center", ...rise(f, 24) }}>
          Every AI tool tells founders to{" "}
          <span style={{ position: "relative", color: C.amber, whiteSpace: "nowrap" }}>
            pivot.
            <span style={{ position: "absolute", left: -8, right: -8, top: "48%", height: 10, background: C.red, transformOrigin: "left", transform: `scaleX(${strike})` }} />
          </span>
        </div>
      </AbsoluteFill>
    </Room>
  );
};

/* ───────────── 2 · The reframe ───────────── */
export const Reframe: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Room>
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 140px" }}>
        <div style={{ ...signText, fontSize: 128, ...rise(f, 4, 20, 40) }}>You don't need a new idea.</div>
        <div style={{ ...signText, fontSize: 128, color: C.amber, marginTop: 24, ...rise(f, 46, 20, 40) }}>You need the angle that wins.</div>
      </AbsoluteFill>
    </Room>
  );
};

/* ───────────── 3 · Nameboard reveal ───────────── */
export const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 4, fps, config: { damping: 200, stiffness: 120 } });
  return (
    <Room>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Plate style={{ padding: "54px 120px 46px", transform: `scale(${0.85 + 0.15 * s})`, opacity: s }}>
          <div style={{ ...signText, fontSize: 260, letterSpacing: "0.06em", color: C.ink }}>Wedge</div>
        </Plate>
        <div style={{ fontFamily: SANS, fontSize: 44, marginTop: 48, color: C.enamel, ...rise(f, 30) }}>The evidence-backed direction engine for founders.</div>
        <div style={{ fontFamily: MONO, fontSize: 24, marginTop: 22, color: C.enamelDim, ...rise(f, 48) }}>AI Agents for Founders Challenge · HETIC 2026</div>
      </AbsoluteFill>
    </Room>
  );
};

/* ───────────── 4 · The approach (automatic) ───────────── */
const APPROACH = [
  { at: 70, title: "Ingest", body: "Competitor pages, Hacker News, public Reddit. No personal data, ever." },
  { at: 150, title: "BM25", body: "Ranked locally. The 15 most relevant passages are kept, for 0 tokens." },
  { at: 220, title: "Draft", body: "Three cited routes for the same idea: a niche, a channel, a pricing model." },
];
export const Approach: React.FC = () => {
  const f = useCurrentFrame();
  const draw = prog(f, 0, 50);
  const trainX = interpolate(f, [55, 270], [30, 316], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lit = APPROACH.filter((s) => f >= s.at).length;
  const current = [...APPROACH].reverse().find((s) => f >= s.at);
  return (
    <Room>
      <AbsoluteFill style={{ padding: "60px 140px", justifyContent: "center" }}>
        <div style={{ ...signText, fontSize: 84, ...rise(f, 0) }}>
          Paste your idea. <span style={{ color: C.amber }}>Wedge reads the market.</span>
        </div>
        <Board style={{ marginTop: 50 }}>
          <Track draw={draw} trainX={f > 55 ? trainX : null} stationsLit={lit} plates={[0, 0, 0]} />
        </Board>
        <div style={{ marginTop: 40, height: 120 }}>
          {current && (
            <div key={current.title} style={{ display: "flex", alignItems: "baseline", gap: 30, ...rise(f, current.at, 14, 18) }}>
              <span style={{ ...signText, fontSize: 64, color: C.amber, width: 220 }}>{current.title}</span>
              <span style={{ fontSize: 40, color: C.enamel, maxWidth: 1250, lineHeight: 1.3 }}>{current.body}</span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </Room>
  );
};

/* ───────────── 5 · Held at the signal ───────────── */
export const Held: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plate = (i: number) => spring({ frame: f - (60 + i * 14), fps, config: { damping: 14, stiffness: 160 } });
  return (
    <Room>
      <AbsoluteFill style={{ padding: "60px 140px", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ ...signText, fontSize: 120, ...rise(f, 0) }}>
            Then the agent <span style={{ color: C.redLit }}>stops.</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 30, color: C.enamelDim, paddingBottom: 10, ...rise(f, 20) }}>langgraph interrupt()</div>
        </div>
        <Board style={{ marginTop: 44 }}>
          <Track trainX={316} stationsLit={3} redPulse={pulse(f)} plates={[plate(0), plate(1), plate(2)]} />
        </Board>
        <div style={{ marginTop: 40, display: "flex", gap: 22, alignItems: "center", ...rise(f, 120) }}>
          <span style={{ fontSize: 38 }}>Three routes. Every claim cites its source.</span>
          {["EV-01", "EV-04", "EV-02", "EV-05", "EV-03"].map((ev, i) => (
            <span key={ev} style={{ fontFamily: MONO, fontSize: 28, background: C.enamel, color: C.ink, padding: "4px 12px", borderRadius: 6, ...rise(f, 130 + i * 6, 12, 12) }}>{ev}</span>
          ))}
        </div>
      </AbsoluteFill>
    </Room>
  );
};

/* ───────────── 6 · You throw the lever ───────────── */
const RULINGS = [
  { at: 150, text: "This segment feels the pain more sharply than the market.", aspect: "Confident", color: C.lamp },
  { at: 180, text: "It can be reached through a few shared places.", aspect: "Unverified", color: C.red },
  { at: 210, text: "Winning it creates proof to expand.", aspect: "Accept risk", color: C.amber },
];
const STEER = "Start with tier-2 engineering colleges.";
export const Levers: React.FC = () => {
  const f = useCurrentFrame();
  const pull = prog(f, 50, 14);
  const typed = Math.floor(interpolate(f, [80, 130], [0, STEER.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <Room>
      <AbsoluteFill style={{ padding: "60px 140px", justifyContent: "center" }}>
        <div style={{ ...signText, fontSize: 130, ...rise(f, 0) }}>
          You <span style={{ color: C.amber }}>throw the lever.</span>
        </div>
        <div style={{ display: "flex", gap: 60, marginTop: 50 }}>
          <Board style={{ display: "flex", gap: 22, padding: 22, alignSelf: "flex-start", ...rise(f, 10) }}>
            <Lever pull={pull} color={C.leverBlack} number={1} label={pull > 0.55 ? "Route set" : "Niche"} sub="Niche wedge" width={250} />
            <Lever pull={0} color={C.leverBlack} number={2} label="Channel" sub="Distribution" width={250} />
            <Lever pull={0} color={C.leverBlack} number={3} label="Pricing" sub="Pricing flip" width={250} />
          </Board>
          <Plate style={{ flex: 1, padding: "40px 40px 30px", ...rise(f, 70) }}>
            <div style={{ ...signText, fontSize: 46 }}>Your steer</div>
            <div style={{ fontFamily: SANS, fontSize: 34, marginTop: 10, minHeight: 46, borderBottom: `3px solid ${C.ink}30`, paddingBottom: 10 }}>
              {STEER.slice(0, typed)}
              {f >= 80 && typed < STEER.length && <span style={{ color: C.red }}>|</span>}
            </div>
            <div style={{ ...signText, fontSize: 46, marginTop: 32 }}>Your ruling</div>
            {RULINGS.map((r) => {
              const on = prog(f, r.at, 8);
              return (
                <div key={r.aspect} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 22 }}>
                  <Lamp color={r.color} on={on} size={28} />
                  <span style={{ fontSize: 30, flex: 1, color: C.ink, lineHeight: 1.25 }}>{r.text}</span>
                  <span style={{ ...signText, fontSize: 32, color: on > 0.5 ? C.ink : `${C.ink}40`, width: 190, textAlign: "right" }}>{r.aspect}</span>
                </div>
              );
            })}
          </Plate>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.enamelDim, marginTop: 34, ...rise(f, 70) }}>
          Example run · CampusATS · the API will not continue until every assumption is ruled
        </div>
      </AbsoluteFill>
    </Room>
  );
};

/* ───────────── 7 · Signal clear → the route card ───────────── */
const DEPARTURES = [
  "Interview 8 final-year students at tier-2 colleges.",
  "Publish the landing page and track sign-ups.",
  "Answer real questions in two student communities.",
  "Deliver the first 3 resumes by hand.",
];
export const RouteCard: React.FC = () => {
  const f = useCurrentFrame();
  const routeT = interpolate(f, [10, 110], [0.05, 0.86], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const card = prog(f, 70, 24);
  return (
    <Room>
      <AbsoluteFill style={{ padding: "60px 140px", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 50, alignItems: "flex-end" }}>
          <div style={{ ...signText, fontSize: 110, flex: 1, ...rise(f, 0) }}>
            Signal <span style={{ color: C.lamp }}>clear.</span>
          </div>
          <Board style={{ width: 820, padding: "8px 14px" }}>
            <Track trainX={null} stationsLit={3} signal="green" selected={1} routeT={routeT} dimOthers={1} />
          </Board>
        </div>
        <Plate style={{ marginTop: 40, padding: "40px 46px", opacity: card, transform: `translateY(${(1 - card) * 80}px)`, display: "flex", gap: 50 }}>
          <div style={{ flex: 1.2 }}>
            <div style={{ ...signText, fontSize: 64 }}>Route card</div>
            <div style={{ ...signText, fontSize: 30, marginTop: 24, color: C.inkSoft }}>Departures · first 14 days</div>
            {DEPARTURES.map((d, i) => (
              <div key={d} style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 16, ...rise(f, 100 + i * 12, 12, 12) }}>
                <span style={{ ...signText, width: 44, height: 44, borderRadius: 99, border: `5px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{i + 1}</span>
                <span style={{ fontSize: 28 }}>{d}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: `${C.enamelDeep}AA`, borderRadius: 12, padding: "30px 32px" }}>
            <div style={{ ...signText, fontSize: 30, color: C.inkSoft }}>Interview script · Mom Test</div>
            <div style={{ fontSize: 32, marginTop: 18, lineHeight: 1.3, fontWeight: 500, ...rise(f, 150) }}>“Tell me about the last time you prepared a resume for a placement drive.”</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, ...rise(f, 165) }}>
              <Lamp color={C.red} on={1} size={18} />
              <span style={{ fontFamily: MONO, fontSize: 22 }}>targets: unverified assumption</span>
            </div>
          </div>
        </Plate>
      </AbsoluteFill>
    </Room>
  );
};

/* ───────────── 8 · The machinery stays visible ───────────── */
const FACTS = [
  { k: "Cost", v: "€0.00", c: C.lamp, d: "Free tiers only." },
  { k: "Line", v: "Groq → Gemini", c: C.enamel, d: "Automatic fallback on any failure." },
  { k: "Sources", v: "Every claim cited", c: C.amber, d: "Verified against the evidence corpus." },
  { k: "Logbook", v: "Audit trail .md", c: C.enamel, d: "Evidence, routes, your call, AI disclosure." },
];
export const Machinery: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Room>
      <AbsoluteFill style={{ padding: "60px 140px", justifyContent: "center" }}>
        <div style={{ ...signText, fontSize: 120, ...rise(f, 0) }}>
          The machinery <span style={{ color: C.amber }}>stays visible.</span>
        </div>
        <Board style={{ marginTop: 60, padding: "34px 44px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "44px 70px" }}>
          {FACTS.map((x, i) => (
            <div key={x.k} style={{ display: "flex", gap: 24, alignItems: "flex-start", ...rise(f, 20 + i * 14) }}>
              <span style={{ marginTop: 14 }}>
                <Lamp color={x.c === C.enamel ? C.lamp : x.c} on={prog(f, 26 + i * 14, 6)} size={20} />
              </span>
              <div>
                <div style={{ fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: C.enamelDim }}>{x.k}</div>
                <div style={{ fontFamily: SIGN, fontWeight: 800, fontSize: 72, textTransform: "uppercase", lineHeight: 1, color: x.c, marginTop: 6 }}>{x.v}</div>
                <div style={{ fontSize: 28, color: C.enamelDim, marginTop: 10 }}>{x.d}</div>
              </div>
            </div>
          ))}
        </Board>
        <Caption style={{ marginTop: 36, ...rise(f, 90) }}>Public data only · no LinkedIn · no usernames stored</Caption>
      </AbsoluteFill>
    </Room>
  );
};

/* ───────────── 9 · End card ───────────── */
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const green = f >= 70;
  const s = spring({ frame: f - 96, fps, config: { damping: 200 } });
  return (
    <Room fade={10}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
          <div style={{ width: 84, height: 170, borderRadius: 99, background: C.deep, border: `5px solid ${C.enamel}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-around", padding: "14px 0", ...rise(f, 0) }}>
            <span style={{ width: 50, height: 50, borderRadius: 99, background: green ? "#3a1310" : C.redLit, boxShadow: green ? "none" : `0 0 40px 10px ${C.redLit}77` }} />
            <span style={{ width: 50, height: 50, borderRadius: 99, background: green ? C.lamp : "#0f3322", boxShadow: green ? `0 0 40px 10px ${C.lamp}77` : "none" }} />
          </div>
          <div>
            <div style={{ ...signText, fontSize: 130, ...rise(f, 8) }}>The agent stops at red.</div>
            <div style={{ ...signText, fontSize: 130, color: C.amber, marginTop: 14, ...rise(f, 40) }}>You throw the lever.</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 80, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
          <Plate screws={false} style={{ padding: "10px 30px" }}>
            <span style={{ ...signText, fontSize: 64, letterSpacing: "0.06em" }}>Wedge</span>
          </Plate>
          <span style={{ fontFamily: MONO, fontSize: 26, color: C.enamelDim }}>AI Agents for Founders Challenge · HETIC 2026</span>
        </div>
      </AbsoluteFill>
    </Room>
  );
};
