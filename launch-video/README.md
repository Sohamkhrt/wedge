# Wedge launch video

A 61-second, 1920×1080, 30 fps product launch film, written in code with [Remotion](https://www.remotion.dev) and built from the same Signal Box design tokens as the app (`../DESIGN.md`).

| Time | Scene |
|---|---|
| 0:00 | Cold open: red signal, "Every AI tool tells founders to ~~pivot~~." |
| 0:04 | "You don't need a new idea. You need the angle that wins." |
| 0:08 | Wedge nameboard reveal |
| 0:12 | The approach: track draws, train passes Ingest → BM25 → Draft |
| 0:22 | Held at the signal: `interrupt()`, three route plates, EV citations |
| 0:30 | You throw the lever: route set, steer typed, three assumption rulings |
| 0:40 | Signal clear: the train runs the route, the route card slides up |
| 0:48 | The machinery stays visible: €0.00, Groq → Gemini, citations, audit trail |
| 0:55 | End card: "The agent stops at red. You throw the lever." |

## Commands

```bash
npm install
npm run studio   # live preview and scrubbing in the browser
npm run render   # → out/wedge-launch.mp4
```

## Audio (`out/wedge-launch-vo.mp4`)

- **Voiceover:** nine lines in `audio/lines.tsv` (id, start s, window s, text), synthesized locally with Kokoro-82M (`npx hyperframes tts`, voice `am_michael`) into `audio/vo/`. Each line fits inside its scene window. Kokoro needs a Python with `kokoro-onnx` and `soundfile`; point `HYPERFRAMES_PYTHON` at it.
- **Music:** an original score synthesized from scratch by `audio/compose.py` (numpy + soundfile, no samples, no licences). It is 100 BPM in A minor, and its sections follow the picture: tick intro, approach arpeggio, held drone and heartbeat, lever build, "signal clear" lift, outro.
- **Mix:** ffmpeg places each line at its start time, ducks the music under the voice (sidechain compression), and loudness-normalises to −14 LUFS, true peak −1.5 dBTP.

`out/wedge-launch.mp4` stays silent, for anyone who wants to cut their own audio.

**AI disclosure:** the narration voice is synthetic (Kokoro TTS). Say so in your submission's AI disclosure.

Content in the lever and route-card scenes is an illustrative CampusATS run and is labelled "Example run" on screen.
