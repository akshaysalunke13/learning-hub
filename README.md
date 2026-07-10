# Learning Hub

A static "AI Learning Hub" page: a per-lab content library (Anthropic /
OpenAI / Google / Meta) with search, sort, and type filters. Plain
HTML/CSS/JS, no build step — deployable free on GitHub Pages, Netlify,
Vercel, or Cloudflare Pages.

The Anthropic tab is backed by real data: every video in the
[Code with Claude 2026, London playlist](https://www.youtube.com/playlist?list=PLmWCw1CzcFilPJdvw6scjHjbBripZWFps),
fetched from the YouTube Data API. The other three tabs are still
placeholder "coming soon" content.

## Run locally

```
python3 -m http.server 8123
```

Then open `http://localhost:8123`. (Opening `index.html` directly via
`file://` won't work — the page `fetch()`s `data/anthropic-videos.json`,
which browsers block for local files without a server.)

## Refreshing the video data

`data/anthropic-videos.json` is a static snapshot (titles, view counts,
durations, publish dates). It does **not** update itself in the
browser — refresh it by re-running the fetch script, which calls the
YouTube Data API and overwrites the file. The API key stays on your
machine; it's never shipped to the site.

1. Create a key: [Google Cloud Console](https://console.cloud.google.com/)
   → new/existing project → **APIs & Services → Library** → enable
   "YouTube Data API v3" → **APIs & Services → Credentials → Create
   Credentials → API key**.
2. Run:
   ```
   YOUTUBE_API_KEY=your-key-here python3 scripts/fetch_playlist.py
   ```
3. Commit the updated `data/anthropic-videos.json` and redeploy.

To keep it fresh automatically, run step 2 on a schedule (e.g. a
GitHub Actions cron job that runs the script and commits the diff) —
ask if you want that wired up.

## Deploying

Any static host works — point it at this folder:

- **GitHub Pages**: push to a repo, enable Pages on the branch/folder.
- **Netlify / Vercel / Cloudflare Pages**: connect the repo (or drag-and-drop
  the folder), no build command needed.
