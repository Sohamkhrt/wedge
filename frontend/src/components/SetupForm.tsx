import { useState } from "react";
import { ArrowDown, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Lever from "./Lever";
import TrackDiagram from "./TrackDiagram";
import type { Demo, StartupInput } from "../types";

interface Props {
  demos: Demo[];
  demosError: boolean;
  onSubmit: (input: StartupInput) => void;
}

const TIMETABLE = [
  { stop: "Ingest", what: "Reads competitor product and pricing pages, Hacker News comments and public Reddit threads. Emails, phone numbers and handles are scrubbed; LinkedIn is blocked.", cost: "0 tokens" },
  { stop: "BM25", what: "Cuts every page into ~320-character chunks and keeps the 15 most relevant locally, numbered EV-01 to EV-15.", cost: "0 tokens" },
  { stop: "Draft", what: "Groq's Llama 3.3 70B proposes three routes for the same idea: a niche, a channel, a pricing model. Every claim must cite real EV codes or the answer is rejected and Gemini takes over.", cost: "1 call" },
  { stop: "Home signal", what: "LangGraph interrupt(). The run stops. You pick one route, steer it in your own words and rule on each of its three assumptions.", cost: "held", held: true },
  { stop: "Route card", what: "A positioning line, a 14-day plan, a cited landing hook and five Mom Test questions aimed at what you marked unverified. Exported as a Markdown logbook.", cost: "1 call" },
];

const RULES = [
  { t: "The idea is never the variable.", d: "Wedge does not tell you to pivot. It keeps your core idea fixed and argues about the angle." },
  { t: "No claim without a source.", d: "Every route cites EV codes. Click one and the original page opens, with the quoted text beside it." },
  { t: "The agent waits for you.", d: "The graph is paused server-side. The API refuses to continue until a route is chosen and all three assumptions are ruled." },
  { t: "The machinery stays visible.", d: "Provider, tokens, calls, fallbacks and offline mode sit on the instrument panel at the top. Runtime cost is €0.00." },
  { t: "Public data only.", d: "No personal data, no LinkedIn, no usernames stored. Cached demo summaries are labelled as paraphrased." },
];

const ASPECTS = [
  { name: "Confident", lamp: "bg-aspect-lamp", d: "You can vouch for it. The playbook treats it as given." },
  { name: "Accept risk", lamp: "bg-aspect-amber", d: "Unproven, but you will move anyway. Noted, tested later." },
  { name: "Unverified", lamp: "bg-aspect-redlit", d: "Stop sign. Your Mom Test questions are aimed here first." },
];

export default function SetupForm({ demos, demosError, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [audience, setAudience] = useState("");
  const [urls, setUrls] = useState(["", "", ""]);
  const [offline, setOffline] = useState(false);
  const [pulled, setPulled] = useState<string | null>(null);

  const filled = urls.map((u) => u.trim()).filter(Boolean);
  const missing = [
    !name.trim() && "a name",
    pitch.trim().length < 10 && "the core idea",
    audience.trim().length < 2 && "an audience",
    filled.length < 1 && "one competitor URL",
  ].filter(Boolean) as string[];

  const runDemo = (d: Demo) => {
    setPulled(d.id);
    // let the lever finish its throw before the page changes
    window.setTimeout(
      () =>
        onSubmit({
          startup_name: d.startup_name,
          pitch: d.pitch,
          target_audience: d.target_audience,
          competitor_urls: d.competitor_urls,
          competitor_names: d.competitor_names,
          search_terms: d.search_terms ?? [],
          use_demo_cache: offline,
          demo_id: d.id,
        }),
      320,
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missing.length) return;
    onSubmit({
      startup_name: name.trim(),
      pitch: pitch.trim(),
      target_audience: audience.trim(),
      competitor_urls: filled,
      competitor_names: [],
      use_demo_cache: offline,
      demo_id: null,
    });
  };

  return (
    <main>
      {/* ───────── first viewport ───────── */}
      <section className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h1 className="sign text-[clamp(3rem,7.2vw,5.1rem)] text-enamel">
              The agent stops at red.
              <span className="block text-aspect-amber">You throw the lever.</span>
            </h1>
            <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-enamel-dim">
              Wedge keeps your startup idea fixed and reads live public market evidence. It drafts three cited routes to make that
              idea win: a niche, a channel, a pricing model. Then it holds at the signal until <em className="not-italic text-enamel">you</em> choose
              one and rule on what it assumes.
            </p>
          </div>

          <div className="lg:col-span-5" id="run">
            <p className="sign mb-3 text-lg text-enamel-dim">Pull a lever · live demo, one click</p>
            <div className="rounded-lg border-2 border-box-950 bg-box-900 p-4 shadow-well">
              <div className="grid grid-cols-2 gap-4">
                {demos.map((d, i) => (
                  <Lever
                    key={d.id}
                    size="lg"
                    number={i + 1}
                    color="yellow"
                    pulled={pulled === d.id}
                    disabled={pulled !== null}
                    onClick={() => runDemo(d)}
                    ariaLabel={`Run live demo ${i + 1}: ${d.startup_name}`}
                    label={d.startup_name}
                    sub={`vs ${d.competitor_names.join(", ")}`}
                  />
                ))}
                {demos.length === 0 &&
                  [1, 2].map((n) => (
                    <div key={n} className="flex h-[11.5rem] items-center justify-center rounded-md border-2 border-dashed border-box-600 p-3 text-center text-sm text-enamel-dim">
                      {demosError ? "Backend offline. Start uvicorn on :8000." : <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading demos" />}
                    </div>
                  ))}
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-enamel-dim">
                <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="mt-0.5 h-4 w-4 accent-aspect-amber" />
                Skip live scraping and run on cached, paraphrased public summaries (for weak Wi-Fi on demo day).
              </label>
            </div>
            <a href="#own" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-enamel-dim hover:text-enamel">
              Or dispatch your own idea <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>

        <figure className="mt-8 rounded-xl border-2 border-box-950 bg-box-900 shadow-well">
          <div className="overflow-x-auto">
            <div className="min-w-[680px] px-2 py-1 sm:px-6">
              <TrackDiagram phase="idle" selected={null} />
            </div>
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-box-950 px-5 py-3 text-[13px] text-enamel-dim">
            <span>Every run follows this line. The approach is automatic; the junction is yours.</span>
            <span className="code text-enamel-dim/80">1 line in · 1 signal · 3 routes out</span>
          </figcaption>
        </figure>
      </section>

      {/* ───────── timetable ───────── */}
      <section id="how" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 pt-28 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="sign text-5xl text-enamel">Timetable of a run</h2>
            <p className="mt-4 max-w-[40ch] text-[16px] leading-relaxed text-enamel-dim">
              Five stops, two of them free. The only stop the agent cannot pass on its own is the one with you in it.
            </p>
          </div>
          <div className="plate overflow-hidden lg:col-span-8">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-enamel-ink text-enamel">
                  <th scope="col" className="sign px-5 py-3 text-base">Stop</th>
                  <th scope="col" className="sign px-5 py-3 text-base">What happens</th>
                  <th scope="col" className="sign hidden px-5 py-3 text-right text-base sm:table-cell">Cost</th>
                </tr>
              </thead>
              <tbody>
                {TIMETABLE.map((r) => (
                  <tr key={r.stop} className={`border-t border-enamel-ink/15 align-top ${r.held ? "bg-aspect-red text-enamel" : ""}`}>
                    <th scope="row" className="sign whitespace-nowrap px-4 py-4 text-2xl sm:px-5">
                      {r.stop}
                      <span className="code mt-1 block font-sans text-[11px] font-medium normal-case sm:hidden">{r.cost}</span>
                    </th>
                    <td className={`px-4 py-4 text-[15px] sm:px-5 leading-relaxed ${r.held ? "text-enamel" : "text-enamel-soft"}`}>{r.what}</td>
                    <td className="code hidden whitespace-nowrap px-5 py-4 pt-5 text-right sm:table-cell">{r.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───────── aspects ───────── */}
      <section className="mx-auto max-w-[1240px] px-4 pt-28 sm:px-6">
        <h2 className="sign max-w-[18ch] text-5xl text-enamel">Three aspects for every assumption</h2>
        <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-enamel-dim">
          Each route rests on three assumptions. At the signal you give each one an aspect. The playbook is written around your answers.
        </p>
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {ASPECTS.map((a) => (
            <div key={a.name} className="flex items-start gap-5">
              <span className="flex h-24 w-11 shrink-0 flex-col items-center justify-around rounded-full border-2 border-enamel/70 bg-box-950 py-2" aria-hidden>
                <span className={`h-5 w-5 rounded-full ${a.name === "Unverified" ? "bg-aspect-redlit shadow-[0_0_14px_2px_#FF4A3D]" : "bg-box-700"}`} />
                <span className={`h-5 w-5 rounded-full ${a.name === "Accept risk" ? "bg-aspect-amber shadow-[0_0_14px_2px_#E8B21A]" : "bg-box-700"}`} />
                <span className={`h-5 w-5 rounded-full ${a.name === "Confident" ? "bg-aspect-lamp shadow-[0_0_14px_2px_#3FD08A]" : "bg-box-700"}`} />
              </span>
              <div>
                <h3 className="sign text-3xl text-enamel">{a.name}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-enamel-dim">{a.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── rules ───────── */}
      <section id="rules" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 pt-28 sm:px-6">
        <div className="plate plate-screws px-6 py-10 sm:px-12">
          <h2 className="sign text-center text-5xl text-enamel-ink sm:text-6xl">Rules of the box</h2>
          <p className="mt-2 text-center text-sm font-semibold uppercase tracking-[0.14em] text-enamel-soft">Posted by order · read before working the levers</p>
          <ol className="mx-auto mt-10 grid max-w-5xl gap-x-12 gap-y-7 md:grid-cols-2">
            {RULES.map((r, i) => (
              <li key={r.t} className="flex gap-4">
                <span className="sign w-8 shrink-0 text-right text-4xl text-aspect-red">{i + 1}</span>
                <div className="border-t-2 border-enamel-ink pt-2">
                  <h3 className="sign text-2xl text-enamel-ink">{r.t}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-enamel-soft">{r.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── own idea ───────── */}
      <section id="own" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 pb-24 pt-28 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="sign text-5xl text-enamel">Dispatch your own idea</h2>
            <p className="mt-4 max-w-[40ch] text-[16px] leading-relaxed text-enamel-dim">
              Two sentences and one or more competitor pages. Wedge will not touch the idea itself, only the route it takes to market.
            </p>
            <p className="mt-6 flex items-start gap-2 text-[13px] leading-snug text-enamel-dim">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-aspect-lamp" aria-hidden />
              Public pages, Hacker News and Reddit only. No personal data is fetched or stored.
            </p>
          </div>

          <form onSubmit={submit} className="plate plate-screws space-y-6 px-6 pb-7 pt-9 sm:px-9 lg:col-span-8" noValidate>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="sign mb-2 block text-lg text-enamel-ink">Startup name</label>
                <input id="name" className="field-light" value={name} onChange={(e) => setName(e.target.value)} placeholder="CampusATS" maxLength={80} />
              </div>
              <div>
                <label htmlFor="aud" className="sign mb-2 block text-lg text-enamel-ink">Who feels the pain</label>
                <input id="aud" className="field-light" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Final-year students in placement season" maxLength={200} />
              </div>
            </div>
            <div>
              <label htmlFor="pitch" className="sign mb-2 block text-lg text-enamel-ink">Core idea, two sentences · stays fixed</label>
              <textarea
                id="pitch"
                className="field-light min-h-[96px] resize-y"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="What you build and for whom."
                maxLength={600}
              />
            </div>
            <fieldset>
              <legend className="sign mb-2 block text-lg text-enamel-ink">Competitor pages · product or pricing</legend>
              <div className="grid gap-2.5">
                {urls.map((u, i) => (
                  <input
                    key={i}
                    aria-label={`Competitor URL ${i + 1}${i === 2 ? " (optional)" : ""}`}
                    className="field-light font-mono text-[13px]"
                    value={u}
                    onChange={(e) => setUrls(urls.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={i === 0 ? "https://competitor.com/pricing" : i === 1 ? "https://another-competitor.com" : "Third one, optional"}
                  />
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-enamel-ink/20 pt-5">
              <p className="text-[13px] text-enamel-soft" aria-live="polite">
                {missing.length ? `Still needed: ${missing.join(", ")}.` : "Ready. The run takes 10 to 30 seconds."}
              </p>
              <button
                type="submit"
                disabled={missing.length > 0}
                className="inline-flex items-center gap-2 rounded-md bg-aspect-red px-6 py-3 font-sign text-xl font-extrabold uppercase tracking-wide text-enamel shadow-plate transition-transform hover:-translate-y-px active:translate-y-px disabled:cursor-not-allowed disabled:bg-enamel-deep disabled:text-enamel-soft disabled:shadow-none"
              >
                Dispatch <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer className="border-t-2 border-box-950 bg-box-900">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-[13px] text-enamel-dim sm:px-6">
          <span>
            <span className="sign mr-2 text-xl text-enamel">Wedge</span> Built for the AI Agents for Founders Challenge · HETIC 2026
          </span>
          <span className="code">Groq → Gemini fallback · free tiers · €0.00 runtime</span>
        </div>
      </footer>
    </main>
  );
}
