#!/usr/bin/env python3
"""Refresh data/<lab>-videos.json files from the YouTube Data API v3.

Usage:
    YOUTUBE_API_KEY=xxxx python3 scripts/fetch_playlist.py [lab ...]

With no arguments, refreshes every lab in PLAYLISTS; otherwise only the
named labs. Requires a YouTube Data API v3 key
(console.cloud.google.com -> APIs & Services -> Credentials). Uses only
the Python standard library.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
API_BASE = "https://www.googleapis.com/youtube/v3"

PLAYLISTS = {
    "anthropic": {
        "playlistId": "PLmWCw1CzcFilPJdvw6scjHjbBripZWFps",
        "tag": "Code with Claude",
    },
    "openai": {
        "playlistId": "PLOXw6I10VTv8-mTZk0v7oy1Bxfo3D2K5o",
        "tag": "DevDay 2025",
    },
    "google": {
        "playlistId": "PLOU2XLYxmsIKfqoxytJ70EOjSVexbqbtc",
        "tag": "Gemini for Developers",
    },
    "meta": {
        "playlistId": "PLb0IAmt7-GS3JHFIJ0mQVsPJeDawImtf-",
        "tag": "LlamaCon 2025",
    },
}

ISO8601_DURATION_RE = re.compile(
    r"P(?:\d+D)?T(?:(?P<h>\d+)H)?(?:(?P<m>\d+)M)?(?:(?P<s>\d+)S)?"
)


def api_get(path, params, api_key):
    params = {**params, "key": api_key}
    url = f"{API_BASE}/{path}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url) as resp:
        return json.load(resp)


def parse_duration(iso):
    m = ISO8601_DURATION_RE.match(iso)
    if not m:
        return 0, "0:00"
    h = int(m.group("h") or 0)
    mi = int(m.group("m") or 0)
    s = int(m.group("s") or 0)
    total = h * 3600 + mi * 60 + s
    label = f"{h}:{mi:02d}:{s:02d}" if h else f"{mi}:{s:02d}"
    return total, label


def fetch_playlist_video_ids(playlist_id, api_key):
    ids = []
    page_token = None
    while True:
        params = {
            "part": "contentDetails",
            "playlistId": playlist_id,
            "maxResults": 50,
        }
        if page_token:
            params["pageToken"] = page_token
        data = api_get("playlistItems", params, api_key)
        for item in data.get("items", []):
            ids.append(item["contentDetails"]["videoId"])
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    return ids


def fetch_video_details(video_ids, api_key):
    details = {}
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        data = api_get(
            "videos",
            {"part": "snippet,contentDetails,statistics", "id": ",".join(batch)},
            api_key,
        )
        for item in data.get("items", []):
            details[item["id"]] = item
    return details


def refresh_lab(lab, cfg, api_key):
    playlist_id = cfg["playlistId"]
    out_path = DATA_DIR / f"{lab}-videos.json"
    video_ids = fetch_playlist_video_ids(playlist_id, api_key)
    details = fetch_video_details(video_ids, api_key)

    items = []
    for index, vid in enumerate(video_ids, start=1):
        v = details.get(vid)
        if not v:
            continue
        snippet = v["snippet"]
        stats = v.get("statistics", {})
        duration_seconds, duration_label = parse_duration(v["contentDetails"]["duration"])
        thumbs = snippet.get("thumbnails", {})
        thumbnail = (
            thumbs.get("high")
            or thumbs.get("medium")
            or thumbs.get("default")
            or {}
        ).get("url", f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg")
        items.append(
            {
                "type": "video",
                "id": vid,
                "title": snippet["title"],
                "desc": snippet.get("description", "").split("\n")[0][:220],
                "author": snippet.get("channelTitle", ""),
                "date": snippet["publishedAt"][:10],
                "views": int(stats.get("viewCount", 0)),
                "durationSeconds": duration_seconds,
                "duration": duration_label,
                "order": index,
                "tags": [cfg["tag"]],
                "thumbnail": thumbnail,
                "url": f"https://www.youtube.com/watch?v={vid}&list={playlist_id}&index={index}",
            }
        )

    if not items:
        print(f"{lab}: playlist returned no videos; leaving {out_path} untouched.", file=sys.stderr)
        return False
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(items)} videos to {out_path}")
    return True


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        print("Set YOUTUBE_API_KEY in your environment first.", file=sys.stderr)
        sys.exit(1)

    labs = sys.argv[1:] or list(PLAYLISTS)
    unknown = [lab for lab in labs if lab not in PLAYLISTS]
    if unknown:
        print(f"Unknown lab(s): {', '.join(unknown)}. Known: {', '.join(PLAYLISTS)}", file=sys.stderr)
        sys.exit(1)

    ok = all([refresh_lab(lab, PLAYLISTS[lab], api_key) for lab in labs])
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
