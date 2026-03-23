import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content", "posts");
const COMPANIES_PATH = path.join(ROOT, "content", "setup", "companies.json");
const DIST_DIR = path.join(ROOT, "dist");
const POSTS_OUT_DIR = path.join(DIST_DIR, "posts");

const CATEGORIES = [
  { id: "daily", title: "Daily Briefly", desc: "Daily world economy summary and notes ($10 tier)." },
  { id: "weekly", title: "Weekly Briefly", desc: "Weekly roundups and deeper dives ($10 tier)." },
  { id: "market", title: "Market", desc: "Reading market sentiment and trends ($30 tier)." },
  { id: "setup", title: "Setup", desc: "Companies, tech, and watchlists I'm studying ($30 tier)." },
  { id: "trades", title: "Trades", desc: "Buy/sell logs ($30 tier)." },
];

// Cache-bust assets during local preview/static hosting without relying on server headers.
const BUILD_ID = Date.now().toString(36);

function escHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";
}

function parseFrontmatter(md) {
  if (!md.startsWith("---")) return { data: {}, body: md };
  const end = md.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: md };
  const raw = md.slice(3, end).trim();
  const body = md.slice(end + "\n---".length).replace(/^\s*\n/, "");
  const data = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === "true") data[key] = true;
    else if (val === "false") data[key] = false;
    else data[key] = val;
  }
  return { data, body };
}

