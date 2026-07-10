# Learning Hub

A static "AI Learning Hub" content-library page: a per-lab tabbed view
(Anthropic / OpenAI / Google / Meta) with search, sort, and type
filters. Plain HTML/CSS/JS, no build step, no framework — deployable
free on GitHub Pages, Netlify, Vercel, or Cloudflare Pages.

Ported from a `.dc.html` design file (claude.ai/design project
"AI Learning Hub") into working code.

## Files

- `index.html`, `styles.css`, `app.js` — the app. `app.js` owns all
  state and rendering (vanilla JS, full re-render on state change, no
  framework). Per-lab theme values (colors, fonts) are applied as CSS
  custom properties on `<html>` — see `applyTheme()`.
- `scripts/fetch_playlist.py` — stdlib-only Python script that calls
  the YouTube Data API (`playlistItems.list` + `videos.list`) and
  regenerates `data/<lab>-videos.json` for every lab in its `PLAYLISTS`
  config (or only the labs named as CLI args). Requires
  `YOUTUBE_API_KEY` in the environment; never commit a key.
- `scripts/fetch_articles.py` — stdlib-only script that regenerates
  `data/anthropic-articles.json` from the engineering blog index (a
  Next.js page; posts are parsed out of the embedded RSC
  `__next_f.push` payloads, not the markup). No key needed. It exits
  non-zero without writing if the fetch fails or parses to nothing.
- `scripts/fetch_articles_{openai,google,meta}.py` — same pattern and
  safety guarantees, one per lab, all RSS-based (OpenAI News feed;
  Google for Developers Blog feed, keyword-filtered to AI/Gemini
  topics with per-post pages fetched for exact dates; Engineering at
  Meta's AI Research category feed — `ai.meta.com/blog` was
  unreachable from the dev environment, so the Meta tab transparently
  uses the engineering blog instead). These feeds provide real
  per-post summaries, so unlike the Anthropic file their `desc` fields
  are populated.
- `.github/workflows/` — `deploy-pages.yml` (GitHub Pages deploy on
  push to `main`; Pages source must be set to "GitHub Actions") and
  `refresh-data.yml` (weekly cron + manual dispatch: runs the playlist
  script and all article scripts, then commits the `data/` diff; the playlist step is skipped
  unless the `YOUTUBE_API_KEY` repo secret is set — note the secrets
  context isn't available in step-level `if:`, hence the job-level
  `HAS_YOUTUBE_KEY` env flag).
- `data/anthropic-videos.json` — real talks from the [Code with Claude
  2026, London playlist](https://www.youtube.com/playlist?list=PLmWCw1CzcFilPJdvw6scjHjbBripZWFps):
  titles, view counts, durations, publish dates, thumbnails, per-video
  watch URLs. Static snapshot — only updates when the fetch script is
  re-run.
- `data/anthropic-articles.json` — real posts from Anthropic's
  engineering blog, each linking to its actual URL. The blog index
  page has no per-post descriptions, so none are invented here —
  titles and dates only. Also a static snapshot; refresh with
  `scripts/fetch_articles.py`.
- `README.md` — setup/deploy instructions, including how to create a
  YouTube API key and re-run the fetch script.

## Data model

All four tabs are backed by real data, loaded client-side via
`fetch()` of `data/<lab>-videos.json` + `data/<lab>-articles.json`
(`loadLabContent()` in `app.js`) — not hardcoded, so a page reload
always reflects whatever's currently in `data/`. Sources per lab:
Anthropic = Code with Claude 2026 playlist + engineering blog;
OpenAI = DevDay 2025 playlist + OpenAI News RSS; Google = "Gemini for
Developers" playlist + Google for Developers Blog RSS; Meta =
LlamaCon 2025 playlist + Engineering at Meta AI Research RSS. The
original fictional placeholder content is gone. The non-Anthropic
video snapshots were bootstrapped without an API key by parsing
public YouTube page metadata (`ytInitialData` /
`ytInitialPlayerResponse`); ongoing refresh uses the Data API via
`fetch_playlist.py`, which covers all four playlists.

## Running locally

Must be served over HTTP, not opened via `file://` — the page
`fetch()`s the JSON data files, which browsers block for local files
without a server:

```
python3 -m http.server 8123
```

Then open `http://localhost:8123`.

## Known open issues

- Thumbnail rendering has shown visual artifacts in at least one
  browser (reported via screenshot, not yet reproduced/diagnosed in a
  controlled environment). The source JPEGs fetched directly from
  YouTube are correct, so the bug is presumed to be in the page's CSS/
  layout, not the images themselves. Speculative defensive fixes were
  applied (`display:block` on the img, opaque `background-color` and
  `isolation:isolate` on `.item-thumb`) but remain unverified in a
  real browser — treat this as open until confirmed.
- This dev environment has no browser, Node, or Playwright installed,
  and no working `pip`/`ensurepip`/passwordless `sudo` — so UI changes
  here have been verified by static analysis (syntax/brace-balance
  checks, HTTP status checks, direct image downloads) rather than by
  actually rendering the page. Treat "looks right in the code" as
  provisional until confirmed in a real browser.

## Conventions

- No build step, on purpose — keep it deployable by dragging the
  folder onto any static host.
- Don't invent content (descriptions, dates, stats) for real data
  sources when the source doesn't provide it; leave the field out or
  render conditionally (see `it.desc` / `it.role` handling in
  `renderList()`) rather than fabricating plausible-sounding text.
- API keys are never written to files in this repo — scripts read them
  from the environment only.
