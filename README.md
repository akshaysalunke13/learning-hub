# Learning Hub

A static "AI Learning Hub" page: a per-lab content library (Anthropic /
OpenAI / Google / Meta) with search, sort, and type filters. Plain
HTML/CSS/JS, no build step — deployable free on GitHub Pages, Netlify,
Vercel, or Cloudflare Pages.

All four tabs are backed by real data — an official conference/series
playlist from each lab's YouTube channel plus each lab's own blog or
news feed:

- **Anthropic** — [Code with Claude 2026, London](https://www.youtube.com/playlist?list=PLmWCw1CzcFilPJdvw6scjHjbBripZWFps)
  + the [engineering blog](https://www.anthropic.com/engineering)
- **OpenAI** — [DevDay 2025](https://www.youtube.com/playlist?list=PLOXw6I10VTv8-mTZk0v7oy1Bxfo3D2K5o)
  + [OpenAI News](https://openai.com/news) (RSS)
- **Google** — [Gemini for Developers](https://www.youtube.com/playlist?list=PLOU2XLYxmsIKfqoxytJ70EOjSVexbqbtc)
  + [Google for Developers Blog](https://developers.googleblog.com) (RSS,
  filtered to AI/Gemini topics)
- **Meta** — [LlamaCon 2025](https://www.youtube.com/playlist?list=PLb0IAmt7-GS3JHFIJ0mQVsPJeDawImtf-)
  + [Engineering at Meta, AI Research](https://engineering.fb.com/category/ai-research/) (RSS)

## Run locally

```
python3 -m http.server 8123
```

Then open `http://localhost:8123`. (Opening `index.html` directly via
`file://` won't work — the page `fetch()`s `data/anthropic-videos.json`,
which browsers block for local files without a server.)

## Refreshing the video data

The `data/<lab>-videos.json` files are static snapshots (titles, view
counts, durations, publish dates). They do **not** update themselves in
the browser — refresh them by re-running the fetch script, which calls
the YouTube Data API and overwrites the files. The API key stays on
your machine; it's never shipped to the site.

1. Create a key: [Google Cloud Console](https://console.cloud.google.com/)
   → new/existing project → **APIs & Services → Library** → enable
   "YouTube Data API v3" → **APIs & Services → Credentials → Create
   Credentials → API key**.
2. Run (all labs, or name specific ones):
   ```
   YOUTUBE_API_KEY=your-key-here python3 scripts/fetch_playlist.py
   YOUTUBE_API_KEY=your-key-here python3 scripts/fetch_playlist.py openai meta
   ```
3. Commit the updated `data/<lab>-videos.json` files and redeploy.

## Refreshing the article data

The `data/<lab>-articles.json` files are likewise static snapshots of
each lab's blog/news index. No API key needed — one script per lab
(they differ because each source publishes differently: Anthropic's
blog has no feed and is parsed from the page payload; the other three
use RSS):

```
python3 scripts/fetch_articles.py           # Anthropic
python3 scripts/fetch_articles_openai.py
python3 scripts/fetch_articles_google.py
python3 scripts/fetch_articles_meta.py
```

Descriptions are only included where the source itself provides them
(OpenAI/Google/Meta feeds do; Anthropic's blog index doesn't). Every
script refuses to overwrite its file if the fetch fails or parses to
nothing, so a bad run never clobbers good data.

## Automatic refresh (GitHub Actions)

`.github/workflows/refresh-data.yml` runs the playlist script (all
labs) and every article script each Monday at 06:00 UTC (or on demand via **Actions → Refresh data → Run
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
