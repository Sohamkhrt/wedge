"""Strict Pydantic v2 models for Wedge."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

SourceType = Literal["competitor_page", "hacker_news", "reddit", "demo_cache"]
DirectionId = Literal["DIR-A", "DIR-B", "DIR-C"]
Lens = Literal["niche_wedge", "distribution_channel", "pricing_flip"]
RulingStatus = Literal["confident", "accept_risk", "unverified"]


class EvidenceItem(BaseModel):
    id: str = Field(pattern=r"^EV-\d{2}$")
    source_type: SourceType
    title: str
    url: str
    snippet: str = Field(max_length=400)

    @field_validator("snippet", mode="before")
    @classmethod
    def _trim(cls, v: str) -> str:
        v = (v or "").strip()
        return v[:400]


class Assumption(BaseModel):
    id: str
    statement: str


class DirectionOption(BaseModel):
    id: DirectionId
    lens: Lens
    title: str
    summary: str
    market_gap: str
    tradeoff: str
    evidence_ids: list[str] = Field(min_length=1)
    assumptions: list[Assumption] = Field(min_length=3, max_length=3)


class DirectionSet(BaseModel):
    """LLM output wrapper for generate_directions."""

    directions: list[DirectionOption] = Field(min_length=3, max_length=3)


class AssumptionRuling(BaseModel):
    assumption_id: str
    status: RulingStatus
    note: str = ""


class HumanDecision(BaseModel):
    selected_direction_id: DirectionId
    founder_tweak: str = ""
    assumption_rulings: list[AssumptionRuling]


class LandingPageHook(BaseModel):
    headline: str
    subheadline: str
    cited_evidence_ids: list[str] = Field(default_factory=list)


class MomTestQuestion(BaseModel):
    question: str
    target_assumption_id: str
    what_it_validates: str


class DirectionPlaybook(BaseModel):
    chosen_direction_title: str
    sharpened_positioning: str
    first_14_days_plan: list[str] = Field(min_length=4, max_length=5)
    landing_page_hook: LandingPageHook
    mom_test_questions: list[MomTestQuestion] = Field(min_length=5, max_length=5)
    human_judgment_impact: str


class StartupInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    startup_name: str = Field(min_length=1, max_length=80)
    pitch: str = Field(min_length=10, max_length=600)
    target_audience: str = Field(min_length=2, max_length=200)
    competitor_urls: list[str] = Field(default_factory=list, max_length=3)
    competitor_names: list[str] = Field(default_factory=list, max_length=3)
    search_terms: list[str] = Field(default_factory=list, max_length=4)
    use_demo_cache: bool = False
    demo_id: Optional[str] = None


class Metrics(BaseModel):
    provider: str = "none"
    model: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    total_calls: int = 0
    fallback_triggered: bool = False
    cost_eur: float = 0.0
    raw_chunks: int = 0
    kept_chunks: int = 0
    estimated_tokens_saved_pct: float = 0.0
