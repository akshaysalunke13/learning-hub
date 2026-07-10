#!/usr/bin/env python3
"""Refresh data/google-articles.json from developers.googleblog.com.

Usage:
    python3 scripts/fetch_articles_google.py

No API key required. Uses only the Python standard library.

Source: the Google for Developers Blog exposes a real RSS 2.0 feed at
`/feeds/posts/default/` (the URL path looks like classic Blogger, but
this is actually a custom CMS -- Blogger-style label feeds like
`/feeds/posts/default/-/Gemini/` 404, so per-post relevance can't be
filtered server-side). The feed itself is capped at the 20 most recent
posts regardless of `max-results`, and each `<item>` only carries
`title`, `link`, and `description` -- no `pubDate` or `<category>`.

To get a real publish date, each post's own page is fetched and its
`application/ld+json` `"@type": "Article"` block is parsed for
`datePublished` (reliable and present on every post checked). That
same block's `description` field is often empty, so the RSS item's
`description` is used as the article summary instead -- it's the
site's own (sometimes truncated with a trailing "...") excerpt, never
invented here.

The blog covers all of Google's developer surface (Android, Cloud,
Web, Identity, AI, ...), not just Gemini/DeepMind, so posts are kept
only if their title+description contains at least one term from
RELEVANT_KEYWORDS below (Gemini/Gemma/DeepMind/agent-ecosystem terms).
This is a keyword filter over real fetched text, not fabrication.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

FEED_URL = "https://developers.googleblog.com/feeds/posts/default/"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "google-articles.json"

# The default urllib/Python UA gets blocked/differently-served by this site.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

AUTHOR = "Google for Developers"
ROLE = "Developers Blog"
TAG = "Google for Developers Blog"

MAX_ITEMS = 30
REQUEST_DELAY_SECONDS = 0.5

FULL_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

LD_JSON_RE = re.compile(
    r'<script type="application/ld\+json">(.*?)</script>', re.DOTALL
)

# Keyword filter for relevance to the Gemini / Google DeepMind ecosystem.
# Matched case-insensitively, as whole words, against title + description.
RELEVANT_KEYWORDS = [
    "gemini", "gemma", "deepmind", "agent", "agents", "agentic", "adk",
    "a2a", "mcp", "genkit", "jules", "tpu", "llm", "multimodal",
    "antigravity", "litert", "maxtext", "pathways", "ai", "ml",
    "machine learning", "vertex",
]
RELEVANT_RE = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in RELEVANT_KEYWORDS) + r")\b",
    re.IGNORECASE,
)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_feed(xml_text):
    """Parse the RSS <item> list into (title, link, description) tuples."""
    import xml.etree.ElementTree as ET

    root = ET.fromstring(xml_text)
    items = []
    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        desc = (item.findtext("description") or "").strip()
        if title and link:
            items.append((title, link, desc))
    return items


def fetch_date_published(url):
    """Fetch a post page and pull datePublished out of its Article JSON-LD."""
    try:
        html = fetch(url)
    except (urllib.error.URLError, TimeoutError) as exc:
        print(f"  warning: failed to fetch {url}: {exc}", file=sys.stderr)
        return None

    for block in LD_JSON_RE.findall(html):
        try:
            obj = json.loads(block)
        except json.JSONDecodeError:
            continue
        if obj.get("@type") == "Article":
            date = obj.get("datePublished")
            if date and FULL_DATE_RE.match(date):
                return date
    return None


def is_relevant(title, desc):
    return bool(RELEVANT_RE.search(f"{title} {desc}"))


def build_items(feed_items):
    items = []
    for title, link, desc in feed_items:
        if not is_relevant(title, desc):
            print(f"  skip (not Gemini/DeepMind-relevant): {title!r}")
            continue

        date = fetch_date_published(link)
        time.sleep(REQUEST_DELAY_SECONDS)

        if not date:
            print(f"  skip (no datePublished found): {title!r}", file=sys.stderr)
            continue

        items.append(
            {
                "type": "article",
                "title": title,
                "desc": desc,
                "author": AUTHOR,
                "role": ROLE,
                "date": date,
                "dateApproximate": False,
                "tags": [TAG],
                "url": link,
            }
        )
        print(f"  OK {date}: {title!r}")

    items.sort(key=lambda it: it["date"], reverse=True)
    return items[:MAX_ITEMS]


def validate(items):
    if not items:
        return "parsed zero articles"
    for it in items:
        if not it.get("title") or not it.get("url") or not it.get("date"):
            return f"item missing title/url/date: {it!r}"
        if not FULL_DATE_RE.match(it["date"]):
            return f"item has malformed date: {it!r}"
        if not it["url"].startswith("https://developers.googleblog.com/"):
            return f"item has unexpected url: {it!r}"
    return None


def main():
    try:
        feed_xml = fetch(FEED_URL)
    except (urllib.error.URLError, TimeoutError) as exc:
        print(f"Failed to fetch {FEED_URL}: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        feed_items = parse_feed(feed_xml)
    except Exception as exc:  # malformed XML, etc.
        print(f"Failed to parse feed XML: {exc}", file=sys.stderr)
        sys.exit(1)

    if not feed_items:
        print("Refusing to write: parsed zero feed items. Leaving existing file untouched.", file=sys.stderr)
        sys.exit(1)

    items = build_items(feed_items)

    error = validate(items)
    if error:
        print(
            f"Refusing to write {OUT_PATH}: {error}. Leaving existing file untouched.",
            file=sys.stderr,
        )
        sys.exit(1)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(items)} articles to {OUT_PATH}")


if __name__ == "__main__":
    main()
