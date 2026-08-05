#!/usr/bin/env node
/* ============================================================
   Sarkari Hai — static site generator
   Builds: index (latest table) + category pages + per-post
           pages + exam pages + sitemap + search index
   Run: node build.js  →  outputs to ./public/
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "posts.json"), "utf8"));
const SITE = data.site.name;
const DOMAIN = data.site.domain;
const BUILT = new Date().toISOString().slice(0, 10);
const BUILT_PRETTY = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

/* copy static assets */
const outDir = path.join(__dirname, "public");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const asset of ["style.css", "search.js"]) {
  const src = path.join(__dirname, asset);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, asset));
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const byCat = Object.fromEntries(data.categories.map((c) => [c.slug, c]));
const byExam = Object.fromEntries(data.exams.map((e) => [e.slug, e]));
const byId = Object.fromEntries(data.posts.map((p) => [p.id, p]));

/* ---------- shared layout ---------- */
function pageShell({ title, metaDesc, canonical, body, schema }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400..700,0..1,-50..200&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  ${schema ? schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n") : ""}
</head>
<body>
  <header class="header">
    <div class="container header-inner">
      <a href="./" class="brand">
        <span class="brand-mark">स</span>
        <span>${SITE}</span>
      </a>
      <nav class="nav">
        <a href="./#latest">Latest</a>
        <a href="./latest-jobs.html">Jobs</a>
        <a href="./results.html">Results</a>
        <a href="./admit-card.html">Admit Card</a>
      </nav>
    </div>
    <div class="container">
      <form class="searchbar" action="./search.html" method="get" role="search">
        <span class="material-symbols-outlined">search</span>
        <input type="search" name="q" placeholder="Search jobs, results, admit cards..." aria-label="Search">
        <button type="submit" class="search-btn">Search</button>
      </form>
    </div>
  </header>
  ${body}
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4>${SITE}</h4>
          <p>${data.site.tagline}. ${data.site.hindi}.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          ${data.categories.map((c) => `<a href="./${c.slug}.html">${esc(c.label)}</a>`).join("")}
        </div>
        <div>
          <h4>Exams</h4>
          ${data.exams.map((e) => `<a href="./exam-${e.slug}.html">${esc(e.label)}</a>`).join("")}
        </div>
        <div>
          <h4>Follow Us</h4>
          <a href="#">Telegram</a>
          <a href="#">WhatsApp</a>
          <a href="#">YouTube</a>
        </div>
      </div>
      <p class="footer-note">⚠️ This is a demo site. Verify all official information on government websites. ${SITE} © <span id="year"></span></p>
    </div>
  </footer>
  <script>document.getElementById("year").textContent=new Date().getFullYear();</script>
</body>
</html>`;
}

/* ---------- post row (the sarkari result table row) ---------- */
function postRow(p) {
  const cat = byCat[p.category];
  return `<tr class="post-row">
    <td class="post-name">
      <a href="./${p.id}.html" class="post-title">${esc(p.title)}</a>
      <span class="post-meta">
        <span class="chip-sm ${p.category}">${esc(cat ? cat.label : p.category)}</span>
        <span class="chip-sm">${esc(byExam[p.exam] ? byExam[p.exam].label : p.exam)}</span>
        <span class="chip-sm">${esc(p.examDate)}</span>
      </span>
    </td>
    <td class="post-dates">
      <span class="dates"><b>Start:</b> ${esc(p.applyStart)}</span>
      <span class="dates"><b>End:</b> ${esc(p.applyEnd)}</span>
    </td>
    <td class="post-actions">
      <a class="act-btn primary" href="${esc(p.links.apply)}" target="_blank" rel="noopener">Apply Online</a>
      <a class="act-btn" href="${esc(p.links.notification)}">Notification</a>
      <a class="act-btn ghost" href="${esc(p.links.official)}" target="_blank" rel="noopener">Official Site</a>
    </td>
  </tr>`;
}

function postTable(posts) {
  return `<div class="table-wrap"><table class="post-table">
    <thead><tr><th>Post Name</th><th>Important Dates</th><th>Links</th></tr></thead>
    <tbody>${posts.map(postRow).join("\n")}</tbody>
  </table></div>`;
}

/* ---------- homepage ---------- */
const latest = [...data.posts].sort((a, b) => (a.date < b.date ? 1 : -1));

const catBoxes = data.categories
  .map((c) => {
    const items = data.posts.filter((p) => p.category === c.slug).slice(0, 5);
    return `<div class="cat-box">
      <h3><span class="material-symbols-outlined">${c.icon}</span> ${esc(c.label)} <small>${esc(c.hindi)}</small></h3>
      <ul>${items.map((p) => `<li><a href="./${p.id}.html">${esc(p.title)}</a></li>`).join("")}</ul>
      <a class="more" href="./${c.slug}.html">View All →</a>
    </div>`;
  })
  .join("\n");

const examChips = data.exams
  .map((e) => `<a class="chip" href="./exam-${e.slug}.html"><span class="material-symbols-outlined">${e.icon}</span>${esc(e.label)}</a>`)
  .join("\n");

const homeBody = `
<main>
  <section class="ticker">
    <div class="container">
      <span class="ticker-label"><span class="material-symbols-outlined">campaign</span> Latest</span>
      <span class="ticker-text">${esc(latest[0].title)} · ${esc(latest[1].title)} · ${esc(latest[2].title)}</span>
    </div>
  </section>
  <section class="container">
    <div class="ad-slot" data-ad="leaderboard"><span>Advertisement</span></div>
  </section>
  <section class="container main-grid">
    <div class="content-col">
      <div class="card" id="latest">
        <h2 class="card-title"><span class="material-symbols-outlined">newspaper</span> Latest Jobs & Results <span class="updated-badge">Updated ${BUILT_PRETTY}</span></h2>
        ${postTable(latest.slice(0, 10))}
        <p class="all-link"><a href="./latest-jobs.html">View all latest posts →</a></p>
      </div>
      <div class="ad-slot" data-ad="infeed"><span>Advertisement</span></div>
      <div class="cat-grid">
        ${catBoxes}
      </div>
    </div>
    <aside class="side-col">
      <div class="card side-card">
        <h3><span class="material-symbols-outlined">groups</span> Join Our Channels</h3>
        <a class="channel telegram" href="#"><span class="material-symbols-outlined">send</span> Telegram Channel</a>
        <a class="channel whatsapp" href="#"><span class="material-symbols-outlined">chat</span> WhatsApp Group</a>
        <a class="channel youtube" href="#"><span class="material-symbols-outlined">play_circle</span> YouTube</a>
      </div>
      <div class="card side-card">
        <h3><span class="material-symbols-outlined">school</span> Exams</h3>
        <div class="chips">${examChips}</div>
      </div>
      <div class="ad-slot" data-ad="sidebar"><span>Advertisement</span></div>
    </aside>
  </section>
</main>`;

fs.writeFileSync(
  path.join(outDir, "index.html"),
  pageShell({
    title: `${SITE} — ${data.site.tagline}`,
    metaDesc: `${data.site.tagline}. ${data.site.hindi}. Get latest sarkari job notifications, exam results, admit cards, answer keys and syllabus in one place.`,
    canonical: `${DOMAIN}/`,
    body: homeBody,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE,
        url: DOMAIN,
        potentialAction: {
          "@type": "SearchAction",
          target: `${DOMAIN}/search.html?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE,
        url: DOMAIN,
      },
    ],
  })
);