function mdInline(s) {
  let out = escHtml(s);
  // inline code
  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${escHtml(code)}</code>`);
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic (simple)
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  // links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    const safeHref = escHtml(href.trim());
    return `<a href="${safeHref}" class="inline-link">${escHtml(text)}</a>`;
  });
  return out;
}

function parseTable(lines, startIdx) {
  const header = lines[startIdx];
  const sep = lines[startIdx + 1] || "";
  if (!sep.includes("|") || !sep.match(/-+/)) return null;
  const rows = [];
  let i = startIdx;
  while (i < lines.length && lines[i].includes("|")) {
    rows.push(lines[i]);
    i += 1;
  }
  const splitRow = (row) =>
    row
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
  const headCells = splitRow(rows[0]);
  const bodyRows = rows.slice(2).map(splitRow);

  const thead = `<thead><tr>${headCells.map((c) => `<th>${mdInline(c)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${bodyRows
    .map((r) => `<tr>${r.map((c) => `<td>${mdInline(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  const html = `<div class="table-wrap"><table class="table-standard">${thead}${tbody}</table></div>`;
  return { html, nextIdx: i };
}

function makeFigure({ title, svg, caption }) {
  return `<figure class="data-card figure-card">
  <div class="figure-title">${escHtml(title)}</div>
  ${svg}
  <div class="figure-caption">${escHtml(caption)}</div>
</figure>`;
}

const DAILY_INFOGRAPHICS = {
  // keyed by heading text
  "Section I — The End of General-Purpose Compute": makeFigure({
    title: "Efficiency becomes the constraint",
    svg: `<svg viewBox="0 0 720 210" width="100%" height="auto" role="img" aria-label="Triangle showing AI system constraints: watts, dollars, latency" class="figure-svg">
  <defs>
    <linearGradient id="effA" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#635bff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#00d4ff" stop-opacity="0.14"/>
    </linearGradient>
  </defs>
  <rect x="16" y="18" width="688" height="174" rx="16" fill="white" stroke="#e6ebf1"/>
  <text x="42" y="52" font-size="12" fill="#0a2540" font-weight="900">AI scaling constraints</text>
  <text x="42" y="74" font-size="11" fill="#6b7c93">After 2026, systems optimize for efficiency per watt/dollar/millisecond</text>

  <path d="M210 154 L360 78 L510 154 Z" fill="url(#effA)" stroke="rgba(99,91,255,0.28)"/>
  <circle cx="210" cy="154" r="7" fill="#635bff" opacity="0.7"/>
  <circle cx="360" cy="78" r="7" fill="#00d4ff" opacity="0.75"/>
  <circle cx="510" cy="154" r="7" fill="#b87333" opacity="0.55"/>

  <text x="160" y="178" font-size="11" fill="#0a2540" font-weight="800">$/token</text>
  <text x="336" y="62" font-size="11" fill="#0a2540" font-weight="800">ms</text>
  <text x="486" y="178" font-size="11" fill="#0a2540" font-weight="800">W</text>

  <text x="420" y="118" font-size="12" fill="#0a2540" font-weight="900">Optimize</text>
  <text x="420" y="138" font-size="11" fill="#6b7c93">not FLOPs, but economics</text>

  <path d="M560 118 C 600 118, 630 118, 666 118" fill="none" stroke="#e6ebf1" stroke-width="6" stroke-linecap="round"/>
  <circle cx="560" cy="118" r="4" fill="#00d4ff" opacity="0.9">
    <animate attributeName="cx" from="560" to="666" dur="1.4s" repeatCount="indefinite"/>
  </circle>
</svg>`,
    caption: "The dominant constraint shifts from raw capability to efficiency: energy, cost, and latency become the primary optimization targets.",
  }),
  "Section II — ASICs Become the Backbone of AI Infrastructure": makeFigure({
    title: "ASICs become the backbone",
    svg: `<svg viewBox="0 0 720 210" width="100%" height="auto" role="img" aria-label="Diagram showing shift from general GPUs to purpose-built ASIC inference" class="figure-svg">
  <defs>
    <linearGradient id="asicA" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#635bff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#00d4ff" stop-opacity="0.14"/>
    </linearGradient>
  </defs>
  <rect x="16" y="18" width="688" height="174" rx="16" fill="white" stroke="#e6ebf1"/>

  <text x="42" y="52" font-size="12" fill="#0a2540" font-weight="800">AI infrastructure</text>
  <text x="42" y="74" font-size="11" fill="#6b7c93">General compute → purpose-built inference</text>

  <rect x="42" y="94" width="290" height="44" rx="14" fill="rgba(10,37,64,0.05)" stroke="#e6ebf1"/>
  <text x="62" y="121" font-size="12" fill="#0a2540" font-weight="800">GPUs</text>
  <text x="62" y="139" font-size="11" fill="#6b7c93">flexible, high cost</text>

  <rect x="388" y="86" width="290" height="60" rx="16" fill="url(#asicA)" stroke="rgba(99,91,255,0.28)"/>
  <text x="410" y="114" font-size="12" fill="#0a2540" font-weight="900">ASICs</text>
  <text x="410" y="138" font-size="11" fill="#6b7c93">domain-optimized inference</text>
  <text x="410" y="156" font-size="11" fill="#6b7c93">tighter memory coupling</text>

  <path d="M338 118 C 354 118, 370 118, 386 118" fill="none" stroke="#635bff" stroke-width="4" stroke-linecap="round"/>
  <path d="M380 110 L 392 118 L 380 126" fill="none" stroke="#635bff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="338" cy="118" r="4" fill="#00d4ff" opacity="0.95">
    <animate attributeName="cx" from="338" to="386" dur="1.4s" repeatCount="indefinite"/>
  </circle>

  <text x="42" y="174" font-size="11" fill="#6b7c93">Key driver: joules per token + repeatable inference workloads</text>
</svg>`,
    caption: "From 2026, inference economics favor custom silicon: predictable workloads, lower energy per token, and tighter memory integration.",
  }),
  "Section III — Memory Becomes the True Bottleneck": makeFigure({
    title: "Memory becomes the bottleneck",
    svg: `<svg viewBox="0 0 720 210" width="100%" height="auto" role="img" aria-label="Chart showing compute scaling faster than memory bandwidth" class="figure-svg">
  <defs>
    <linearGradient id="memA" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00d4ff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#635bff" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <rect x="16" y="18" width="688" height="174" rx="16" fill="white" stroke="#e6ebf1"/>
  <line x1="74" y1="160" x2="670" y2="160" stroke="#e6ebf1"/>
  <line x1="74" y1="44" x2="74" y2="160" stroke="#e6ebf1"/>
  <text x="78" y="32" font-size="11" fill="#6b7c93" font-weight="800">Throughput</text>
  <text x="610" y="178" font-size="11" fill="#6b7c93" font-weight="800">Time →</text>

  <path d="M90 150 C 220 120, 360 92, 520 70 C 590 60, 640 54, 660 52" fill="none" stroke="rgba(99,91,255,0.75)" stroke-width="4" stroke-linecap="round"/>
  <text x="520" y="62" font-size="11" fill="#0a2540" font-weight="800">Compute</text>

  <path d="M90 150 C 220 142, 360 132, 520 122 C 590 118, 640 116, 660 114" fill="none" stroke="rgba(0,212,255,0.85)" stroke-width="4" stroke-linecap="round"/>
  <text x="540" y="114" font-size="11" fill="#0a2540" font-weight="800">Memory (HBM)</text>

  <rect x="120" y="78" width="220" height="56" rx="14" fill="url(#memA)" stroke="rgba(0,212,255,0.25)"/>
  <text x="140" y="106" font-size="12" fill="#0a2540" font-weight="900">System constraint</text>
  <text x="140" y="124" font-size="11" fill="#6b7c93">latency + supply + bandwidth</text>

  <path d="M350 106 C 380 106, 400 106, 430 106" fill="none" stroke="#e6ebf1" stroke-width="6" stroke-linecap="round"/>
  <circle cx="350" cy="106" r="4" fill="#00d4ff" opacity="0.95">
    <animate attributeName="cx" from="350" to="430" dur="1.2s" repeatCount="indefinite"/>
  </circle>
</svg>`,
    caption: "Compute can scale, but memory bandwidth and capacity dictate real throughput. After 2026, systems become memory-first designs.",
  }),
  "Section IV — EUV and the Physical Limits of Scaling": makeFigure({
    title: "EUV as a gatekeeper",
    svg: `<svg viewBox="0 0 720 210" width="100%" height="auto" role="img" aria-label="Diagram showing EUV as the gatekeeper for advanced nodes" class="figure-svg">
  <defs>
    <linearGradient id="euvA" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b87333" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#635bff" stop-opacity="0.16"/>
    </linearGradient>
  </defs>
  <rect x="16" y="18" width="688" height="174" rx="16" fill="white" stroke="#e6ebf1"/>

  <text x="42" y="52" font-size="12" fill="#0a2540" font-weight="900">Advanced nodes</text>
  <text x="42" y="74" font-size="11" fill="#6b7c93">Access is constrained by EUV capacity + capital discipline</text>

  <rect x="42" y="98" width="210" height="62" rx="14" fill="rgba(10,37,64,0.04)" stroke="#e6ebf1"/>
  <text x="62" y="130" font-size="12" fill="#0a2540" font-weight="800">Demand</text>
  <text x="62" y="148" font-size="11" fill="#6b7c93">AI + advanced packaging</text>

  <path d="M270 92 C 310 92, 340 92, 382 92 L420 130 L382 168 C 340 168, 310 168, 270 168 Z"
        fill="url(#euvA)" stroke="rgba(184,115,51,0.35)"/>
  <text x="300" y="128" font-size="12" fill="#0a2540" font-weight="900">EUV</text>
  <text x="300" y="146" font-size="11" fill="#6b7c93">no substitute</text>

  <rect x="468" y="98" width="236" height="62" rx="14" fill="rgba(0,212,255,0.10)" stroke="rgba(0,212,255,0.25)"/>
  <text x="488" y="130" font-size="12" fill="#0a2540" font-weight="800">Supply</text>
  <text x="488" y="148" font-size="11" fill="#6b7c93">yield + capital + allocation</text>

  <path d="M252 129 L270 129" stroke="#e6ebf1" stroke-width="6" stroke-linecap="round"/>
  <path d="M420 129 L468 129" stroke="#e6ebf1" stroke-width="6" stroke-linecap="round"/>
  <circle cx="252" cy="129" r="4" fill="#635bff" opacity="0.9">
    <animate attributeName="cx" from="252" to="468" dur="1.6s" repeatCount="indefinite"/>
  </circle>
</svg>`,
    caption: "EUV isn’t just manufacturing—it's the strategic choke point that decides who can compete at sub-3nm nodes.",
  }),
  "Section VI — Neuromorphic Computing: A New Paradigm Emerges": makeFigure({
    title: "Neuromorphic: event-driven compute",
    svg: `<svg viewBox="0 0 720 210" width="100%" height="auto" role="img" aria-label="Event-driven spikes versus clock-driven continuous compute" class="figure-svg">
  <rect x="16" y="18" width="688" height="174" rx="16" fill="white" stroke="#e6ebf1"/>
  <text x="42" y="52" font-size="12" fill="#0a2540" font-weight="900">Paradigm shift</text>
  <text x="42" y="74" font-size="11" fill="#6b7c93">Clock-driven → event-driven (sparse, efficient)</text>

  <rect x="42" y="92" width="300" height="90" rx="14" fill="rgba(10,37,64,0.03)" stroke="#e6ebf1"/>
  <text x="62" y="116" font-size="12" fill="#0a2540" font-weight="900">Traditional</text>
  <text x="62" y="136" font-size="11" fill="#6b7c93">continuous clock</text>
  <path d="M62 162 H320" stroke="rgba(99,91,255,0.45)" stroke-width="6" stroke-linecap="round"/>

  <rect x="378" y="92" width="300" height="90" rx="14" fill="rgba(0,212,255,0.08)" stroke="rgba(0,212,255,0.25)"/>
  <text x="398" y="116" font-size="12" fill="#0a2540" font-weight="900">Neuromorphic</text>
  <text x="398" y="136" font-size="11" fill="#6b7c93">spikes only when needed</text>
  <g opacity="0.9">
    <line x1="398" y1="162" x2="654" y2="162" stroke="#e6ebf1" stroke-width="6" stroke-linecap="round"/>
    <path d="M430 162 L430 132" stroke="#00d4ff" stroke-width="4" stroke-linecap="round"/>
    <path d="M472 162 L472 142" stroke="#635bff" stroke-width="4" stroke-linecap="round"/>
    <path d="M520 162 L520 126" stroke="#00d4ff" stroke-width="4" stroke-linecap="round"/>
    <path d="M588 162 L588 146" stroke="#635bff" stroke-width="4" stroke-linecap="round"/>
    <circle cx="520" cy="126" r="4" fill="#00d4ff">
      <animate attributeName="r" values="4;7;4" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.8;0.25;0.8" dur="1.6s" repeatCount="indefinite"/>
    </circle>
  </g>
</svg>`,
    caption: "Event-driven architectures trade continuous compute for spikes—useful for always-on, ultra-low-power edge inference.",
  }),
  "Section VII — The 2026–2028 Timeline": makeFigure({
    title: "2026 → 2028 timeline",
    svg: `<svg viewBox="0 0 720 230" width="100%" height="auto" role="img" aria-label="Timeline from 2026 to 2028 with key milestones" class="figure-svg">
  <rect x="16" y="18" width="688" height="194" rx="16" fill="white" stroke="#e6ebf1"/>
  <text x="42" y="52" font-size="12" fill="#0a2540" font-weight="900">Milestones</text>
  <text x="42" y="74" font-size="11" fill="#6b7c93">From inference dominance to hybrid architectures</text>

  <line x1="64" y1="122" x2="656" y2="122" stroke="#e6ebf1" stroke-width="6" stroke-linecap="round"/>

  <circle cx="160" cy="122" r="10" fill="rgba(99,91,255,0.18)" stroke="rgba(99,91,255,0.35)"/>
  <text x="130" y="110" font-size="12" fill="#0a2540" font-weight="900">2026</text>
  <text x="92" y="148" font-size="10" fill="#6b7c93">ASIC inference</text>
  <text x="92" y="164" font-size="10" fill="#6b7c93">HBM shortage</text>

  <circle cx="360" cy="122" r="10" fill="rgba(0,212,255,0.18)" stroke="rgba(0,212,255,0.35)"/>
  <text x="330" y="110" font-size="12" fill="#0a2540" font-weight="900">2027</text>
  <text x="292" y="148" font-size="10" fill="#6b7c93">co-design</text>
  <text x="292" y="164" font-size="10" fill="#6b7c93">3D packaging</text>

  <circle cx="560" cy="122" r="10" fill="rgba(184,115,51,0.16)" stroke="rgba(184,115,51,0.35)"/>
  <text x="530" y="110" font-size="12" fill="#0a2540" font-weight="900">2028</text>
  <text x="492" y="148" font-size="10" fill="#6b7c93">hybrid compute</text>
  <text x="492" y="164" font-size="10" fill="#6b7c93">neuromorphic edge</text>

  <circle r="5" fill="#00d4ff" opacity="0.85">
    <animateMotion dur="2.0s" repeatCount="indefinite" path="M160 122 L360 122 L560 122"/>
  </circle>
</svg>`,
    caption: "A practical cadence: 2026 inference economics, 2027 co-design + packaging, 2028 hybrid architectures and new compute paradigms.",
  }),
};

function mdToHtml(md, opts = {}) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];

  let i = 0;
  let inCode = false;
  let codeLang = "";
  let codeBuf = [];
  let listType = null; // "ul" | "ol"
  let listBuf = [];
  let skippedFirstH1 = false;
  let skippedLeadH2 = false;
  let skipNextDivider = false;

  const flushList = () => {
    if (!listType) return;
    const tag = listType;
    out.push(`<${tag} class="md-list">${listBuf.map((li) => `<li>${li}</li>`).join("")}</${tag}>`);
    listType = null;
    listBuf = [];
  };

  const flushCode = () => {
    if (!inCode) return;
    const cls = codeLang ? ` class="language-${escHtml(codeLang)}"` : "";
    out.push(`<pre class="code-block"><code${cls}>${escHtml(codeBuf.join("\n"))}</code></pre>`);
    inCode = false;
    codeLang = "";
    codeBuf = [];
  };

  const flushParagraph = (buf) => {
    if (!buf.length) return;
    out.push(`<p>${mdInline(buf.join(" ").trim())}</p>`);
    buf.length = 0;
  };

  const pBuf = [];

  while (i < lines.length) {
    const line = lines[i];

    if (inCode) {
      if (line.startsWith("```")) {
        flushCode();
        i += 1;
        continue;
      }
      codeBuf.push(line);
      i += 1;
      continue;
    }

    // code start
    if (line.startsWith("```")) {
      flushParagraph(pBuf);
      flushList();
      inCode = true;
      codeLang = line.slice(3).trim();
      i += 1;
      continue;
    }

    // horizontal rule
    if (line.trim() === "---") {
      flushParagraph(pBuf);
      flushList();
      if (skipNextDivider) {
        skipNextDivider = false;
        i += 1;
        continue;
      }
      out.push(`<div class="divider"></div>`);
      i += 1;
      continue;
    }

    // headings
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushParagraph(pBuf);
      flushList();
      const level = h[1].length;
      const text = h[2].trim();
      // Posts already render the title in the page header.
      // Strip the first H1 in the markdown body to avoid duplicated titles.
      if (opts.stripFirstH1 && level === 1 && !skippedFirstH1) {
        skippedFirstH1 = true;
        i += 1;
        continue;
      }
      // If the post already has a dek/excerpt in the header, strip the leading H2
      // (often used as a subtitle in the markdown) to match Stripe-style posts.
      if (opts.stripLeadH2 && level === 2 && !skippedLeadH2 && out.length === 0) {
        skippedLeadH2 = true;
        // If the very next markdown token is a divider ('---'), skip it too.
        skipNextDivider = true;
        i += 1;
        continue;
      }
      out.push(`<h${level}>${mdInline(text)}</h${level}>`);
      if (opts.injectInfographics && DAILY_INFOGRAPHICS[text]) {
        out.push(DAILY_INFOGRAPHICS[text]);
      }
      i += 1;
      continue;
    }

    // blockquote
    if (line.trim().startsWith(">")) {
      flushParagraph(pBuf);
      flushList();
      const quote = line.trim().replace(/^>\s?/, "");
      out.push(`<blockquote class="callout-quote">${mdInline(quote)}</blockquote>`);
      i += 1;
      continue;
    }

    // tables
    if (line.includes("|") && (lines[i + 1] || "").includes("|")) {
      const table = parseTable(lines, i);
      if (table) {
        flushParagraph(pBuf);
        flushList();
        out.push(table.html);
        i = table.nextIdx;
        continue;
      }
    }

    // lists
    const ul = line.match(/^\s*-\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      flushParagraph(pBuf);
      const nextType = ul ? "ul" : "ol";
      if (!listType) listType = nextType;
      if (listType !== nextType) flushList(), (listType = nextType);
      listBuf.push(mdInline((ul || ol)[1].trim()));
      i += 1;
      continue;
    } else {
      flushList();
    }

    // blank line => end paragraph
    if (!line.trim()) {
      flushParagraph(pBuf);
      i += 1;
      continue;
    }

    // normal text
    pBuf.push(line.trim());
    i += 1;
  }

  flushParagraph(pBuf);
  flushList();
  flushCode();

  return out.join("\n");
}

