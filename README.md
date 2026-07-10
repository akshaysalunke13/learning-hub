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

## Refreshing the article data

`data/anthropic-articles.json` is likewise a static snapshot of
Anthropic's [engineering blog](https://www.anthropic.com/engineering)
index (titles, dates, links — the index has no per-post descriptions,
so none are included). No API key needed:

```
python3 scripts/fetch_articles.py
```

The script refuses to overwrite the file if the fetch fails or parses
to nothing, so a bad run never clobbers good data.

## Automatic refresh (GitHub Actions)

`.github/workflows/refresh-data.yml` runs both fetch scripts every
Monday at 06:00 UTC (or on demand via **Actions → Refresh data → Run
workflow**) and commits the diff if anything in `data/` changed. For
the video refresh to run, add your key as a repo secret: **Settings →
Secrets and variables → Actions → New repository secret** named
`YOUTUBE_API_KEY`. Without it the playlist step is skipped (the
articles refresh still runs).

## Deploying

`.github/workflows/deploy-pages.yml` deploys to GitHub Pages on every
push to `main` — one-time setup: **Settings → Pages → Source →
"GitHub Actions"**.

Any other static host also works — point it at this folder:

- **Netlify / Vercel / Cloudflare Pages**: connect the repo (or drag-and-drop
  the folder), no build command needed.
