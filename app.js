"use strict";

const ANTHROPIC_VIDEOS_URL = "data/anthropic-videos.json";
const ANTHROPIC_ARTICLES_URL = "data/anthropic-articles.json";

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
    name: "OpenAI", tag: "GPT", mono: "O", wordmark: "Build with OpenAI", badge: "PREVIEW",
    accent: "#19c37d", accentInk: "#04120c", accentSoft: "rgba(25,195,125,.15)",
    bg: "#0b0d0c", panel: "#15181a", border: "rgba(255,255,255,.08)", rowLine: "rgba(255,255,255,.07)",
    chip: "rgba(255,255,255,.06)", ink: "#ececec", muted: "rgba(236,236,236,.55)", faint: "rgba(236,236,236,.42)",
    headFont: "'Manrope',sans-serif", thumbA: "#1c2320", thumbB: "#232b27",
    tagline: "Build on the OpenAI platform.", sub: "Coming soon — a preview of how each lab gets its own space.",
    content: [
      { type: "video", title: "The Realtime API: voice agents end to end", desc: "Stream audio in and out, interrupt naturally, and call tools mid-conversation.", author: "Platform Team", date: "2025-05-11", views: 51200, duration: "33:20", tags: ["Realtime", "Voice"] },
      { type: "video", title: "Structured outputs and JSON mode", desc: "Guarantee schema-valid responses and wire them straight into your app.", author: "Platform Team", date: "2025-04-02", views: 40120, duration: "21:48", tags: ["Structured"] },
      { type: "video", title: "Function calling deep dive", desc: "Design tools the model actually uses well, and handle multi-step calls cleanly.", author: "Platform Team", date: "2025-03-19", views: 72340, duration: "29:55", tags: ["Tools"] },
      { type: "video", title: "Fine-tuning for your domain", desc: "When to fine-tune versus prompt, and how to build a dataset that pays off.", author: "Platform Team", date: "2025-02-08", views: 33890, duration: "26:12", tags: ["Fine-tuning"] },
      { type: "article", title: "Planning for AGI and beyond", desc: "How a gradual transition, iterative deployment, and broad benefit should guide the path to AGI.", author: "Sam Altman", role: "CEO", date: "2025-02-24", reads: 430000, minutes: 15, tags: ["Essay"] },
      { type: "article", title: "Reliable tool calling at scale", desc: "Field notes on schema design, retries, and evals that keep tool-using apps dependable.", author: "Platform Team", role: "Engineering", date: "2025-03-30", reads: 88000, minutes: 10, tags: ["Tools"] }
    ]
  },
  google: {
    name: "Google DeepMind", tag: "Gemini", mono: "G", wordmark: "Build with Gemini", badge: "PREVIEW",
    accent: "#6ea0ff", accentInk: "#08101f", accentSoft: "rgba(110,160,255,.16)",
    bg: "#0d0f14", panel: "#171a21", border: "rgba(255,255,255,.08)", rowLine: "rgba(255,255,255,.07)",
    chip: "rgba(255,255,255,.06)", ink: "#eceef2", muted: "rgba(236,238,242,.56)", faint: "rgba(236,238,242,.43)",
    headFont: "'Outfit',sans-serif", thumbA: "#1e2430", thumbB: "#252c3a",
    tagline: "Learn to build with Gemini.", sub: "Coming soon — a preview of how each lab gets its own space.",
    content: [
      { type: "video", title: "Long-context prompting with Gemini", desc: "Put a whole codebase or book in the window — and get useful answers back.", author: "DeepMind", date: "2025-05-16", views: 44300, duration: "27:40", tags: ["Long context"] },
      { type: "video", title: "Multimodal prompting: images, audio, video", desc: "One model, many inputs. Ground answers in what the model can see and hear.", author: "DeepMind", date: "2025-04-22", views: 38700, duration: "30:15", tags: ["Multimodal"] },
      { type: "video", title: "Function calling with the Gemini API", desc: "Connect Gemini to your tools and let it orchestrate real actions.", author: "DeepMind", date: "2025-03-05", views: 29500, duration: "22:33", tags: ["Tools"] },
      { type: "article", title: "A new era for AI research", desc: "Why the next breakthroughs will come from combining large models with search, planning, and science.", author: "Demis Hassabis", role: "CEO", date: "2025-01-28", reads: 310000, minutes: 18, tags: ["Essay"] },
      { type: "article", title: "Scaling long-context models", desc: "The engineering behind million-token windows — memory, attention, and retrieval trade-offs.", author: "DeepMind Research", role: "Engineering", date: "2025-03-08", reads: 76000, minutes: 11, tags: ["Long context"] }
    ]
  },
  meta: {
    name: "Meta AI", tag: "Llama", mono: "M", wordmark: "Build with Llama", badge: "PREVIEW",
    accent: "#3b9bff", accentInk: "#04101f", accentSoft: "rgba(59,155,255,.16)",
    bg: "#0a0c12", panel: "#14171f", border: "rgba(255,255,255,.08)", rowLine: "rgba(255,255,255,.07)",
    chip: "rgba(255,255,255,.06)", ink: "#eceef1", muted: "rgba(236,238,241,.55)", faint: "rgba(236,238,241,.42)",
    headFont: "'Sora',sans-serif", thumbA: "#1b2130", thumbB: "#222a3b",
    tagline: "Ship with Llama, open by default.", sub: "Coming soon — a preview of how each lab gets its own space.",
    content: [
      { type: "video", title: "Fine-tuning Llama 3 for your product", desc: "A practical path from base weights to a model that fits your domain.", author: "Meta AI", date: "2025-05-09", views: 39800, duration: "34:02", tags: ["Fine-tuning"] },
      { type: "video", title: "Running Llama locally with Ollama", desc: "Get an open model running on your laptop and talking to your code in minutes.", author: "Meta AI", date: "2025-04-01", views: 58400, duration: "18:20", tags: ["Local", "Ollama"] },
      { type: "video", title: "Building RAG with Llama", desc: "Retrieval that grounds answers in your own documents — the whole pipeline.", author: "Meta AI", date: "2025-03-11", views: 42600, duration: "28:47", tags: ["RAG"] },
      { type: "article", title: "Open source AI is the path forward", desc: "The case for open models — why they are safer, cheaper, and better for the whole ecosystem.", author: "Mark Zuckerberg", role: "CEO", date: "2025-02-05", reads: 640000, minutes: 14, tags: ["Essay"] },
      { type: "article", title: "Serving Llama efficiently", desc: "Quantization, batching, and KV-cache tricks that make open models cheap to run in production.", author: "Meta AI", role: "Engineering", date: "2025-03-22", reads: 92000, minutes: 9, tags: ["Inference"] }
    ]
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
    const notLoaded = state.lab === "anthropic" && !LABS.anthropic.loaded;
    const loadError = state.lab === "anthropic" && LABS.anthropic.loaded && LABS.anthropic.loadError;
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

async function loadAnthropicContent() {
  const load = async url => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
    return res.json();
  };
  let videosFailed = false, articlesFailed = false;
  const [videos, articles] = await Promise.all([
    load(ANTHROPIC_VIDEOS_URL).catch(err => { console.error(err); videosFailed = true; return []; }),
    load(ANTHROPIC_ARTICLES_URL).catch(err => { console.error(err); articlesFailed = true; return []; })
  ]);
  LABS.anthropic.content = [...videos, ...articles];
  LABS.anthropic.loaded = true;
  LABS.anthropic.loadError = videosFailed && articlesFailed;
  if (state.lab === "anthropic") render();
}

render();
loadAnthropicContent();
