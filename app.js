"use strict";

const LABS = {
  anthropic: {
    name: "Anthropic", tag: "Claude", mono: "A", wordmark: "Code with Claude", badge: "LIVE ARCHIVE",
    accent: "#e2765a", accentInk: "#141210", accentSoft: "rgba(226,118,90,.16)",
    bg: "#131315", panel: "#1c1c21", border: "rgba(255,255,255,.08)", rowLine: "rgba(255,255,255,.07)",
    chip: "rgba(255,255,255,.07)", ink: "#ededee", muted: "rgba(237,237,238,.56)", faint: "rgba(237,237,238,.44)",
    headFont: "'Space Grotesk',sans-serif", thumbA: "#26262c", thumbB: "#2d2d34",
    tagline: "The Code with Claude library.", sub: "Every talk from Code with Claude, in one place.",
    content: [],
    loaded: false,
    loadError: false
  },
  openai: {
    name: "OpenAI", tag: "GPT", mono: "O", wordmark: "Build with OpenAI", badge: "LIVE ARCHIVE",
    accent: "#19c37d", accentInk: "#04120c", accentSoft: "rgba(25,195,125,.15)",
    bg: "#0b0d0c", panel: "#15181a", border: "rgba(255,255,255,.08)", rowLine: "rgba(255,255,255,.07)",
    chip: "rgba(255,255,255,.06)", ink: "#ececec", muted: "rgba(236,236,236,.55)", faint: "rgba(236,236,236,.42)",
    headFont: "'Manrope',sans-serif", thumbA: "#1c2320", thumbB: "#232b27",
    tagline: "The DevDay library.", sub: "Every session from DevDay 2025, plus the latest OpenAI news.",
    content: [],
    loaded: false,
    loadError: false
  },
  google: {
    name: "Google DeepMind", tag: "Gemini", mono: "G", wordmark: "Build with Gemini", badge: "LIVE ARCHIVE",
    accent: "#6ea0ff", accentInk: "#08101f", accentSoft: "rgba(110,160,255,.16)",
    bg: "#0d0f14", panel: "#171a21", border: "rgba(255,255,255,.08)", rowLine: "rgba(255,255,255,.07)",
    chip: "rgba(255,255,255,.06)", ink: "#eceef2", muted: "rgba(236,238,242,.56)", faint: "rgba(236,238,242,.43)",
    headFont: "'Outfit',sans-serif", thumbA: "#1e2430", thumbB: "#252c3a",
    tagline: "Learn to build with Gemini.", sub: "Gemini for Developers sessions, plus posts from Google's developer blog.",
    content: [],
    loaded: false,
    loadError: false
  },
  meta: {
    name: "Meta AI", tag: "Llama", mono: "M", wordmark: "Build with Llama", badge: "LIVE ARCHIVE",
    accent: "#3b9bff", accentInk: "#04101f", accentSoft: "rgba(59,155,255,.16)",
    bg: "#0a0c12", panel: "#14171f", border: "rgba(255,255,255,.08)", rowLine: "rgba(255,255,255,.07)",
    chip: "rgba(255,255,255,.06)", ink: "#eceef1", muted: "rgba(236,238,241,.55)", faint: "rgba(236,238,241,.42)",
    headFont: "'Sora',sans-serif", thumbA: "#1b2130", thumbB: "#222a3b",
    tagline: "Ship with Llama, open by default.", sub: "Talks from LlamaCon 2025, plus Meta's AI Research engineering blog.",
    content: [],
    loaded: false,
    loadError: false
  }
};

const ORDER = ["anthropic", "openai", "google", "meta"];

function validLab(id) { return ORDER.includes(id) ? id : "anthropic"; }

const state = { lab: validLab(location.hash.slice(1)), query: "", sort: "newest", kind: "all" };

function fmtCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return "" + n;
}
function fmtDate(s) {
  const [y, m] = s.split("-").map(Number);
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] + " " + y;
}
function durSec(d) { return d.split(":").map(Number).reduce((acc, v) => acc * 60 + v, 0); }
function lengthSec(it) { return it.type === "video" ? durSec(it.duration) : (it.minutes || 0) * 60; }
function popularity(it) { return (it.type === "video" ? it.views : it.reads) || 0; }

function el(tag, className, props) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (props) Object.assign(e, props);
  return e;
}

