"""Local BM25 relevance filter — 0 LLM tokens.

Splits every scraped document into ~320-char chunks, ranks them against the founder's pitch plus
friction keywords, and keeps only the top 15 as citable evidence (EV-01 .. EV-15).
"""
from __future__ import annotations

import re
from typing import Any

from rank_bm25 import BM25Okapi

CHUNK_CHARS = 320
TOP_K = 15
FRICTION_TERMS = "pricing expensive cancel hate alternative missing free problem niche workflow"

_TOKEN_RE = re.compile(r"[a-z0-9]+")
_SENT_RE = re.compile(r"(?<=[.!?])\s+")
STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with", "is", "it", "that", "this",
    "are", "be", "as", "at", "by", "from", "you", "your", "we", "our", "i", "my", "they", "their",
}


def tokenize(text: str) -> list[str]:
    return [t for t in _TOKEN_RE.findall(text.lower()) if t not in STOPWORDS and len(t) > 1]


def chunk_text(text: str, size: int = CHUNK_CHARS) -> list[str]:
    """Sentence-aware chunking to roughly `size` chars; long sentences are hard-split."""
    sentences = [s.strip() for s in _SENT_RE.split(text) if s.strip()]
    chunks: list[str] = []
    buf = ""
    for s in sentences:
        while len(s) > size:
            if buf:
                chunks.append(buf)
                buf = ""
            cut = s.rfind(" ", 0, size)
            cut = cut if cut > size // 2 else size
            chunks.append(s[:cut].strip())
            s = s[cut:].strip()
        if len(buf) + len(s) + 1 <= size:
            buf = f"{buf} {s}".strip()
        else:
            if buf:
                chunks.append(buf)
            buf = s
    if buf:
        chunks.append(buf)
    return [c for c in chunks if len(c) >= 40]


def bm25_filter(docs: list[dict[str, Any]], pitch: str, top_k: int = TOP_K) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Return (evidence_items, stats). Evidence items match the EvidenceItem schema."""
    chunks: list[dict[str, Any]] = []
    for d in docs:
        for c in chunk_text(d.get("text", "")):
            chunks.append({**{k: v for k, v in d.items() if k != "text"}, "text": c})

    raw_chars = sum(len(c["text"]) for c in chunks)
    stats: dict[str, Any] = {"raw_chunks": len(chunks), "kept_chunks": 0, "estimated_tokens_saved_pct": 0.0}
    if not chunks:
        return [], stats

    query = tokenize(f"{pitch} {FRICTION_TERMS}")
    corpus = [tokenize(c["text"]) or ["_"] for c in chunks]
    bm25 = BM25Okapi(corpus)
    scores = bm25.get_scores(query)

    ranked = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
    seen: set[str] = set()
    picked: list[int] = []
    per_url: dict[str, int] = {}
    for i in ranked:
        key = chunks[i]["text"][:80].lower()
        url = chunks[i]["url"]
        if key in seen or per_url.get(url, 0) >= 4:  # dedupe + source diversity
            continue
        seen.add(key)
        per_url[url] = per_url.get(url, 0) + 1
        picked.append(i)
        if len(picked) >= top_k:
            break
    if len(picked) < top_k:  # relax diversity if corpus is small
        for i in ranked:
            if i not in picked and chunks[i]["text"][:80].lower() not in seen:
                seen.add(chunks[i]["text"][:80].lower())
                picked.append(i)
                if len(picked) >= top_k:
                    break

    evidence = []
    for n, i in enumerate(picked, start=1):
        c = chunks[i]
        evidence.append({
            "id": f"EV-{n:02d}",
            "source_type": c["source_type"],
            "title": c["title"][:140],
            "url": c["url"],
            "snippet": c["text"][:400],
        })

    kept_chars = sum(len(e["snippet"]) for e in evidence)
    stats["kept_chunks"] = len(evidence)
    stats["estimated_tokens_saved_pct"] = round(100.0 * (1 - kept_chars / raw_chars), 1) if raw_chars else 0.0
    return evidence, stats
