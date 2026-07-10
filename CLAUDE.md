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
  regenerates `data/anthropic-videos.json`. Requires `YOUTUBE_API_KEY`
  in the environment; never commit a key.
- `data/anthropic-videos.json` — real talks from the [Code with Claude
  2026, London playlist](https://www.youtube.com/playlist?list=PLmWCw1CzcFilPJdvw6scjHjbBripZWFps):
  titles, view counts, durations, publish dates, thumbnails, per-video
  watch URLs. Static snapshot — only updates when the fetch script is
  re-run.
- `data/anthropic-articles.json` — real posts from Anthropic's
  engineering blog, each linking to its actual URL. The blog index
  page has no per-post descriptions, so none are invented here —
  titles and dates only. Also a static snapshot; no refresh script
  exists for this one yet.
- `README.md` — setup/deploy instructions, including how to create a
  YouTube API key and re-run the fetch script.

## Data model

The Anthropic tab is the only one backed by real data, loaded
client-side via `fetch()` of the two JSON files above
(`loadAnthropicContent()` in `app.js`) — not hardcoded, so a page
reload always reflects whatever's currently in `data/`. The OpenAI,
Google, and Meta tabs are still the original fictional "coming soon"
placeholder content from the source design — do not treat their
authors/titles/stats as real.

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
  layout, not the images themselves.
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