function applyTheme(t) {
  const root = document.documentElement;
  root.style.setProperty("--bg", t.bg);
  root.style.setProperty("--ink", t.ink);
  root.style.setProperty("--muted", t.muted);
  root.style.setProperty("--faint", t.faint);
  root.style.setProperty("--panel", t.panel);
  root.style.setProperty("--border", t.border);
  root.style.setProperty("--row-line", t.rowLine);
  root.style.setProperty("--chip", t.chip);
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--accent-ink", t.accentInk);
  root.style.setProperty("--accent-soft", t.accentSoft);
  root.style.setProperty("--head-font", t.headFont);
}

function renderLabSwitcher(t) {
  const wrap = document.getElementById("labSwitcher");
  wrap.innerHTML = "";
  ORDER.forEach(id => {
    const L = LABS[id];
    const active = id === state.lab;
    const btn = el("button", "lab-tile", { title: L.name, textContent: L.mono });
    btn.setAttribute("aria-label", L.name);
    btn.setAttribute("aria-current", active ? "true" : "false");
    btn.style.background = active ? L.accent : "rgba(255,255,255,.05)";
    btn.style.color = active ? L.accentInk : L.accent;
    btn.style.boxShadow = active ? `0 4px 14px ${L.accentSoft}` : "none";
    btn.style.fontFamily = L.headFont;
    btn.addEventListener("click", () => { location.hash = id; setLab(id); });
    wrap.appendChild(btn);
  });
}

function renderSortGroup(t) {
  const wrap = document.getElementById("sortGroup");
  wrap.innerHTML = "";
  [["newest", "Newest"], ["popular", "Popular"], ["length", "Length"]].forEach(([id, label]) => {
    const active = id === state.sort;
    const btn = el("button", "chip-btn", { textContent: label });
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.style.background = active ? t.accentSoft : "transparent";
    btn.style.color = active ? t.accent : t.muted;
    btn.addEventListener("click", () => { state.sort = id; render(); });
    wrap.appendChild(btn);
  });
}

function renderKindGroup(t) {
  const wrap = document.getElementById("kindGroup");
  wrap.innerHTML = "";
  [["all", "All"], ["video", "Videos"], ["article", "Articles"]].forEach(([id, label]) => {
    const active = id === state.kind;
    const btn = el("button", "kind-btn", { textContent: label });
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.style.background = active ? t.accentSoft : "transparent";
    btn.style.color = active ? t.accent : t.muted;
    btn.style.borderColor = active ? "transparent" : t.border;
    btn.addEventListener("click", () => { state.kind = id; render(); });
    wrap.appendChild(btn);
  });
}