/* ---------- category pages ---------- */
data.categories.forEach((cat) => {
  const posts = data.posts.filter((p) => p.category === cat.slug).sort((a, b) => (a.date < b.date ? 1 : -1));
  const body = `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> ${esc(cat.label)}</nav>
  <h1 class="page-h1"><span class="material-symbols-outlined">${cat.icon}</span> ${esc(cat.label)} <small>${esc(cat.hindi)}</small></h1>
  <p class="page-desc">${esc(cat.desc)}</p>
  ${postTable(posts)}
</main>`;
  fs.writeFileSync(
    path.join(outDir, `${cat.slug}.html`),
    pageShell({
      title: `${cat.label} 2026 — ${SITE} | ${esc(cat.desc)}`,
      metaDesc: `${cat.label} 2026: ${esc(cat.desc)}. Latest updates, official links and dates on ${SITE}.`,
      canonical: `${DOMAIN}/${cat.slug}.html`,
      body,
      schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: cat.label, url: `${DOMAIN}/${cat.slug}.html` }],
    })
  );
});

/* ---------- exam pages ---------- */
data.exams.forEach((exam) => {
  const posts = data.posts.filter((p) => p.exam === exam.slug).sort((a, b) => (a.date < b.date ? 1 : -1));
  const body = `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> ${esc(exam.label)}</nav>
  <h1 class="page-h1"><span class="material-symbols-outlined">${exam.icon}</span> ${esc(exam.label)} Jobs & Results</h1>
  <p class="page-desc">Latest ${esc(exam.label)} recruitment, results, admit cards and answer keys.</p>
  ${postTable(posts)}
</main>`;
  fs.writeFileSync(
    path.join(outDir, `exam-${exam.slug}.html`),
    pageShell({
      title: `${exam.label} 2026 Jobs, Results & Admit Cards — ${SITE}`,
      metaDesc: `Latest ${exam.label} 2026 recruitment, results, admit cards and answer keys with official links on ${SITE}.`,
      canonical: `${DOMAIN}/exam-${exam.slug}.html`,
      body,
      schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: `${exam.label} 2026`, url: `${DOMAIN}/exam-${exam.slug}.html` }],
    })
  );
});

