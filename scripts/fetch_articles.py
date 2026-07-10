#!/usr/bin/env python3
"""Refresh data/anthropic-articles.json from anthropic.com/engineering.

Usage:
    python3 scripts/fetch_articles.py

No API key required. Uses only the Python standard library.

The engineering blog index is a Next.js (App Router) page. It has no
public API, so post data isn't in plain markup — it's embedded as
React Server Components "flight" data in `self.__next_f.push([...])`
`<script>` tags. Each push call's second element is a JSON-encoded
string; concatenating those strings and searching for
`{"_type":"engineeringArticle", ...}` objects (Sanity CMS content
type) recovers each post's title, slug, and publish date. Those
objects' keys happen to be serialized in alphabetical order, so every
one starts with the literal `{"_type":"engineeringArticle"`, which is
used below to locate each object before brace-matching it out and
parsing it as standalone JSON.

The index page provides no per-post descriptions/summaries usable
here per project convention (see CLAUDE.md) — `desc` is always left
as "".
"""
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

INDEX_URL = "https://www.anthropic.com/engineering"
POST_URL_TMPL = "https://www.anthropic.com/engineering/{slug}"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "anthropic-articles.json"

# The default urllib/Python UA gets a 403 from this site.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

NEXT_F_PUSH_RE = re.compile(r"self\.__next_f\.push\(\[.*?\]\)</script>", re.DOTALL)
ARTICLE_START = '{"_type":"engineeringArticle"'
FULL_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
YEAR_MONTH_RE = re.compile(r"^\d{4}-\d{2}$")
YEAR_RE = re.compile(r"^\d{4}$")


def fetch_html(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def decode_next_f_payload(html):
    """Concatenate the decoded string payloads of every __next_f.push call."""
    chunks = []
    for block in NEXT_F_PUSH_RE.findall(html):
        inner = block[len("self.__next_f.push(") : -len(")</script>")]
        try:
            arr = json.loads(inner)
        except json.JSONDecodeError:
            continue
        if len(arr) >= 2 and isinstance(arr[1], str):
            chunks.append(arr[1])
    return "".join(chunks)


def extract_balanced_object(text, start):
    """Given the index of a '{', return the matching '}' index (inclusive)."""
    depth = 0
    in_str = False
    escape = False
    i = start
    while i < len(text):
        c = text[i]
        if in_str:
            if escape:
                escape = False
            elif c == "\\":
                escape = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1


def find_article_objects(payload):
    """Locate every engineeringArticle JSON object embedded in payload."""
    objects = []
    idx = 0
    while True:
        start = payload.find(ARTICLE_START, idx)
        if start == -1:
            break
        end = extract_balanced_object(payload, start)
        if end == -1:
            break
        raw = payload[start : end + 1]
        idx = end + 1
        try:
            objects.append(json.loads(raw))
        except json.JSONDecodeError:
            continue
    return objects


def normalize_date(published_on):
    """Return (date, dateApproximate) from a Sanity 'publishedOn' string."""
    if not published_on:
        return None, True
    if FULL_DATE_RE.match(published_on):
        return published_on, False
    if YEAR_MONTH_RE.match(published_on):
        return f"{published_on}-01", True
    if YEAR_RE.match(published_on):
        return f"{published_on}-01-01", True
    return None, True


def build_items(article_objs):
    items_by_slug = {}
    for obj in article_objs:
        title = obj.get("title")
        slug = (obj.get("slug") or {}).get("current")
        date, approximate = normalize_date(obj.get("publishedOn"))
        if not title or not slug or not date:
            continue
        items_by_slug[slug] = {
            "type": "article",
            "title": title,
            "desc": "",
            "author": "Anthropic",
            "role": "Engineering",
            "date": date,
            "dateApproximate": approximate,
            "tags": ["Engineering blog"],
            "url": POST_URL_TMPL.format(slug=slug),
        }
    return sorted(items_by_slug.values(), key=lambda it: it["date"], reverse=True)


def validate(items):
    if not items:
        return "parsed zero articles"
    for it in items:
        if not it.get("title") or not it.get("url") or not it.get("date"):
            return f"item missing title/url/date: {it!r}"
        if not FULL_DATE_RE.match(it["date"]):
            return f"item has malformed date: {it!r}"
        if not it["url"].startswith("https://www.anthropic.com/engineering/"):
            return f"item has unexpected url: {it!r}"
    return None


def main():
    try:
        html = fetch_html(INDEX_URL)
    except (urllib.error.URLError, TimeoutError) as exc:
        print(f"Failed to fetch {INDEX_URL}: {exc}", file=sys.stderr)
        sys.exit(1)

    payload = decode_next_f_payload(html)
    article_objs = find_article_objects(payload)
    items = build_items(article_objs)

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
