# Wedge: demo video script (≈3 minutes)

AI Agents for Founders Challenge · HETIC 2026

**Before you record**
- Put real `GROQ_API_KEY` and `GEMINI_API_KEY` values in `backend/.env`. Without them the app runs on the labelled offline template, and you want real AI routes on camera.
- Start both servers (`uvicorn app.main:app --reload` and `npm run dev`). Do one throwaway run first so everything is warm.
- Leave "Skip live scraping" unticked, unless the Wi-Fi is bad.
- Browser at 1440×900, zoom 100%, bookmarks bar hidden, notifications off.
- Read the numbers off the screen as you record them. Never say a figure the screen doesn't show.

---

## 0:00 – 0:15 · Cold open

**ON SCREEN:** Landing page, first viewport. Hold on the red signal in the diagram.

**VOICE:**
> Every AI startup tool will happily tell you to pivot.
> But founders don't need a new idea. They need to know which *angle* makes their idea win.
> This is Wedge.

---

## 0:15 – 0:35 · Intro and the problem

**ON SCREEN:** Slow scroll down to the junction diagram, then back up to the headline.

**VOICE:**
> Hi, I'm [your name], and this is [team name]'s entry for the AI Agents for Founders Challenge.
> Wedge keeps your core idea fixed. It reads live public market evidence and proposes three cited routes to market: a niche, a channel, a pricing model.
> Then it does something most agents don't do. It stops, and waits for you.

---

## 0:35 – 1:05 · Pull the lever (the run starts)

**ON SCREEN:** Click **Demo 1: CampusATS**. The lever throws, and the train runs along the approach line past Ingest, BM25 and Draft.

**VOICE:**
> One click runs a live demo. CampusATS is an AI resume builder for students in placement season, up against Kickresume and Teal.
> Right now Wedge is reading competitor pricing pages, Hacker News and public Reddit threads. Public data only: no LinkedIn, no personal data, and usernames are never stored.
> Then a local BM25 filter cuts everything down to the 15 most relevant passages. That step costs zero tokens.

---

## 1:05 – 1:35 · Held at the signal (three routes)

**ON SCREEN:** The checkpoint screen. Point at the red signal, scroll through the three route columns, then click an **EV** pill so the evidence register slides open. Close it.

**VOICE:**
> And here the train stops at red. This is a real LangGraph `interrupt()`: the run is paused on the server.
> We get three routes for the *same* idea. Each one names the market gap it uses and what it costs you.
> And no claim comes without a source. Click EV-03 and you get the original page, with the quoted text beside it.

---

## 1:35 – 2:10 · Human judgment (the core of the challenge)

**ON SCREEN:** Pull route lever 1 (or whichever is strongest), so the route lights on the diagram. Type in the steer box: *"Start with tier-2 engineering colleges, I know three placement officers."* Rate the assumptions: Confident, Unverified, Accept risk. The bottom bar turns green.

**VOICE:**
> Now the founder decides. I pull the lever for route one and steer it with something only I know: I already have contacts at three colleges.
> Then every assumption behind this route gets a ruling. Confident, accept the risk, or unverified.
> The signal can't clear until all three are ruled. That isn't a UI trick: the API refuses to continue without them.

---

## 2:10 – 2:40 · The route card

**ON SCREEN:** Click **Clear the signal**. The signal turns green and the train runs the chosen route. Then the route card appears. Scroll slowly through "What your ruling changed", the positioning, the 14-day plan, the cited landing hook, and the interview script.

**VOICE:**
> Signal clear. Wedge writes the playbook around *my* decision.
> This section shows exactly how my choice, my steer and my rulings changed the plan.
> There's a 14-day plan, a landing page hook that still cites its sources, and five Mom Test interview questions aimed at the assumption I marked unverified.

---

## 2:40 – 2:55 · Under the hood and honesty

**ON SCREEN:** Zoom on the instrument panel at the top (provider, tokens, calls, €0.00, BM25 saved). Click **Download logbook (.md)** and briefly show the file.

**VOICE:**
> Everything is visible. Groq's Llama 3.3 runs first, Gemini takes over automatically if it fails, and you can see tokens, calls and the [read the % on screen] BM25 saving live. Total cost: zero euros.
> And the whole session exports as a Markdown audit trail: evidence, all three routes, the founder's decision, and the AI disclosure.

---

## 2:55 – 3:05 · Close

**ON SCREEN:** Back to the landing hero, "The agent stops at red. You throw the lever."

**VOICE:**
> Wedge doesn't replace the founder's judgment. It's built around it.
> The agent stops at red. You throw the lever.
> Thanks for watching.

---

## Short version (≈60 seconds)

If the jury caps videos at one minute, keep these lines and cut everything else:

1. *Cold open* (0:00–0:10): "Founders don't need a new idea, they need the angle that wins. This is Wedge."
2. *One click* (0:10–0:25): Demo 1 → "Live public evidence, filtered locally at zero tokens."
3. *The stop* (0:25–0:40): Checkpoint → "A real LangGraph interrupt. Three cited routes, and the agent waits for me."
4. *The decision* (0:40–0:52): Pull a lever, steer it, rule on the assumptions, clear the signal.
5. *The result* (0:52–1:00): Route card and €0.00 panel → "Built around the founder's judgment. You throw the lever."

## Recording tips

- Record the screen and your voice separately if you can. Re-recording a fluffed line is easier than re-running the demo.
- The live run takes 10 to 30 seconds. Either talk through it (the 0:35 section is written for that) or cut the wait in editing.
- Move the cursor slowly and pause on each EV pill and lever. Viewers follow the cursor.
- If anything shows "Offline template" on screen, stop and add your API keys. Don't present template output as AI analysis.
