"""Groq (primary) -> Gemini (automatic fallback) router with strict JSON parsing and token metrics.

Every call returns the validated Pydantic object plus a usage record. Callers merge usage
into the session metrics so the UI can show provider, tokens, calls and fallback status live.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Optional, Type, TypeVar

from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError

load_dotenv()
log = logging.getLogger("wedge.llm")

T = TypeVar("T", bound=BaseModel)

GROQ_TIMEOUT_S = 30.0
GEMINI_TIMEOUT_S = 60.0


class LLMUnavailable(RuntimeError):
    """Raised when every provider failed (missing keys, rate limits, invalid output...)."""


@dataclass
class CallUsage:
    provider: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    calls: int = 0  # number of successful + failed provider attempts that consumed a request
    fallback_triggered: bool = False
    errors: list[str] = field(default_factory=list)


def empty_metrics() -> dict[str, Any]:
    return {
        "provider": "none",
        "model": "",
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "total_calls": 0,
        "fallback_triggered": False,
        "cost_eur": 0.0,
        "raw_chunks": 0,
        "kept_chunks": 0,
        "estimated_tokens_saved_pct": 0.0,
    }


def merge_usage(metrics: dict[str, Any], usage: CallUsage) -> dict[str, Any]:
    m = dict(metrics)
    m["provider"] = usage.provider
    m["model"] = usage.model
    m["prompt_tokens"] += usage.prompt_tokens
    m["completion_tokens"] += usage.completion_tokens
    m["total_tokens"] = m["prompt_tokens"] + m["completion_tokens"]
    m["total_calls"] += usage.calls
    m["fallback_triggered"] = bool(m["fallback_triggered"] or usage.fallback_triggered)
    m["cost_eur"] = 0.0  # free tiers only
    return m


_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE)


def parse_json(text: str) -> Any:
    """Strip markdown fences and parse JSON; falls back to the outermost {...} block."""
    if text is None:
        raise ValueError("empty response")
    cleaned = _FENCE_RE.sub("", text.strip()).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


class LLMRouter:
    def __init__(self) -> None:
        self.groq_key = os.getenv("GROQ_API_KEY", "").strip()
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # ---------------- providers ----------------
    async def _call_groq(self, system_prompt: str, user_prompt: str) -> tuple[str, int, int]:
        if not self.groq_key:
            raise LLMUnavailable("GROQ_API_KEY missing")
        from groq import AsyncGroq

        client = AsyncGroq(api_key=self.groq_key, timeout=GROQ_TIMEOUT_S, max_retries=0)
        resp = await client.chat.completions.create(
            model=self.groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=4096,
        )
        text = resp.choices[0].message.content or ""
        usage = resp.usage
        return text, int(getattr(usage, "prompt_tokens", 0) or 0), int(getattr(usage, "completion_tokens", 0) or 0)

    async def _call_gemini(self, system_prompt: str, user_prompt: str) -> tuple[str, int, int]:
        if not self.gemini_key:
            raise LLMUnavailable("GEMINI_API_KEY missing")
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.gemini_key)
        resp = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=self.gemini_model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.4,
                ),
            ),
            timeout=GEMINI_TIMEOUT_S,
        )
        um = getattr(resp, "usage_metadata", None)
        pt = int(getattr(um, "prompt_token_count", 0) or 0) if um else 0
        ct = int(getattr(um, "candidates_token_count", 0) or 0) if um else 0
        return resp.text or "", pt, ct

    # ---------------- public ----------------
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
        validator: Optional[Callable[[T], T]] = None,
    ) -> tuple[T, CallUsage]:
        """Try Groq, then Gemini. Any error (missing key, 429, timeout, invalid JSON, schema
        mismatch, failed post-validation) moves on to the next provider."""
        providers = [
            ("groq", self.groq_model, self._call_groq),
            ("gemini", self.gemini_model, self._call_gemini),
        ]
        usage = CallUsage(provider="none", model="")
        for idx, (name, model, fn) in enumerate(providers):
            consumed_request = False
            try:
                text, pt, ct = await fn(system_prompt, user_prompt)
                consumed_request = True
                usage.prompt_tokens += pt
                usage.completion_tokens += ct
                usage.calls += 1
                data = parse_json(text)
                obj = response_model.model_validate(data)
                if validator is not None:
                    obj = validator(obj)
                usage.provider = name
                usage.model = model
                usage.fallback_triggered = idx > 0
                log.info("LLM ok via %s (%s) pt=%s ct=%s", name, model, pt, ct)
                return obj, usage
            except (LLMUnavailable, ValidationError, ValueError, json.JSONDecodeError, asyncio.TimeoutError) as e:
                msg = f"{name}: {type(e).__name__}: {str(e)[:200]}"
            except Exception as e:  # 429s, network errors, SDK errors
                if not consumed_request and not isinstance(e, LLMUnavailable):
                    usage.calls += 1  # the request was sent even though it failed
                msg = f"{name}: {type(e).__name__}: {str(e)[:200]}"
            usage.errors.append(msg)
            log.warning("LLM provider failed -> %s", msg)
        usage.fallback_triggered = True
        raise LLMUnavailableWithUsage("; ".join(usage.errors), usage)


class LLMUnavailableWithUsage(LLMUnavailable):
    def __init__(self, message: str, usage: CallUsage) -> None:
        super().__init__(message)
        self.usage = usage


router = LLMRouter()
