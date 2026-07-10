#!/usr/bin/env python3
"""Refresh data/meta-articles.json from Meta's engineering blog.

Usage:
    python3 scripts/fetch_articles_meta.py

No API key required. Uses only the Python standard library.

Source note: ai.meta.com/blog (Meta's marketing-facing AI blog) has no
public RSS feed and returns HTTP 400 to plain requests from this
environment regardless of User-Agent -- it appears to sit behind an
edge/WAF that rejects non-browser clients outright, not just a
UA-sniffing check. engineering.fb.com (Meta's engineering blog, a
WordPress site) does publish real per-category RSS feeds, so this
script pulls from its "AI Research" category feed instead:

    https://engineering.fb.com/category/ai-research/feed/

That feed endpoint supports WordPress's standard `?paged=N` pagination,
so this script walks pages 1..MAX_PAGES (stopping early if a page 404s
or returns no items) to build up a reasonably deep, real history rather
than just the ~9 most recent posts a single page returns.

Every post here is attributed as "Meta Engineering" (not "Meta AI") to
be transparent that it's the engineering blog's AI Research category,
not the ai.meta.com/blog marketing blog -- see CLAUDE.md's rule against
inventing/misattributing content.

Each RSS <item> gives an exact title, link, pubDate, and a WordPress
auto-generated excerpt in <description> (HTML, truncated with "[...]"
and followed by boilerplate "Read More..." / "The post X appeared
first on Y" paragraphs). clean_description() strips that boilerplate
and any remaining HTML tags to recover the real excerpt text -- never
inventing a description where the feed doesn't provide one.
"""
import html
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

FEED_URL_TMPL = "https://engineering.fb.com/category/ai-research/feed/?paged={page}"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "meta-articles.json"

MAX_PAGES = 3  # ~9 items/page -> up to ~27 items, within the ~25-30 target.
MAX_ITEMS = 30

# The default urllib/Python UA gets rejected by this site's edge.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

READ_MORE_RE = re.compile(
    r'<p>\s*<a[^>]*class="[^"]*read-more-link[^"]*"[^>]*>Read More\.\.\.</a>\s*</p>',
    re.IGNORECASE,
)
APPEARED_FIRST_ON_RE = re.compile(r"<p>\s*The post .*?appeared first on .*?</p>", re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# RFC-2822-ish pubDate months, e.g. "Tue, 30 Jun 2026 16:00:46 +0000".
MONTHS = {
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
    "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
}
PUBDATE_RE = re.compile(r"^\w+,\s+(\d{1,2})\s+(\w+)\s+(\d{4})\s")


def fetch_feed_page(page):
    url = FEED_URL_TMPL.format(page=page)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def clean_description(raw_html):
    if not raw_html:
        return ""
    text = READ_MORE_RE.sub("", raw_html)
    text = APPEARED_FIRST_ON_RE.sub("", text)
    text = TAG_RE.sub(" ", text)
    text = html.unescape(text)
    return WHITESPACE_RE.sub(" ", text).strip()


def parse_pubdate(pub_date):
    m = PUBDATE_RE.match(pub_date or "")
    if not m:
        return None
    day, mon_name, year = m.groups()
    month = MONTHS.get(mon_name)
    if not month:
        return None
    return f"{year}-{month}-{int(day):02d}"


def fetch_all_items():
    """Walk feed pages, returning a de-duplicated list of raw <item> elements."""
    items = []
    seen_links = set()
    for page in range(1, MAX_PAGES + 1):
        try:
            raw = fetch_feed_page(page)
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"Failed to fetch feed page {page}: {exc}", file=sys.stderr)
            break
        try:
            root = ET.fromstring(raw)
        except ET.ParseError as exc:
            print(f"Failed to parse feed page {page}: {exc}", file=sys.stderr)
            break
        channel = root.find("channel")
        if channel is None:
            break
        page_items = channel.findall("item")
        if not page_items:
            break
        new_count = 0
        for it in page_items:
            link_el = it.find("link")
            link = link_el.text if link_el is not None else None
            if not link or link in seen_links:
                continue
            seen_links.add(link)
            items.append(it)
            new_count += 1
        if new_count == 0:
            break
        if len(items) >= MAX_ITEMS:
            break
    return items[:MAX_ITEMS]


def build_items(raw_items):
    items = []
    for it in raw_items:
        title_el = it.find("title")
        link_el = it.find("link")
        pubdate_el = it.find("pubDate")
        desc_el = it.find("description")

        title = title_el.text.strip() if title_el is not None and title_el.text else None
        url = link_el.text.strip() if link_el is not None and link_el.text else None
        date = parse_pubdate(pubdate_el.text if pubdate_el is not None else None)
        if not title or not url or not date:
            continue
        # A handful of posts are cross-posted stubs that link out to
        # metacareers.com instead of hosting the real article on
        # engineering.fb.com; skip them rather than link off-source.
        if not url.startswith("https://engineering.fb.com/"):
            continue

        items.append(
            {
                "type": "article",
                "title": title,
                "desc": clean_description(desc_el.text if desc_el is not None else ""),
                "author": "Meta Engineering",
                "role": "AI Research",
                "date": date,
                "dateApproximate": False,
                "tags": ["Engineering at Meta — AI Research"],
                "url": url,
            }
        )
    return sorted(items, key=lambda x: x["date"], reverse=True)


def validate(items):
    if not items:
        return "parsed zero articles"
    for it in items:
        if not it.get("title") or not it.get("url") or not it.get("date"):
            return f"item missing title/url/date: {it!r}"
        if not DATE_RE.match(it["date"]):
            return f"item has malformed date: {it!r}"
        if not it["url"].startswith("https://engineering.fb.com/"):
            return f"item has unexpected url: {it!r}"
    return None


def main():
    raw_items = fetch_all_items()
    items = build_items(raw_items)

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
