export type SourceType = "competitor_page" | "hacker_news" | "reddit" | "demo_cache";
export type DirectionId = "DIR-A" | "DIR-B" | "DIR-C";
export type Lens = "niche_wedge" | "distribution_channel" | "pricing_flip";
export type RulingStatus = "confident" | "accept_risk" | "unverified";
export type LlmMode = "llm" | "offline-template";

export interface EvidenceItem {
  id: string;
  source_type: SourceType;
  title: string;
  url: string;
  snippet: string;
}

export interface Assumption {
  id: string;
  statement: string;
}

export interface DirectionOption {
  id: DirectionId;
  lens: Lens;
  title: string;
  summary: string;
  market_gap: string;
  tradeoff: string;
  evidence_ids: string[];
  assumptions: Assumption[];
}

export interface AssumptionRuling {
  assumption_id: string;
  status: RulingStatus;
  note: string;
}

export interface HumanDecision {
  selected_direction_id: DirectionId;
  founder_tweak: string;
  assumption_rulings: AssumptionRuling[];
}

export interface MomTestQuestion {
  question: string;
  target_assumption_id: string;
  what_it_validates: string;
}

export interface DirectionPlaybook {
  chosen_direction_title: string;
  sharpened_positioning: string;
  first_14_days_plan: string[];
  landing_page_hook: { headline: string; subheadline: string; cited_evidence_ids: string[] };
  mom_test_questions: MomTestQuestion[];
  human_judgment_impact: string;
}

export interface Metrics {
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_calls: number;
  fallback_triggered: boolean;
  cost_eur: number;
  raw_chunks: number;
  kept_chunks: number;
  estimated_tokens_saved_pct: number;
}

export interface Demo {
  id: string;
  startup_name: string;
  pitch: string;
  target_audience: string;
  competitor_urls: string[];
  competitor_names: string[];
  search_terms?: string[];
}

export interface StartupInput {
  startup_name: string;
  pitch: string;
  target_audience: string;
  competitor_urls: string[];
  competitor_names: string[];
  search_terms?: string[];
  use_demo_cache: boolean;
  demo_id?: string | null;
}

export interface StartResponse {
  thread_id: string;
  status: "awaiting_human_decision";
  evidence: EvidenceItem[];
  directions: DirectionOption[];
  metrics: Metrics;
  llm_mode: LlmMode;
  logs: string[];
}

export interface DecideResponse {
  thread_id: string;
  status: "completed";
  playbook: DirectionPlaybook;
  metrics: Metrics;
  llm_mode: LlmMode;
  logs: string[];
}

export type Route = 1 | 2 | 3;

/** Each lens is a route out of the junction, worked by its own points lever. */
export const LENS_META: Record<Lens, { route: Route; label: string; short: string }> = {
  niche_wedge: { route: 1, label: "Niche wedge", short: "Niche" },
  distribution_channel: { route: 2, label: "Distribution channel", short: "Channel" },
  pricing_flip: { route: 3, label: "Pricing flip", short: "Pricing" },
};

export const ROUTE_OF: Record<DirectionId, Route> = { "DIR-A": 1, "DIR-B": 2, "DIR-C": 3 };
