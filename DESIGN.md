---
name: Wedge
description: The agent stops at red; the founder throws the lever.
colors:
  box-ground: "#1A3326"
  box-panel: "#132A1E"
  box-deep: "#0E1F16"
  box-raised: "#24432F"
  box-rule: "#2F5240"
  box-muted: "#4A6D58"
  enamel: "#F1E9D2"
  enamel-dim: "#CFC6AC"
  enamel-deep: "#E2D7B8"
  enamel-ink: "#16241B"
  enamel-soft: "#45503F"
  aspect-red: "#D7261E"
  aspect-red-lit: "#FF4A3D"
  aspect-amber: "#E8B21A"
  aspect-lamp: "#3FD08A"
  lever-black: "#151815"
typography:
  display:
    fontFamily: "Big Shoulders Display, Archivo, sans-serif"
    fontSize: "clamp(3rem, 7.2vw, 5.1rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Big Shoulders Display, Archivo, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 0.9
  title:
    fontFamily: "Big Shoulders Display, Archivo, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 0.9
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "-0.01em"
rounded:
  control: "6px"
  plate: "10px"
  board: "12px"
spacing:
  gutter: "16px"
  gutter-wide: "24px"
  section: "112px"
components:
  button-signal:
    backgroundColor: "{colors.aspect-red}"
    textColor: "{colors.enamel}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
  button-signal-disabled:
    backgroundColor: "{colors.box-raised}"
    textColor: "{colors.enamel-dim}"
  button-plate:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.enamel-ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-line:
    textColor: "{colors.enamel}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  plate:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.enamel-ink}"
    rounded: "{rounded.plate}"
  field-light:
    backgroundColor: "#FFFFFFB3"
    textColor: "{colors.enamel-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  evidence-pill:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.enamel-ink}"
    typography: "{typography.label}"
    rounded: "4px"
    padding: "2px 6px"
---

# Design System: Wedge

## Overview

**Creative North Star: "The Signal Box"**

Wedge is drawn as the inside of a railway signal box. The room is painted signal-box green; everything a person reads or touches is an enamel plate, a lever, or a lamp. The AI agent is a train on the approach line, and the founder is the signalman: the run stops at a red home signal until a human pulls one of three points levers and clears the signal. Every visual decision serves that one mechanism, which is the product's actual behaviour (a LangGraph `interrupt()`), not a metaphor laid over it.

The system is dense where it has to be read (enamel plates, timetables, route cards) and spacious around the machinery (the junction diagram, the lever frame). Colour is functional before it is decorative. Red, amber and green are signal aspects and mean exactly what they mean on a railway, and cream is the colour of anything that carries words.

**Key Characteristics:**
- One green room, cream enamel for everything legible.
- Signal aspects (red, amber, green) used only for state.
- Condensed signage capitals for every heading; a sturdy grotesque for reading; mono only for codes and measurements.
- The junction diagram is the master graphic and recurs on every stage.
- Real levers as the primary controls: a demo lever, three points levers, one signal lever.

## Colors

A full-palette system on a committed green ground: the room colour owns the page, enamel cream owns every reading surface, and three aspect colours carry state.

### Primary
- **Signal-Box Green** (box-ground): the page ground of every stage. Panels and wells step darker (box-panel, box-deep); raised and passed states step lighter (box-raised, box-rule).
- **Enamel Cream** (enamel): plates, the nameboard, the route card, the evidence register, primary text on green.

### Secondary
- **Aspect Red / Lit Red** (aspect-red, aspect-red-lit): danger. Used for the held home signal, the current "Your call" stage, the signal lever (Clear the signal, Dispatch), unverified assumptions, and error notices.
- **Aspect Amber** (aspect-amber): caution and emphasis. Used for the second line of hero headlines, demo-lever handles, the approach line while a run is in progress, accept-risk rulings, the offline-template warning, focus rings and text selection.
- **Lamp Green** (aspect-lamp): clear. Used for the cleared signal, the set route, confident rulings, the pulled-lever plate and the €0.00 reading.

### Neutral
- **Faded Enamel** (enamel-dim): secondary text on green.
- **Enamel Ink / Soft Ink** (enamel-ink, enamel-soft): primary and secondary text on cream.
- **Deep Enamel** (enamel-deep): hover state of plates and the shaded half of the route card.
- **Lever Black** (lever-black): points-lever handles, outlined in cream so they read against the frame.

### Named Rules
**The Aspect Rule.** Red, amber and lamp green are signal aspects. They encode state (held, caution, clear) and never decorate. A new state reuses an aspect only if a signalman would read it the same way.

**The Words-on-Enamel Rule.** Long reading happens on cream plates in ink, or on green in enamel. Never put body text on an aspect colour except inside the alert that owns it.

## Typography

**Display Font:** Big Shoulders Display (fallback Archivo)
**Body Font:** Archivo (fallback system-ui)
**Label/Mono Font:** JetBrains Mono

**Character:** Condensed signage capitals give every heading the voice of a station nameboard or a lever plate, and Archivo reads plainly beside them. Mono is reserved for evidence codes, run ids, token counts and other measurements.

