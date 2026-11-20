"""GDPR-safe public evidence collection.

Sources (public, non-personal only):
  * Competitor product / pricing pages (httpx + trafilatura)
  * Hacker News Algolia API (comment text only — no usernames stored)
  * Public Reddit search .json (post title + body only — no usernames stored)

Every network call is wrapped so the pipeline NEVER crashes; failures become log lines.
"""
from __future__ import annotations

import asyncio
import html
import logging
import re
from typing import Any
from urllib.parse import quote_plus, urlparse

import httpx

log = logging.getLogger("wedge.scraper")

USER_AGENT = "WedgeBot/1.0 (public market research; no personal data)"
TIMEOUT = 8.0

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE_RE = re.compile(r"\+?\d[\d\s().-]{8,}\d")
_USER_MENTION_RE = re.compile(r"(?<!\w)(?:u/|@)[A-Za-z0-9_-]{2,}")
_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def scrub_pii(text: str) -> str:
    """Remove anything that could identify a person (emails, phones, @handles, u/handles)."""
    text = _EMAIL_RE.sub("[email removed]", text)
    text = _PHONE_RE.sub("[number removed]", text)
    text = _USER_MENTION_RE.sub("[user]", text)
    return text


def clean_html_text(text: str) -> str:
    text = html.unescape(_TAG_RE.sub(" ", text or ""))
    return _WS_RE.sub(" ", text).strip()


def is_blocked_url(url: str) -> bool:
    """Never touch profile-style / personal-data sources."""
    host = (urlparse(url).hostname or "").lower()
    blocked = ("linkedin.com", "facebook.com", "instagram.com", "x.com", "twitter.com")
    return any(host == b or host.endswith("." + b) for b in blocked)


def name_from_url(url: str) -> str:
    host = (urlparse(url if "://" in url else f"https://{url}").hostname or url).lower()
    host = host.removeprefix("www.")
    return host.split(".")[0].capitalize() if host else url


def normalize_url(url: str) -> str:
    url = url.strip()
    if url and "://" not in url:
        url = "https://" + url
    return url


async def fetch_competitor_page(client: httpx.AsyncClient, url: str, logs: list[str]) -> list[dict[str, Any]]:
    url = normalize_url(url)
    if not url:
        return []
    if is_blocked_url(url):
        logs.append(f"[scraper] Skipped {url}: personal-data platform blocked by GDPR policy")
        return []
    try:
        import trafilatura

        r = await client.get(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
        r.raise_for_status()
        text = trafilatura.extract(r.text, include_comments=False, include_tables=True, favor_recall=True) or ""
        text = scrub_pii(_WS_RE.sub(" ", text).strip())
        if not text:
            logs.append(f"[scraper] {url}: no extractable text")
            return []
        logs.append(f"[scraper] Competitor page {url}: {len(text)} chars extracted")
        return [{
            "source_type": "competitor_page",
            "title": f"{name_from_url(url)} — public product/pricing page",
            "url": str(r.url),
            "text": text[:12000],
        }]
    except Exception as e:
        logs.append(f"[scraper] WARN competitor {url} failed: {type(e).__name__}")
        log.warning("competitor fetch failed %s: %s", url, e)
        return []


async def fetch_hn(client: httpx.AsyncClient, name: str, logs: list[str]) -> list[dict[str, Any]]:
    url = f"https://hn.algolia.com/api/v1/search?query={quote_plus(name)}&tags=comment&hitsPerPage=12"
    try:
        r = await client.get(url, headers={"User-Agent": USER_AGENT})
        r.raise_for_status()
        hits = r.json().get("hits", [])
        docs = []
        for h in hits:
            text = scrub_pii(clean_html_text(h.get("comment_text") or ""))
            if len(text) < 40:
                continue
            oid = h.get("objectID")
            story = clean_html_text(h.get("story_title") or "") or "Hacker News discussion"
            docs.append({
                "source_type": "hacker_news",
                "title": f"HN comment on: {story[:90]}",
                "url": f"https://news.ycombinator.com/item?id={oid}",
                "text": text[:3000],
            })
        logs.append(f"[scraper] Hacker News '{name}': {len(docs)} comments")
        return docs
    except Exception as e:
        logs.append(f"[scraper] WARN Hacker News '{name}' failed: {type(e).__name__}")
        log.warning("hn fetch failed %s: %s", name, e)
        return []


async def fetch_reddit(client: httpx.AsyncClient, name: str, logs: list[str]) -> list[dict[str, Any]]:
    q = f"{name} alternative OR pricing OR frustrating"
    url = f"https://www.reddit.com/search.json?q={quote_plus(q)}&limit=8"
    try:
        r = await client.get(url, headers={"User-Agent": "WedgeBot/1.0"})
        r.raise_for_status()
        children = r.json().get("data", {}).get("children", [])
        docs = []
        for c in children:
            d = c.get("data", {})
            if d.get("over_18"):
                continue
            title = clean_html_text(d.get("title") or "")
            body = clean_html_text(d.get("selftext") or "")
            text = scrub_pii(f"{title}. {body}".strip(". "))
            if len(text) < 40:
                continue
            permalink = d.get("permalink") or ""
            sub = d.get("subreddit_name_prefixed") or "reddit"
            docs.append({
                "source_type": "reddit",
                "title": f"{sub}: {title[:90]}",
                "url": f"https://www.reddit.com{permalink}" if permalink else "https://www.reddit.com",
                "text": text[:3000],
            })
        logs.append(f"[scraper] Reddit '{name}': {len(docs)} public threads")
        return docs
    except Exception as e:
        logs.append(f"[scraper] WARN Reddit '{name}' failed: {type(e).__name__}")
        log.warning("reddit fetch failed %s: %s", name, e)
        return []


async def collect_public_evidence(
    competitor_urls: list[str], competitor_names: list[str], logs: list[str], search_terms: list[str] | None = None
) -> list[dict[str, Any]]:
    names = [n.strip() for n in (search_terms or competitor_names) if n and n.strip()]
    if not names:
        names = [name_from_url(u) for u in competitor_urls if u.strip()]
    names = list(dict.fromkeys(names))[:4]

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            tasks = [fetch_competitor_page(client, u, logs) for u in competitor_urls[:3] if u.strip()]
            for n in names:
                tasks.append(fetch_hn(client, n, logs))
                tasks.append(fetch_reddit(client, n, logs))
            results = await asyncio.gather(*tasks, return_exceptions=True)
    except Exception as e:  # pragma: no cover - defensive
        logs.append(f"[scraper] WARN client failure: {type(e).__name__}")
        return []

    docs: list[dict[str, Any]] = []
    for res in results:
        if isinstance(res, list):
            docs.extend(res)
    return docs