function formatDate(dateStr) {
  // keep simple; expects YYYY-MM-DD
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  return `${m[1]}.${m[2]}.${m[3]}`;
}

function formatDateLong(dateStr) {
  // Stripe-like: "October 15, 2024"
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return dateStr;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(dt);
}

const MEGA_MENU_COLUMNS = [
  {
    title: "Semiconductors",
    items: [
      ["NVDA", "Nvidia"],
      ["AVGO", "Broadcom"],
      ["MRVL", "Marvell"],
      ["TSM", "TSMC"],
      ["ASML", "ASML"],
      ["AMD", "AMD"],
      ["MU", "Micron"],
    ],
    allHref: "setup/#semiconductors",
  },
  {
    title: "Software",
    items: [
      ["PANW", "Palo Alto"],
      ["CRWD", "CrowdStrike"],
      ["NOW", "ServiceNow"],
      ["SNOW", "Snowflake"],
      ["DDOG", "Datadog"],
      ["MDB", "MongoDB"],
    ],
    allHref: "setup/#software",
  },
  {
    title: "Internet",
    items: [
      ["GOOG", "Alphabet"],
      ["META", "Meta"],
      ["AMZN", "Amazon"],
      ["NFLX", "Netflix"],
      ["UBER", "Uber"],
      ["SHOP", "Shopify"],
    ],
    allHref: "setup/#internet",
  },
  {
    title: "Infra / Hardware",
    items: [
      ["ANET", "Arista"],
      ["SMCI", "Super Micro"],
      ["VRT", "Vertiv"],
      ["DELL", "Dell"],
      ["EQIX", "Equinix"],
    ],
    allHref: "setup/#infra",
  },
];

