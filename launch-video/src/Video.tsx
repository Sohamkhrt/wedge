import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { Approach, ColdOpen, EndCard, Held, Levers, Logo, Machinery, Reframe, RouteCard } from "./scenes/Scenes";
import { C, FPS } from "./theme";
import { Thumbnail } from "./Thumbnail";

// [component, seconds]
const SCENES: [React.FC, number][] = [
  [ColdOpen, 4],
  [Reframe, 4],
  [Logo, 4],
  [Approach, 10],
  [Held, 8],
  [Levers, 10],
  [RouteCard, 8],
  [Machinery, 7],
  [EndCard, 6],
];
const TOTAL = SCENES.reduce((n, [, s]) => n + s * FPS, 0);

export const WedgeLaunch: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      {SCENES.map(([Scene, secs], i) => {
        const dur = secs * FPS;
        const seq = (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Scene />
          </Sequence>
        );
        from += dur;
        return seq;
      })}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="WedgeLaunch" component={WedgeLaunch} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={FPS} width={1500} height={1000} />
  </>
);