### Hierarchy
- **Display** (800, clamp 3rem to 5.1rem, 0.9): stage headlines. The second clause turns amber ("You throw the lever.", "Set the route.").
- **Headline** (800, 3rem, 0.9): section titles (Timetable of a run, Rules of the box, Interview script).
- **Title** (800, 1.5rem to 2.15rem, 0.9): route-sheet titles, plate headings, lever labels.
- **Body** (400, 15 to 17px, 1.625): explanatory copy, capped at about 58 to 64ch.
- **Label** (mono 500, 11 to 13px): EV codes, run id, metrics, diagram sub-labels.

### Named Rules
**The Nameboard Rule.** Every heading is set in signage capitals and leads its block. Metadata such as route number, lens or status sits beneath the heading, never above it as a kicker.

**The Mono-Means-Measured Rule.** Monospace appears only for codes, ids and quantities, never as a "technical" costume for prose.

## Layout

A 1240px container with a 16px gutter (24px from 640px up). Hero rows split 7/5 on a 12-column grid. Prose blocks span 4 columns beside an 8-column plate. Sections are separated by about 112px, and headings get more space above than below. The junction diagram always spans its board: it keeps a minimum width of 560 to 680px and scrolls sideways inside the board on phones rather than shrinking past legibility. Below 1024px everything stacks into one column. On phones the timetable folds its cost column under the stop name, and the instrument panel drops Calls and BM25.

## Elevation & Depth

The depth is physical but plain: plates cast one soft drop shadow, and the lever frame, diagram board and fields are recessed wells with an inset shadow. Nothing glows except lit lamps, which carry a small halo in their own colour.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 6px 14px -6px rgba(0,0,0,0.55)`): enamel plates and cream buttons.
- **Well** (`box-shadow: 0 2px 6px rgba(0,0,0,0.45) inset`): diagram boards, the lever frame, lever slots, fields on green.
- **Lamp halo** (`box-shadow: 0 0 10px 1px currentColor`): lit status lamps only.

### Named Rules
**The No-Bevel Rule.** Plates get a drop shadow only. No inset highlights, embossing or faux-metal effects that imitate enamel; the material is carried by colour, screws and type.

## Shapes

Enamel plates use 10px corners with two small flat screw heads at the top. Boards use 12px corners, and controls and fields 6px. Lamps and signal heads are full circles and capsules. The diagram is drawn in exact geometry: 6px rails (8px for the set route), round caps, cubic-curve turnouts, 8px buffer stops, and number-blocked route plates.

## Components

### Buttons
- **Signal (primary):** aspect-red ground, enamel signage caps at 20px, 6px corners, plate shadow. Used for the one irreversible step on a stage: Dispatch, Clear the signal. When disabled it drops to box-raised with faded text and no shadow.
- **Plate (secondary):** cream with ink text. Download logbook.
- **Line (tertiary):** a 2px enamel outline at 40% that brightens on hover. New run.
- **Hover / Focus:** a 1px lift on hover; focus is a 3px amber outline offset 3px.

### Lever (signature)
A real `<button aria-pressed>`: a slot (box-raised well) holding a handle (grip plus rod) above a cream number plate. Pulling it rotates the handle 22° from its base on an exponential ease-out (`cubic-bezier(0.16,1,0.3,1)`, 300ms) and turns the plate lamp-green. Handle colours follow lever-frame convention: amber for demo levers, black outlined in cream for points (route) levers. The signal lever is the red Signal button.

### Junction Diagram (signature)
An SVG board: approach line, three stations (Ingest, BM25, Draft), the home signal (two-lamp capsule), and three routes ending in buffer stops with number plates. Phases: idle and held (red lamp, train waiting), running (amber approach fills as the train eases in over 16s), and clear and arrived (green lamp, set route lit lamp-green, train runs the route). Hovering a route sheet previews its route dashed. Reduced-motion users get the end state with no travel.

### Cards / Containers
- **Enamel plate:** cream, 10px corners, plate shadow, screws, ink text. Holds the timetable, rules, own-idea form, ruling and route card.
- **Route sheet:** not a card. It is a 4px enamel top rule over open green text, which turns lamp green when set. Unchosen sheets drop to 50% opacity.

### Inputs / Fields
- **Light field (on plates):** white at 70% over cream, 2px enamel-deep border, 6px corners; the border turns ink on focus. The caret is aspect-red.
- **Aspect toggles:** radio buttons with a small lamp and a signage label, each tinted its aspect when chosen.

### Navigation
A sticky nameboard bar. The cream "Wedge" plate returns to the start. Landing links sit in faded enamel. During a run, block-instrument stage pills replace them (passed, current, upcoming; "Your call" is red). On the right sits the instrument panel: line lamp, provider, tokens, calls, cost and BM25 saved.

## Do's and Don'ts

### Do:
- **Do** put words on enamel cream or on green; keep red, amber and lamp green for state.
- **Do** make the primary action of a stage a lever or the red signal button.
- **Do** show the junction diagram at the top of every stage, so the visitor always knows where the train is.
- **Do** keep metadata beneath headings (route, lens, status), with the heading leading.
- **Do** label anything offline, cached or paraphrased, in amber, where it appears.

### Don't:
- **Don't** add kickers or eyebrows above headings.
- **Don't** imitate material with CSS bevels, embossing or texture overlays.
- **Don't** use aspect colours as decoration or brand accents.
- **Don't** turn the three routes into a grid of identical cards with icons.
- **Don't** use bounce or elastic easing; levers move mechanically, with an exponential ease-out.