function setupMegaMenuHtml() {
  const cols = MEGA_MENU_COLUMNS.map(
    (col) => `
    <div class="mega-col">
      <div class="mega-col-title">${escHtml(col.title)}</div>
      ${col.items.map(([ticker, name]) => `<a class="mega-item" href="setup/${slugify(ticker)}/" role="menuitem"><span class="mega-ticker">${escHtml(ticker)}</span>${escHtml(name)}</a>`).join("")}
      <a class="mega-all" href="${col.allHref}">All ${escHtml(col.title.toLowerCase().split(" ")[0])} ›</a>
    </div>`
  ).join("");
  return `
  <div class="mega-panel" role="menu" aria-hidden="true">
    <div class="mega-columns">${cols}</div>
  </div>`;
}

function layout({ title, description, pathPrefix = "", body, currentNav = "", pageId = "", baseHrefOverride = "" }) {
  // GitHub Pages project sites are hosted under "/<repo>/".
  // Use a <base> tag so we can keep all links simple & relative.
  const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split("/")[1] : "";
  const owner = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split("/")[0] : "";
  const derivedBase =
    repo && owner && repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? "" : repo ? `/${repo}` : "";
  const basePathRaw = process.env.BASE_PATH ?? derivedBase;
  const defaultBase =
    process.env.LOCAL_PREVIEW === "1" ? "./" : basePathRaw ? `${basePathRaw.replace(/\/+$/g, "")}/` : "/";
  const baseHref = baseHrefOverride || defaultBase;

  const navLinks = [
    { href: `daily/`, label: "Daily", id: "daily" },
    { href: `weekly/`, label: "Weekly", id: "weekly" },
    { href: `market/`, label: "Market", id: "market" },
    { href: `setup/`, label: "Setup", id: "setup", hasMega: true },
    { href: `trades/`, label: "Trades", id: "trades" },
    { href: `portfolio/`, label: "Portfolio", id: "portfolio" },
  ];

  const chevronSvg = `<svg class="nav-chevron" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const navHtml = navLinks
    .map((l) => {
      if (l.hasMega) {
        return `<div class="nav-link-wrap">
  <a class="nav-link ${currentNav === l.id ? "active" : ""}" href="${l.href}" aria-haspopup="true" aria-expanded="false" data-mega-trigger>${escHtml(l.label)}${chevronSvg}</a>
  ${setupMegaMenuHtml()}
</div>`;
      }
      return `<a class="nav-link ${currentNav === l.id ? "active" : ""}" href="${l.href}">${escHtml(l.label)}</a>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description || "")}" />
  <base href="${escHtml(baseHref)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/site.css?v=${BUILD_ID}" />
</head>
<body${pageId ? ` data-page="${escHtml(pageId)}"` : ""}>
  <div class="layout-shell">
    <div class="top-nav">
      <div class="page-container">
        <div class="nav-row">
          <a class="brand" href="./">
            <span class="logo-mark" aria-hidden="true"></span>
            <span class="brand-name">Briefly</span>
          </a>
          <nav class="nav-links" aria-label="Primary">
            ${navHtml}
          </nav>
          <div class="nav-cta">
            <a class="nav-cta-link" href="https://x.com/" target="_blank" rel="noopener noreferrer">Briefly on X <span aria-hidden="true">›</span></a>
            <a class="nav-cta-btn" href="./">Subscribe</a>
          </div>
        </div>
      </div>
    </div>
    <div class="mega-overlay" aria-hidden="true"></div>
    ${body}
  </div>
  <script src="assets/site.js?v=${BUILD_ID}"></script>
</body>
</html>`;
}

function cardsList(posts, pathPrefix = "", emptyLabel = "No posts yet.") {
  if (!posts.length) {
    return `<div class="data-card"><p class="muted">${escHtml(emptyLabel)}</p></div>`;
  }
  return `<div class="card-grid">
${posts
  .map((p) => {
    const href = `posts/${p.slug}/`;
    return `<article class="post-card">
  <a class="post-card-link" href="${href}">
    <div class="post-card-kicker">${escHtml(p.categoryLabel)}</div>
    <h3 class="post-card-title">${escHtml(p.title)}</h3>
    <div class="post-card-meta">${escHtml(formatDate(p.date))}</div>
    ${p.excerpt ? `<p class="post-card-excerpt">${escHtml(p.excerpt)}</p>` : ""}
  </a>
</article>`;
  })
  .join("\n")}
