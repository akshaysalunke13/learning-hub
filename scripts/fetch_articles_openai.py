#!/usr/bin/env python3
"""Refresh data/openai-articles.json from OpenAI's official news RSS feed.

Usage:
    python3 scripts/fetch_articles_openai.py

No API key required. Uses only the Python standard library.

Unlike Anthropic's engineering blog (a Next.js page scraped for embedded
RSC flight data — see fetch_articles.py), OpenAI publishes a proper RSS
2.0 feed for its news/blog index at https://openai.com/news/rss.xml. It
is parsed with `xml.etree.ElementTree` rather than regex/string-hacking.
Each `<item>` provides `title`, `description` (a real author-written
summary — used verbatim as `desc`, capped like the other real-data
sources), `link` (the canonical post URL), `category` (a coarse content
label such as "Product", "Research", "Company", "Safety", ...), and
`pubDate` in RFC 822 format, which is parsed with `email.utils.parsedate_to_datetime`
and normalized to `YYYY-MM-DD`.

The feed mixes many content categories (product launches, research,
policy/"Global Affairs", partnership announcements, etc.) under one
"OpenAI News" umbrella rather than being a dedicated engineering blog,
so `role` is a constant "News" for every item here (see CLAUDE.md: don't
label it "Engineering" unless it truly is one) and `tags` is a constant
["OpenAI News"] naming the source, not the per-post category.

The feed is already sorted newest-first; this script keeps that order
and caps the output at the ARTICLE_LIMIT most recent posts.
"""
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

FEED_URL = "https://openai.com/news/rss.xml"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "openai-articles.json"
ARTICLE_LIMIT = 28
DESC_MAX_LEN = 220

# The default urllib/Python UA gets blocked by some CDNs fronting this site.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

FULL_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def fetch_feed(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def normalize_date(pub_date):
    """Return a YYYY-MM-DD string from an RFC 822 pubDate, or None."""
    if not pub_date:
        return None
    try:
        dt = parsedate_to_datetime(pub_date)
    except (TypeError, ValueError):
        return None
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%d")


def clean_text(text):
    return " ".join((text or "").split()).strip()


def build_items(xml_bytes):
    root = ET.fromstring(xml_bytes)
    channel = root.find("channel")
    if channel is None:
        return []

    items = []
    for el in channel.findall("item"):
        title = clean_text(el.findtext("title"))
        link = clean_text(el.findtext("link"))
        desc = clean_text(el.findtext("description"))
        if len(desc) > DESC_MAX_LEN:
            desc = desc[:DESC_MAX_LEN]
        date = normalize_date(el.findtext("pubDate"))
        if not title or not link or not date:
            continue
        items.append(
            {
                "type": "article",
                "title": title,
                "desc": desc,
                "author": "OpenAI",
                "role": "News",
                "date": date,
                "dateApproximate": False,
                "tags": ["OpenAI News"],
                "url": link,
            }
        )
    # The feed is already newest-first, but sort explicitly to be safe
    # against any future change in feed ordering.
    items.sort(key=lambda it: it["date"], reverse=True)
    return items[:ARTICLE_LIMIT]


def validate(items):
    if not items:
        return "parsed zero articles"
    for it in items:
        if not it.get("title") or not it.get("url") or not it.get("date"):
            return f"item missing title/url/date: {it!r}"
        if not FULL_DATE_RE.match(it["date"]):
            return f"item has malformed date: {it!r}"
        if not it["url"].startswith("https://openai.com/"):
            return f"item has unexpected url: {it!r}"
    return None


def main():
    try:
        xml_bytes = fetch_feed(FEED_URL)
    except (urllib.error.URLError, TimeoutError) as exc:
        print(f"Failed to fetch {FEED_URL}: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        items = build_items(xml_bytes)
    except ET.ParseError as exc:
        print(f"Failed to parse feed XML: {exc}", file=sys.stderr)
        sys.exit(1)

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