/* ---------- post detail pages ---------- */
data.posts.forEach((p) => {
  const cat = byCat[p.category];
  const exam = byExam[p.exam];
  const related = data.posts
    .filter((x) => x.id !== p.id && (x.exam === p.exam || x.category === p.category))
    .slice(0, 4);

  /* overview table — shows only fields present, in a readable order */
  const ovFields = [
    ["Organization", p.org],
    ["Post Name", p.postName],
    ["Total Vacancies", p.vacancies],
    ["Pay Level / Salary", p.salary],
    ["Application Mode", p.mode],
    ["Application Start", p.applyStart],
    ["Application End", p.applyEnd],
    ["Exam Date", p.examDate],
    ["Age Limit", p.ageLimit],
    ["Qualification", p.qualification],
    ["Application Fee", p.fee],
    ["Selection Process", p.selection],
    ["Official Website", p.official ? `<a href="${esc(p.official)}" target="_blank" rel="noopener">${esc(p.official)}</a>` : null],
  ].filter(([k, v]) => v && v !== "—" && v !== "—");

  const body = `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> <a href="./${cat.slug}.html">${esc(cat.label)}</a> <span>›</span> ${esc(p.title)}</nav>
  <article class="card post-detail">
    <div class="post-head">
      <span class="chip-sm ${p.category}">${esc(cat.label)}</span>
      <span class="chip-sm">${esc(exam.label)}</span>
      <span class="chip-sm">${esc(p.date)}</span>
      ${p.verified ? '<span class="chip-sm" style="background:#f0fdf4;color:#15803d">✔ Officially Verified</span>' : ""}
    </div>
    <h1 class="page-h1">${esc(p.title)}</h1>
    <p class="page-desc">${esc(p.desc)}</p>

    <div class="quick-stats">
      ${p.vacancies ? `<div class="qs"><span class="material-symbols-outlined">groups</span><b>${esc(p.vacancies)}</b><small>Vacancies</small></div>` : ""}
      ${p.applyEnd ? `<div class="qs"><span class="material-symbols-outlined">event</span><b>${esc(p.applyEnd)}</b><small>Last Date</small></div>` : ""}
      ${p.ageLimit ? `<div class="qs"><span class="material-symbols-outlined">person</span><b>${esc(p.ageLimit)}</b><small>Age Limit</small></div>` : ""}
      ${p.fee ? `<div class="qs"><span class="material-symbols-outlined">payments</span><b>${esc(p.fee)}</b><small>Application Fee</small></div>` : ""}
    </div>

    <h2 class="sub-h">Overview</h2>
    <table class="detail-table">${ovFields.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join("")}</table>

    <div class="action-bar">
      <a class="act-btn primary big" href="${esc(p.links.apply)}" target="_blank" rel="noopener"><span class="material-symbols-outlined">launch</span> Apply Online</a>
      ${p.links.notification && p.links.notification !== "#" ? `<a class="act-btn big" href="${esc(p.links.notification)}" target="_blank" rel="noopener"><span class="material-symbols-outlined">description</span> Download Notification</a>` : ""}
      ${p.links.official ? `<a class="act-btn ghost big" href="${esc(p.links.official)}" target="_blank" rel="noopener"><span class="material-symbols-outlined">language</span> Official Website</a>` : ""}
    </div>
    <div class="ad-slot" data-ad="post"><span>Advertisement</span></div>

    <h2 class="sub-h">Post Details</h2>
    <ul class="detail-list">${p.details.map((d) => `<li><span class="material-symbols-outlined">check_circle</span> ${esc(d)}</li>`).join("")}</ul>

    ${p.sections ? p.sections.map((s) => `<h2 class="sub-h">${esc(s.h2)}</h2><div class="content-block">${s.paras.map((x) => `<p>${esc(x)}</p>`).join("")}${s.list ? `<ul class="detail-list">${s.list.map((x) => `<li><span class="material-symbols-outlined">arrow_right</span> ${esc(x)}</li>`).join("")}</ul>` : ""}</div>`).join("") : ""}

    <h2 class="sub-h">Frequently Asked Questions</h2>
    ${p.faqs.map((f) => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("")}
  </article>
  ${related.length ? `
  <section class="related">
    <h2 class="sub-h">Related Posts</h2>
    <div class="mini-list">${related.map((r) => `<a class="mini" href="./${r.id}.html"><span class="material-symbols-outlined">${byCat[r.category].icon}</span><div><b>${esc(r.title)}</b><small>${esc(r.examDate)}</small></div></a>`).join("")}</div>
  </section>` : ""}
</main>`;

  fs.writeFileSync(
    path.join(outDir, `${p.id}.html`),
    pageShell({
      title: `${p.title}${/\b20\d\d\b/.test(p.title) ? "" : " 2026"} — ${SITE}`,
      metaDesc: `${p.title}: ${esc(p.desc)} Apply Start ${p.applyStart}, End ${p.applyEnd}. Official links on ${SITE}.`,
      canonical: `${DOMAIN}/${p.id}.html`,
      body,
      schema: [
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: p.title,
          datePosted: p.date,
          url: `${DOMAIN}/${p.id}.html`,
          description: p.desc,
          employmentType: "FULL_TIME",
          hiringOrganization: { "@type": "Organization", name: `${exam.label} Recruitment` },
          jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "IN" } },
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: p.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    })
  );
});