</div>`;
}

async function ensureEmptyDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function readPosts() {
  let entries = [];
  try {
    entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const posts = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".md")) continue;
    const full = path.join(CONTENT_DIR, e.name);
    const raw = await fs.readFile(full, "utf8");
    const { data, body } = parseFrontmatter(raw);
    if (data.draft === true) continue;

    const title = data.title || e.name.replace(/\.md$/, "");
    const date = data.date || "";
    const category = (data.category || "daily").toLowerCase();
    const lang = (data.lang || "en").toLowerCase();
    const excerpt = data.excerpt || "";
    const author = data.author || "Shaun On";
    const authorOrg = data.author_org || "Briefly";
    const slug = data.slug ? slugify(data.slug) : slugify(`${date}-${title}`);
    const companyRaw = data.company;
    const company = Array.isArray(companyRaw) ? companyRaw.map((c) => String(c || "").toUpperCase()) : companyRaw ? [String(companyRaw).toUpperCase()] : [];
    const noteType = data.note_type || "";

    const categoryMeta = CATEGORIES.find((c) => c.id === category);
    const injectInfographics =
      category === "daily" &&
      (data.infographics === "true" || data.infographics === true || slug.includes("technology-outlook"));

    posts.push({
      source: full,
      title,
      date,
      category,
      categoryLabel: categoryMeta?.title || category,
      lang,
      excerpt,
      author,
      authorOrg,
      slug,
      company,
      noteType,
      html: mdToHtml(body, { injectInfographics, stripFirstH1: true, stripLeadH2: !!excerpt }),
    });
  }

  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return posts;
}

async function readCompanies() {
  try {
    const raw = await fs.readFile(COMPANIES_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function companyFactCard(company) {
  const t = company.ticker || "";
  const n = company.name || "";
  const sector = company.sector || "";
  const price = company.price;
  const change = company.change;
  const marketCap = company.marketCap;
  const forwardPE = company.forwardPE;
  const revenueGrowth = company.revenueGrowth;
  const dividendYield = company.dividendYield;
  const ceo = company.ceo;
  const nextEarnings = company.nextEarnings;
  const summary = company.summary;
  const hiring = company.hiring;
  const analyst = company.analyst;

  let row2 = "";
  if (marketCap || forwardPE || revenueGrowth || dividendYield) {
    row2 = `
    <div class="fact-row fact-metrics">
      <div class="metric-item"><span class="metric-label">Market cap</span><span class="metric-value">${escHtml(marketCap || "—")}</span></div>
      <div class="metric-item"><span class="metric-label">Forward P/E</span><span class="metric-value">${escHtml(forwardPE || "—")}</span></div>
      <div class="metric-item"><span class="metric-label">Revenue growth</span><span class="metric-value">${escHtml(revenueGrowth || "—")}</span></div>
      <div class="metric-item"><span class="metric-label">Dividend yield</span><span class="metric-value">${escHtml(dividendYield || "—")}</span></div>
    </div>`;
  }

  let row3 = "";
  if (ceo || nextEarnings) {
    const ceoHtml = ceo ? `<div class="fact-ceo"><strong>CEO:</strong> ${escHtml(ceo.name)} (${escHtml(ceo.tenure)}) — ${escHtml(ceo.desc || "")}</div>` : "";
    const earnHtml = nextEarnings ? `<div class="fact-earnings"><strong>Next earnings:</strong> ${escHtml(nextEarnings.date)} (${escHtml(nextEarnings.quarter)})</div>` : "";
    row3 = `<div class="fact-row fact-leadership">${ceoHtml}${earnHtml}</div>`;
  }

  const row4 = summary ? `<div class="fact-row fact-summary"><p>${escHtml(summary)}</p></div>` : "";
  const row5 = hiring && hiring.length ? `<div class="fact-row fact-hiring">${hiring.map((h) => `<span class="fact-pill">${escHtml(h)}</span>`).join("")}</div>` : "";

  let row6 = "";
  if (analyst && analyst.target) {
    const low = parseFloat(analyst.low) || 0;
    const high = parseFloat(analyst.high) || 0;
    const current = price ? parseFloat(price) : (low + high) / 2;
    const pct = high > low ? ((current - low) / (high - low)) * 100 : 50;
    row6 = `
    <div class="fact-row fact-analyst">
      <div class="analyst-target"><span class="analyst-label">Avg. price target</span><span class="analyst-value">$${escHtml(analyst.target)}</span></div>
      <div class="analyst-bar"><div class="analyst-range" style="left:${pct}%"></div></div>
      <div class="analyst-badges"><span class="badge buy">Buy ${analyst.buy || 0}</span><span class="badge hold">Hold ${analyst.hold || 0}</span><span class="badge sell">Sell ${analyst.sell || 0}</span></div>
    </div>`;
  }

  return `
  <div class="fact-card">
    <div class="fact-row fact-header">
      <div class="fact-title-wrap">
        <h1 class="fact-company-name">${escHtml(n)}</h1>
        <span class="fact-badge fact-ticker">${escHtml(t)}</span>
        <span class="fact-badge fact-sector">${escHtml(sector)}</span>
      </div>
      ${price != null ? `<div class="fact-price-wrap"><span class="fact-price">$${escHtml(String(price))}</span><span class="fact-change ${(change || "").startsWith("+") ? "up" : "down"}">${escHtml(change || "")}</span></div>` : ""}
    </div>${row2}${row3}${row4}${row5}${row6}
  </div>`;
}

function companyPageTemplate(company, notes, pathPrefix = "") {
  const ticker = (company.ticker || "").toUpperCase();
  const slug = slugify(ticker);
  const factCard = companyFactCard(company);

  const notesHtml = notes.length
    ? `<div class="research-notes">
  <h2 class="section-title">Research Notes</h2>
  <div class="note-rows">
    ${notes
      .map(
        (p) =>
          `<a class="note-row" href="${pathPrefix}posts/${p.slug}/">
      <time class="note-date">${escHtml(formatDate(p.date))}</time>
      <span class="note-title">${escHtml(p.title)}</span>
      ${p.noteType ? `<span class="note-badge">${escHtml(p.noteType)}</span>` : ""}
    </a>`
      )
      .join("")}
  </div>
</div>`
    : `<div class="research-notes"><h2 class="section-title">Research Notes</h2><p class="muted">No notes yet for ${escHtml(company.name || ticker)}.</p></div>`;

  return `
<header class="hero hero-compact">
  <div class="page-container hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${pathPrefix}">Home</a><span class="crumb-sep">/</span>
      <a href="${pathPrefix}setup/">Setup</a>
    </nav>
    <h1 class="hero-title">${escHtml(company.name || ticker)} (${escHtml(ticker)})</h1>
  </div>
</header>
<main class="page-container py-12">
  <div class="company-page">
    ${factCard}
    ${notesHtml}
  </div>
</main>`;
}

async function writeFileEnsured(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/g)
    .filter(Boolean);
  if (!parts.length) return "B";
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  const out = (a + b).toUpperCase();
  return out || "B";
}

function stripeFeaturedCard(post) {
  if (!post) return "";
  return `
<div class="feature-wrap">
  <article class="feature-card">
    <div class="feature-copy">
      <div class="feature-kicker">${escHtml(post.categoryLabel)}</div>
      <h2 class="feature-title">${escHtml(post.title)}</h2>
      <div class="feature-author">
        <div class="avatar" aria-hidden="true">${escHtml(initials(post.author))}</div>
        <div class="author-meta">
          <div class="author-name">${escHtml(post.author)}</div>
          <div class="author-org">${escHtml(post.authorOrg)}</div>
        </div>
      </div>
      ${post.excerpt ? `<p class="feature-excerpt">${escHtml(post.excerpt)}</p>` : ""}
      <a class="read-more" href="posts/${post.slug}/">Read more <span aria-hidden="true">›</span></a>
    </div>
    <div class="feature-visual" aria-hidden="true">
      ${renderAutoArt(post, { kind: "featured" })}
    </div>
  </article>