function renderList(t, items) {
  const wrap = document.getElementById("list");
  wrap.innerHTML = "";

  if (items.length === 0) {
    const kindWord = state.kind === "video" ? "videos" : state.kind === "article" ? "articles" : "items";
    const q = state.query.trim();
    const empty = el("div", "empty-state");
    const notLoaded = !t.loaded;
    const loadError = t.loaded && t.loadError;
    const title = el("div", "empty-title", {
      textContent: notLoaded ? "Loading…" : loadError ? "Couldn't load content" : q ? `No ${kindWord} match "${q}"` : `No ${kindWord} yet`
    });
    const sub = el("div", "empty-sub", {
      textContent: notLoaded ? "Fetching the latest talks." : loadError ? "Check your connection and reload the page." : "Try a different title, type, or clear your search."
    });
    empty.append(title, sub);
    wrap.appendChild(empty);
    return;
  }

  items.forEach(it => {
    const isVideo = it.type === "video";
    const row = it.url
      ? el("a", "item-row has-link", { href: it.url, target: "_blank", rel: "noopener" })
      : el("div", "item-row");

    const thumb = el("div", "item-thumb");
    if (it.thumbnail) {
      thumb.appendChild(el("img", "item-thumb-img", { src: it.thumbnail, alt: "", loading: "lazy" }));
    } else {
      thumb.style.background = `repeating-linear-gradient(45deg, ${t.thumbA}, ${t.thumbA} 10px, ${t.thumbB} 10px, ${t.thumbB} 20px)`;
    }
    const iconWrap = el("div", "item-thumb-icon");
    if (isVideo) {
      const badge = el("div", "play-badge");
      badge.appendChild(el("div", "play-triangle"));
      iconWrap.appendChild(badge);
    } else {
      const badge = el("div", "article-badge");
      badge.innerHTML = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="' + t.accentInk + '" stroke-width="2.4" stroke-linecap="round"><path d="M5 6h14M5 11h14M5 16h9"></path></svg>';
      iconWrap.appendChild(badge);
    }
    thumb.appendChild(iconWrap);
    const timeLabel = isVideo ? it.duration : it.minutes ? it.minutes + " min read" : "Article";
    thumb.appendChild(el("div", "item-time", { textContent: timeLabel }));
    row.appendChild(thumb);

    const body = el("div", "item-body");
    body.appendChild(el("div", "item-title", { textContent: it.title }));
    if (it.desc) body.appendChild(el("div", "item-desc", { textContent: it.desc }));

    const meta = el("div", "item-meta");
    meta.appendChild(el("span", "item-author", { textContent: it.author }));
    if (!isVideo && it.role) {
      meta.appendChild(el("span", "item-role", { textContent: it.role }));
    }
    meta.appendChild(el("span", null, { textContent: "·" }));
    meta.appendChild(el("span", null, { textContent: fmtDate(it.date) }));
    const pop = isVideo ? it.views : it.reads;
    if (pop != null) {
      meta.appendChild(el("span", null, { textContent: "·" }));
      meta.appendChild(el("span", null, { textContent: fmtCount(pop) + (isVideo ? " views" : " reads") }));
    }

    const tags = el("span", "item-tags");
    it.tags.forEach(tag => tags.appendChild(el("span", "item-tag", { textContent: tag })));
    meta.appendChild(tags);

    body.appendChild(meta);
    row.appendChild(body);

    wrap.appendChild(row);
  });
}

function render() {
  const t = LABS[state.lab];
  applyTheme(t);

  document.getElementById("wordmark").textContent = t.wordmark;
  document.getElementById("badge").textContent = t.badge;
  document.getElementById("tagline").textContent = t.tagline;
  document.getElementById("sub").textContent = t.sub;

  renderLabSwitcher(t);
  renderSortGroup(t);
  renderKindGroup(t);

  const q = state.query.trim().toLowerCase();
  let items = t.content.filter(it =>
    (state.kind === "all" || it.type === state.kind) &&
    (it.title.toLowerCase().includes(q) ||
      (it.author && it.author.toLowerCase().includes(q)) ||
      (it.tags || []).some(tag => tag.toLowerCase().includes(q)))
  );
  items = items.slice().sort((a, b) => {
    if (state.sort === "popular") return popularity(b) - popularity(a);
    if (state.sort === "length") return lengthSec(b) - lengthSec(a);
    return new Date(b.date) - new Date(a.date);
  });

  const kindWord = state.kind === "video" ? "videos" : state.kind === "article" ? "articles" : "items";
  document.getElementById("countLabel").textContent = q
    ? `${items.length} result${items.length === 1 ? "" : "s"}`
    : `${items.length} ${kindWord}`;

  renderList(t, items);
}

const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
searchInput.addEventListener("input", e => {
  state.query = e.target.value;
  clearBtn.hidden = state.query.length === 0;
  render();
});
clearBtn.addEventListener("click", () => {
  state.query = "";
  searchInput.value = "";
  clearBtn.hidden = true;
  render();
});

function setLab(id) {
  state.lab = id;
  state.query = "";
  searchInput.value = "";
  clearBtn.hidden = true;
  render();
}

window.addEventListener("hashchange", () => {
  const id = validLab(location.hash.slice(1));
  if (id !== state.lab) setLab(id);
});

async function loadLabContent(id) {
  const load = async url => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
    return res.json();
  };
  let videosFailed = false, articlesFailed = false;
  const [videos, articles] = await Promise.all([
    load(`data/${id}-videos.json`).catch(err => { console.error(err); videosFailed = true; return []; }),
    load(`data/${id}-articles.json`).catch(err => { console.error(err); articlesFailed = true; return []; })
  ]);
  const L = LABS[id];
  L.content = [...videos, ...articles];
  L.loaded = true;
  L.loadError = videosFailed && articlesFailed;
  if (state.lab === id) render();
}

render();
ORDER.forEach(loadLabContent);