/* ---------- search page ---------- */
const searchBody = `
<main class="container page">
  <h1 class="page-h1"><span class="material-symbols-outlined">search</span> Search Results</h1>
  <div class="card">
    <form class="searchbar" action="./search.html" method="get">
      <span class="material-symbols-outlined">search</span>
      <input type="search" id="q2" name="q" placeholder="Search..." aria-label="Search">
      <button type="submit" class="search-btn">Search</button>
    </form>
    <div id="search-results"><p class="page-desc">Type to search across all posts.</p></div>
  </div>
</main>
<script src="search.js"></script>`;

fs.writeFileSync(
  path.join(outDir, "search.html"),
  pageShell({
    title: `Search — ${SITE}`,
    metaDesc: `Search ${SITE} for jobs, results, admit cards, answer keys and syllabus.`,
    canonical: `${DOMAIN}/search.html`,
    body: searchBody,
    schema: [],
  })
);

/* ---------- sitemap ---------- */
const urls = [
  `${DOMAIN}/`,
  ...data.categories.map((c) => `${DOMAIN}/${c.slug}.html`),
  ...data.exams.map((e) => `${DOMAIN}/exam-${e.slug}.html`),
  ...data.posts.map((p) => `${DOMAIN}/${p.id}.html`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;
fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);

/* robots */
fs.writeFileSync(path.join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`);

/* ---------- search index (for client-side search) ---------- */
const index = data.posts.map((p) => ({
  id: p.id,
  title: p.title,
  cat: byCat[p.category].label,
  exam: byExam[p.exam].label,
  date: p.date,
  examDate: p.examDate,
  desc: p.desc,
}));
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index));

console.log(`✅ Built ${data.posts.length} posts + ${data.categories.length} categories + ${data.exams.length} exams + sitemap + search → public/`);