</div>`;
}

function arrowIconSvg() {
  // Minimal right arrow icon (stroke inherits from currentColor)
  return `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
  <path d="M3 8h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M9 4.5L12.5 8 9 11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function stripeHomeFeaturedCard(post) {
  if (!post) return "";
  return `
<div class="feature-wrap">
  <article class="feature-card home-hero-card">
    <div class="hero-category">${escHtml(post.categoryLabel)}</div>
    <h2 class="hero-title BlogIndexPost__title CopyTitle">
      <a class="Link" href="posts/${post.slug}/">${escHtml(post.title)}</a>
    </h2>
    <div class="hero-authors" aria-label="Authors">
      <div class="hero-author">
        <div class="hero-avatar" aria-hidden="true">${escHtml(initials(post.author))}</div>
        <div class="hero-author-meta">
          <div class="hero-author-name">${escHtml(post.author)}</div>
          <div class="hero-author-role">${escHtml(post.authorOrg)}</div>
        </div>
      </div>
    </div>
    ${post.excerpt ? `<p class="hero-body">${escHtml(post.excerpt)}</p>` : ""}
    <a class="hero-cta" href="posts/${post.slug}/">Read more ${arrowIconSvg()}</a>
    <div class="hero-image" aria-hidden="true">
      ${renderAutoArt(post, { kind: "featured" })}
    </div>
  </article>
</div>`;
}

function hashToInt(s) {
  // stable, cheap hash for UI variants
  let h = 2166136261;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

function renderAutoArt(post, { kind = "row" } = {}) {
  const seed = hashToInt(`${post.slug}|${post.date}|${post.category}`);
  const palettes = [
    { a: "#635bff", b: "#00d4ff", c: "#ff9f43", d: "#ffa07a", e: "#ffcf5c" }, // stripe purple-cyan-orange
    { a: "#7a5cff", b: "#3ae8ff", c: "#ff6b9d", d: "#ffd93d", e: "#80ffdb" }, // vibrant multi
    { a: "#5b7cfa", b: "#00d4ff", c: "#ff6b6b", d: "#ffb347", e: "#c471f5" }, // blue-coral-purple
    { a: "#635bff", b: "#80ffdb", c: "#ffcf5c", d: "#ff9f43", e: "#ff6b9d" }, // mint-yellow-pink
  ];
  const p = palettes[seed % palettes.length];
  const y = String(post.date || "").slice(0, 4) || "2026";
  const title = kind === "featured" ? post.categoryLabel : post.categoryLabel;
  const sub = kind === "featured" ? "Year in review" : formatDate(post.date);
  
  const className = kind === "featured" ? "auto-art auto-art-featured" : kind === "list" ? "auto-art auto-art-list" : "auto-art auto-art-row";
  const size = kind === "featured" ? { w: 560, h: 420 } : kind === "list" ? { w: 520, h: 340 } : { w: 520, h: 300 };
  
  // Stripe Atlas style: Large overlapping typography
  const isFeatured = kind === "featured";
  const mainFontSize = isFeatured ? 180 : 120;
  const secondaryFontSize = isFeatured ? 140 : 90;
  const accentFontSize = isFeatured ? 80 : 55;
  
  // Position calculations for overlapping numbers
  const pos1 = { x: isFeatured ? 60 : 40, y: isFeatured ? 200 : 140 };
  const pos2 = { x: isFeatured ? 200 : 140, y: isFeatured ? 200 : 140 };
  const pos3 = { x: isFeatured ? 300 : 220, y: isFeatured ? 280 : 190 };
  const pos4 = { x: isFeatured ? 140 : 100, y: isFeatured ? 320 : 220 };
  
  return `<div class="${className}">
  <svg viewBox="0 0 ${size.w} ${size.h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escHtml(title)} - ${escHtml(sub)}">
    <defs>
      <!-- Multi-stop gradient for rich background -->
      <linearGradient id="bgGrad${seed}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${p.a}" stop-opacity="0.12"/>
        <stop offset="35%" stop-color="${p.b}" stop-opacity="0.08"/>
        <stop offset="65%" stop-color="${p.c}" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="${p.d}" stop-opacity="0.08"/>
      </linearGradient>
      
      <!-- Radial gradient for focal glow -->
      <radialGradient id="radialGlow${seed}" cx="0.7" cy="0.3">
        <stop offset="0%" stop-color="${p.b}" stop-opacity="0.20"/>
        <stop offset="50%" stop-color="${p.a}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="${p.c}" stop-opacity="0.05"/>
      </radialGradient>
      
      <!-- Stripe pattern for texture -->
      <pattern id="stripePattern${seed}" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="${p.a}" stroke-width="1" opacity="0.08"/>
      </pattern>
      
      <!-- Dot pattern for overlay -->
      <pattern id="dotPattern${seed}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="${p.b}" opacity="0.12"/>
        <circle cx="12" cy="12" r="1.5" fill="${p.c}" opacity="0.10"/>
      </pattern>
      
      <clipPath id="clip${seed}">
        <rect x="0" y="0" width="${size.w}" height="${size.h}" rx="0"/>
      </clipPath>
    </defs>
    
    <!-- Background layers -->
    <rect width="${size.w}" height="${size.h}" fill="white"/>
    <rect width="${size.w}" height="${size.h}" fill="url(#bgGrad${seed})"/>
    <rect width="${size.w}" height="${size.h}" fill="url(#radialGlow${seed})"/>
    
    <!-- Decorative gradient blobs (Stripe Atlas style) -->
    <ellipse cx="${size.w * 0.75}" cy="${size.h * 0.25}" rx="${size.w * 0.35}" ry="${size.h * 0.30}" 
             fill="${p.b}" opacity="0.12" transform="rotate(-15 ${size.w * 0.75} ${size.h * 0.25})"/>
    <ellipse cx="${size.w * 0.25}" cy="${size.h * 0.70}" rx="${size.w * 0.30}" ry="${size.h * 0.25}" 
             fill="${p.c}" opacity="0.10" transform="rotate(20 ${size.w * 0.25} ${size.h * 0.70})"/>
    <ellipse cx="${size.w * 0.85}" cy="${size.h * 0.80}" rx="${size.w * 0.20}" ry="${size.h * 0.20}" 
             fill="${p.d}" opacity="0.08"/>
    
    <!-- Pattern overlays -->
    <rect width="${size.w}" height="${size.h}" fill="url(#stripePattern${seed})" opacity="0.4"/>
    
    <!-- Top label -->
    <text x="32" y="${isFeatured ? 44 : 36}" font-size="${isFeatured ? 15 : 13}" font-weight="800" 
          fill="${p.a}" font-family="Inter, system-ui" letter-spacing="0.05em">${escHtml(title).toUpperCase()}</text>
    
    <!-- Large overlapping typography (Stripe Atlas style) -->
    <g opacity="1">
      <!-- First large number -->
      <text x="${pos1.x}" y="${pos1.y}" 
            font-size="${mainFontSize}" font-weight="900" letter-spacing="-0.06em"
            fill="${p.a}" opacity="0.35" font-family="Inter, system-ui">${y.slice(0, 2)}</text>
      <rect x="${pos1.x}" y="${pos1.y - mainFontSize * 0.8}" width="${mainFontSize * 0.7}" height="${mainFontSize * 0.15}" 
            fill="url(#stripePattern${seed})" opacity="0.6"/>
      
      <!-- Second large number (overlapping) -->
      <text x="${pos2.x}" y="${pos2.y}" 
            font-size="${secondaryFontSize}" font-weight="900" letter-spacing="-0.06em"
            fill="${p.c}" opacity="0.40" font-family="Inter, system-ui">${y.slice(2)}</text>
      <rect x="${pos2.x + 10}" y="${pos2.y - secondaryFontSize * 0.6}" width="${secondaryFontSize * 0.5}" height="${secondaryFontSize * 0.12}" 
            fill="url(#dotPattern${seed})" opacity="0.8"/>
      
      <!-- Third accent number -->
      <text x="${pos3.x}" y="${pos3.y}" 
            font-size="${accentFontSize}" font-weight="900" letter-spacing="-0.05em"
            fill="${p.b}" opacity="0.45" font-family="Inter, system-ui">${y.slice(2)}</text>
      
      <!-- Fourth small accent -->
      <text x="${pos4.x}" y="${pos4.y}" 
            font-size="${accentFontSize * 0.7}" font-weight="800" letter-spacing="-0.04em"
            fill="${p.d}" opacity="0.35" font-family="Inter, system-ui">${y}</text>
    </g>
    
    <!-- Decorative elements -->
    <g opacity="0.9">
      ${isFeatured ? `
      <!-- Floating accent boxes -->
      <rect x="${size.w * 0.65}" y="${size.h * 0.55}" width="80" height="6" rx="3" fill="${p.a}" opacity="0.25"/>
      <rect x="${size.w * 0.12}" y="${size.h * 0.35}" width="60" height="6" rx="3" fill="${p.b}" opacity="0.25"/>
      <circle cx="${size.w * 0.80}" cy="${size.h * 0.70}" r="4" fill="${p.c}" opacity="0.35"/>
      <circle cx="${size.w * 0.20}" cy="${size.h * 0.60}" r="6" fill="${p.d}" opacity="0.30"/>
      ` : ''}
    </g>
    
    <!-- Bottom subtitle -->
    <text x="32" y="${size.h - 32}" font-size="${isFeatured ? 20 : 16}" font-weight="800" 
          fill="${p.a}" opacity="0.85" font-family="Inter, system-ui">${escHtml(sub)}</text>
    
    <!-- Briefly badge (top right) -->
    <g transform="translate(${size.w - 80}, ${isFeatured ? 32 : 28})">
      <rect x="0" y="0" width="56" height="22" rx="11" fill="${p.a}" opacity="0.15"/>
      <text x="28" y="15.5" font-size="10" font-weight="800" fill="${p.a}" 
            text-anchor="middle" font-family="Inter, system-ui" letter-spacing="0.03em">briefly</text>
    </g>
  </svg>
</div>`;
}

function indexTabs(active = "all") {
  const tabs = [
    { id: "all", label: "All" },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "market", label: "Market" },
    { id: "setup", label: "Setup" },
    { id: "trades", label: "Trades" },
  ];
  return `<div class="tab-bar" role="tablist" aria-label="Categories">
    ${tabs
      .map(
        (t) =>
          `<button class="tab ${active === t.id ? "active" : ""}" role="tab" aria-selected="${active === t.id}" data-filter="${t.id}" type="button">${escHtml(t.label)}</button>`
      )
      .join("")}
  </div>`;
}

