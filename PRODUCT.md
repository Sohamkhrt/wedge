# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: the jury of the AI Agents for Founders Challenge (HETIC 2026), evaluating the project in a short session, often on a laptop, often with the founder demoing. They need to grasp the mechanism fast and see it work live with one click.
Secondary: early-stage founders who have an idea and want to know which angle (niche, channel, pricing) to pursue without being told to abandon it.

## Product Purpose
Wedge keeps a founder's core idea fixed. It gathers public market evidence, proposes 3 cited strategic directions (niche wedge, distribution channel, pricing flip) and pauses until the founder picks one, steers it and rules on its assumptions. Only then does it write a focused 14-day playbook and a Mom Test interview script. Success = the founder leaves with one chosen direction, explicit assumptions and a concrete test plan; the judges see that human judgment is structurally enforced.

## Positioning
Not an idea-validator that says "pivot". Wedge (1) keeps the idea intact, (2) cites every claim to a public source with a clickable URL, (3) physically pauses the agent at a LangGraph `interrupt()` until a human decides, and (4) runs at €0.00 on free LLM tiers with live token metrics.

## Operating Context
Single-page web app: the landing page and the tool live together; the demo starts from the page. Backend is FastAPI + LangGraph on :8000; frontend is Vite + React + TS + Tailwind. The session flow is: core idea → evidence → human checkpoint → playbook → Markdown audit trail export.

## Capabilities and Constraints
- Two one-click demos: CampusATS (Kickresume, Teal) and InvoicePulse (Wave, FreshBooks).
- Groq llama-3.3-70b primary, Gemini 2.5 Flash fallback, deterministic offline template when no key (must stay clearly labelled).
- Sources: public competitor pages, Hacker News Algolia, public Reddit JSON. No PII, no LinkedIn. Reddit often returns 403.
- BM25 local filter keeps top 15 chunks (EV-01..EV-15), 0 LLM tokens.
- Checkpoint requires 1 direction + a ruling (confident / accept_risk / unverified) on all 3 assumptions.
- Cached demo evidence is paraphrased summaries, labelled as such.

## Brand Commitments
Name "Wedge". Mention of the AI Agents for Founders Challenge, HETIC 2026. No other binding visual constraints.

## Evidence on Hand
Only the working product itself and its live metrics. No testimonials, user counts, customer logos, press or benchmarks exist; do not fabricate any.

## Product Principles
1. The founder's idea is never the variable; the angle is.
2. No claim without a citation the reader can open.
3. The human decides; the agent waits.
4. Show the machinery honestly: tokens, provider, fallbacks, offline mode.
5. One click to see it work.