function stripeListRow(post) {
  return `<article class="list-row" data-category="${escHtml(post.category)}">
  <div class="list-post">
    <div class="list-post-category">${escHtml(post.categoryLabel)}</div>
    <div class="list-post-dateWrap">
      <time class="list-post-date">${escHtml(formatDateLong(post.date))}</time>
    </div>
    <h2 class="list-post-title">
      <a class="list-post-titleLink" href="posts/${post.slug}/">${escHtml(post.title)}</a>
    </h2>

    <div class="list-post-authorList">
      <div class="list-post-authors BlogAuthor" aria-label="Authors">
        <div class="list-post-author">
          <div class="list-post-avatar" aria-hidden="true">${escHtml(initials(post.author))}</div>
          <div class="list-post-authorInfo">
            <div class="list-post-authorName">${escHtml(post.author)}</div>
            <div class="list-post-authorRole">${escHtml(post.authorOrg)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="list-post-bodyWrap">
      ${post.excerpt ? `<p class="list-post-body">${escHtml(post.excerpt)}</p>` : ""}
      <a class="list-post-readMore" href="posts/${post.slug}/">Read more ${arrowIconSvg()}</a>
    </div>

    <div class="list-post-image" aria-hidden="true">
      ${renderAutoArt(post, { kind: "list" })}
    </div>
  </div>
</article>`;
}

function stripeListRows(posts) {
  if (!posts.length) return '<div class="data-card"><p class="muted">No posts yet.</p></div>';
  return `<div class="list-rows">
${posts.map(p => stripeListRow(p)).join("\n")}
  </div>`;
}

function indexRows(posts, { limit = 8 } = {}) {
  const items = posts.slice(0, limit);
  return `<div class="index-rows">
${items
  .map((p) => {
    return `<article class="index-row">
  <a class="index-row-link" href="posts/${p.slug}/">
    <div class="index-row-copy">
      <div class="index-row-kicker">${escHtml(p.categoryLabel)}</div>
      <h3 class="index-row-title">${escHtml(p.title)}</h3>
      <div class="index-row-meta">
        <span class="index-row-date">${escHtml(formatDate(p.date))}</span>
        <span class="index-row-dot" aria-hidden="true">·</span>
        <span class="index-row-author">${escHtml(p.author)}</span>
      </div>
      ${p.excerpt ? `<p class="index-row-excerpt">${escHtml(p.excerpt)}</p>` : ""}
      <div class="index-row-cta">Read more <span aria-hidden="true">›</span></div>
    </div>
    <div class="index-row-visual" aria-hidden="true">
      ${renderAutoArt(p, { kind: "row" })}
    </div>
  </a>
</article>`;
  })
  .join("\n")}
</div>`;
}

async function build() {
  const posts = await readPosts();
  await ensureEmptyDir(DIST_DIR);
  await fs.mkdir(POSTS_OUT_DIR, { recursive: true });

  // Copy assets if present
  const assetsSrc = path.join(ROOT, "assets");
  try {
    await fs.access(assetsSrc);
    await copyDir(assetsSrc, path.join(DIST_DIR, "assets"));
  } catch {
    // ok
  }

  // Home
  const latestDaily = posts.find((p) => p.category === "daily") || null;
  const latest = posts.slice(0, 20);
  const rowsRaw = latestDaily ? latest.filter((p) => p.slug !== latestDaily.slug) : latest;
  const rows = rowsRaw.length ? rowsRaw : latestDaily ? [latestDaily] : [];
  const homeBody = `
<div class="home-fold">
  <header class="blog-hero">
    <div class="page-container blog-hero-inner">
      <div class="blog-rail">
        <div class="blog-label">Blog</div>
        <a class="blog-rail-link" href="https://x.com/" target="_blank" rel="noopener noreferrer">Briefly on X <span aria-hidden="true">›</span></a>
      </div>
    </div>
  </header>

  <div class="home-fold-feature">
    <div class="page-container">
      <section class="blog-feature">
        ${stripeHomeFeaturedCard(latestDaily)}
      </section>
    </div>
  </div>

  <div class="home-fold-tabs">
    <div class="page-container">
      <section class="blog-tabs-section">
        ${indexTabs("all")}
      </section>
    </div>
  </div>
</div>

<main class="page-container blog-index">
  <section class="blog-list">
    ${stripeListRows(rows)}
  </section>

  <section class="blog-longform">
    <div class="section-head">
      <h2 class="section-title">Longform</h2>
      <div class="section-sub">Foundational memos and deeper reads</div>
    </div>
    <div class="card-grid">
      <article class="post-card">
        <a class="post-card-link" href="legacy/mandate.html">
          <div class="post-card-kicker">Longform</div>
          <h3 class="post-card-title">The 2026 Strategic Mandate</h3>
          <div class="post-card-meta">Legacy page</div>
          <p class="post-card-excerpt">Embodied intelligence &amp; the thermodynamic economy (full report).</p>
        </a>
      </article>
    </div>
  </section>
</main>`;
  await writeFileEnsured(
    path.join(DIST_DIR, "index.html"),
    layout({
      title: "Briefly",
      description: "Daily Briefly — Stripe-style reading.",
      body: homeBody,
      currentNav: "",
      pageId: "home",
    })
  );

  // Category pages
  for (const cat of CATEGORIES) {
    const catPosts = posts.filter((p) => p.category === cat.id);
    const featured = cat.id === "daily" ? catPosts[0] : null;
    const rest = cat.id === "daily" ? catPosts.slice(1) : catPosts;
    const body = `
<header class="hero hero-compact">
  <div class="page-container hero-inner">
    <div class="eyebrow">Category</div>
    <h1 class="hero-title">${escHtml(cat.title)}</h1>
    <p class="hero-sub">${escHtml(cat.desc)}</p>
  </div>
</header>
<main class="page-container py-12">
  ${cat.id === "daily" ? stripeFeaturedCard(featured) : ""}
  ${cat.id === "daily" ? `<div class="my-12 divider"></div>` : ""}
  ${cardsList(rest, "", "No posts yet.")}
</main>`;
    await writeFileEnsured(
      path.join(DIST_DIR, cat.id, "index.html"),
      layout({
        title: `${cat.title} · Briefly`,
        description: cat.desc,
        body,
        currentNav: cat.id,
        pageId: "category",
        baseHrefOverride: process.env.LOCAL_PREVIEW === "1" ? "../" : "",
      })
    );
  }

  // Company pages (Setup > individual company)
  const companies = await readCompanies();
  const basePathRaw = process.env.BASE_PATH ?? "";
  const pathPrefixCompany = process.env.LOCAL_PREVIEW === "1" ? "../../" : basePathRaw ? `${basePathRaw.replace(/\/+$/g, "")}/` : "/";

  for (const [ticker, company] of Object.entries(companies)) {
    const slug = slugify(ticker);
    const companyNotes = posts.filter((p) => p.company.includes(ticker)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const body = companyPageTemplate({ ticker, ...company }, companyNotes, pathPrefixCompany);
    await writeFileEnsured(
      path.join(DIST_DIR, "setup", slug, "index.html"),
      layout({
        title: `${company.name || ticker} · Briefly`,
        description: company.summary || `Research notes on ${company.name || ticker}.`,
        body,
        currentNav: "setup",
        pageId: "company",
        baseHrefOverride: process.env.LOCAL_PREVIEW === "1" ? "../../" : "",
      })
    );
  }

  // Portfolio page (one level deep: dist/portfolio/)
  const portfolioBaseOverride = process.env.LOCAL_PREVIEW === "1" ? "../" : "";
  const portfolioBody = `
<header class="hero hero-compact">
  <div class="page-container hero-inner">
    <h1 class="hero-title">Portfolio</h1>
    <p class="hero-sub">Current positions and holdings disclosure.</p>
  </div>
</header>
<main class="page-container py-12">
  <div class="data-card"><p class="muted">Portfolio disclosure coming soon.</p></div>
</main>`;
  await writeFileEnsured(
    path.join(DIST_DIR, "portfolio", "index.html"),
    layout({
      title: "Portfolio · Briefly",
      description: "Current positions / holdings disclosure.",
      body: portfolioBody,
      currentNav: "portfolio",
      pageId: "portfolio",
      baseHrefOverride: portfolioBaseOverride,
    })
  );

  // Post detail pages
  for (const post of posts) {
    const related = posts.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 6);
    const categoryMeta = CATEGORIES.find((c) => c.id === post.category);
    const crumb = `
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="./">Home</a><span class="crumb-sep">/</span>
  <a href="${post.category}/">${escHtml(categoryMeta?.title || post.category)}</a>
</nav>`;

    const page = `
<header class="post-hero">
  <div class="page-container">
    ${crumb}
    <div class="post-grid">
      <h1 class="post-title BlogPost__title">${escHtml(post.title)}</h1>
      <div class="post-dateWrap" aria-label="Publish date">
        <time class="post-date" datetime="${escHtml(post.date)}">${escHtml(formatDateLong(post.date))}</time>
      </div>
      ${post.excerpt ? `<p class="post-dek BlogPost__dek">${escHtml(post.excerpt)}</p>` : ""}
    </div>
  </div>
</header>

<main class="page-container py-12">
  <div class="article-grid">
    <aside class="toc toc-desktop">
      <div class="toc-title">On this page</div>
      <nav id="toc"></nav>
      <div class="divider"></div>
    </aside>

    <div class="article-body">
      <details class="toc-mobile data-card">
        <summary>On this page</summary>
        <div class="mt-4" id="toc-mobile"></div>
      </details>

      <article class="md-article" data-post>
        ${post.html}
      </article>

      <div class="my-12 divider"></div>
      <section>
        <h2 class="section-title">Related</h2>
        ${cardsList(related, "", "No related posts yet.")}
      </section>
    </div>
  </div>
</main>`;

    await writeFileEnsured(
      path.join(POSTS_OUT_DIR, post.slug, "index.html"),
      layout({
        title: `${post.title} · Briefly`,
        description: post.excerpt || "",
        body: page,
        currentNav: post.category,
        pageId: "post",
        baseHrefOverride: process.env.LOCAL_PREVIEW === "1" ? "../../" : "",
      })
    );
  }

  // Preserve existing legacy longform pages (optional)
  // Keep them under dist/legacy/ so they don't override generated routes.
  await fs.mkdir(path.join(DIST_DIR, "legacy"), { recursive: true });
  for (const f of ["mandate.html", "index.html"]) {
    try {
      const src = path.join(ROOT, f);
      const dst = path.join(DIST_DIR, "legacy", f);
      // Legacy pages may reference assets/ as if they were at site root.
      // When served from /legacy/* this breaks (it becomes /legacy/assets/*).
      // Rewrite to ../assets/* so they load consistently.
      const raw = await fs.readFile(src, "utf8");
      const patched = raw
        .replaceAll('href="assets/', 'href="../assets/')
        .replaceAll("href='assets/", "href='../assets/")
        .replaceAll('src="assets/', 'src="../assets/')
        .replaceAll("src='assets/", "src='../assets/");
      await fs.writeFile(dst, patched, "utf8");
    } catch {
      // ok
    }
  }
}

await build();
console.log("Built static site into dist/");


