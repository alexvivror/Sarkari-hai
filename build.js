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

/* is this URL a trusted government/verifiable official domain? */
function isOfficial(url) {
  return /\.gov\.in|\.nic\.in|\.ac\.in|\.edu|ibps\.in|ntpc\.co|isro\.gov|nhpcindia\.com|mumresults\.in|tn-mbamca\.com/i.test(url || "");
}

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
        <a href="./all-recruitment.html">All Posts</a>
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
          <a href="./about.html">About Us</a>
          <a href="./contact.html">Contact</a>
          <a href="./privacy.html">Privacy Policy</a>
          <a href="./disclaimer.html">Disclaimer</a>
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
      <p class="footer-note">⚠️ This site is for information only and is not a government website. Always verify on official government portals. ${SITE} © <span id="year"></span></p>
    </div>
  </footer>
  <script>document.getElementById("year").textContent=new Date().getFullYear();</script>
</body>
</html>`;
}

/* ---------- post row (the sarkari result table row) ---------- */
function postRow(p) {
  const cat = byCat[p.category];
  const off = isOfficial(p.links.apply);
  return `<tr class="post-row">
    <td class="post-name">
      <a href="./${p.id}.html" class="post-title">${esc(p.title)}</a>
      ${off ? '<span class="official-tag" title="Links to official government website">✔ Official</span>' : ""}
      <span class="post-meta">
        <span class="chip-sm ${p.category}">${esc(cat ? cat.label : p.category)}</span>
        <span class="chip-sm">${esc(byExam[p.exam] ? byExam[p.exam].label : p.exam)}</span>
        <span class="chip-sm">${esc(p.examDate || "—")}</span>
      </span>
    </td>
    <td class="post-dates">
      <span class="dates"><b>Start:</b> ${esc(p.applyStart || "—")}</span>
      <span class="dates"><b>End:</b> ${esc(p.applyEnd || "—")}</span>
    </td>
    <td class="post-actions">
      <a class="act-btn primary" href="${esc(p.links.apply)}" target="_blank" rel="noopener nofollow">Apply Online</a>
      <a class="act-btn" href="${esc(p.links.notification)}" rel="noopener nofollow">Notification</a>
      <a class="act-btn ghost" href="${esc(p.links.official)}" target="_blank" rel="noopener nofollow">Official Site</a>
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

const trending = [
  "SSC CGL 2026", "UPSC IAS 2026", "RRB NTPC", "IBPS Clerk", "NEET 2027",
  "Delhi Police", "Agniveer Army", "CTET 2026", "JEE Main 2027", "CUET UG",
].map((t) => `<a class="chip" href="./search.html?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join("\n");

const homeBody = `
<main>
  <section class="ticker">
    <div class="container">
      <span class="ticker-label"><span class="material-symbols-outlined">campaign</span> Latest</span>
      <span class="ticker-text">${esc(latest[0].title)} · ${esc(latest[1].title)} · ${esc(latest[2].title)}</span>
    </div>
  </section>
  <section class="container">
    <div class="app-banner">
      <div class="app-info">
        <span class="app-icon material-symbols-outlined">smartphone</span>
        <div>
          <h3>Get ${SITE} on your phone</h3>
          <p>Instant job alerts, results &amp; admit cards — download the free app.</p>
        </div>
      </div>
      <a class="app-btn" href="#"><span class="material-symbols-outlined">download</span> Download App</a>
    </div>
  </section>
  <section class="container main-grid">
    <div class="content-col">
      <div class="card" id="latest">
        <h2 class="card-title"><span class="material-symbols-outlined">newspaper</span> Latest Jobs & Results <span class="updated-badge">Updated ${BUILT_PRETTY}</span></h2>
        ${postTable(latest.slice(0, 10))}
        <p class="all-link"><a href="./all-recruitment.html">View all ${latest.length} posts in one page →</a></p>
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
      <div class="card side-card">
        <h3><span class="material-symbols-outlined">trending_up</span> Trending Searches</h3>
        <div class="chips">${trending}</div>
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

/* ---------- static info pages (trust + AdSense approval) ---------- */
const STATIC_PAGES = [
  {
    slug: "about",
    title: "About Us",
    meta: "About Sarkari Hai — a free platform for latest sarkari jobs, results, admit cards and answer keys.",
    body: `
  <main class="container page">
    <nav class="crumbs"><a href="./">Home</a> <span>›</span> About</nav>
    <h1 class="page-h1"><span class="material-symbols-outlined">info</span> About ${SITE}</h1>
    <article class="card post-detail">
      <p class="page-desc">${SITE} is a free information platform that helps job seekers across India find the latest government job notifications, exam results, admit cards, answer keys and syllabus — all in one place.</p>
      <h2 class="sub-h">What we do</h2>
      <ul class="detail-list">
        <li><span class="material-symbols-outlined">check_circle</span> Publish latest sarkari job notifications as soon as they are released</li>
        <li><span class="material-symbols-outlined">check_circle</span> Provide exam results and admit card download links</li>
        <li><span class="material-symbols-outlined">check_circle</span> Share answer keys and syllabus for upcoming exams</li>
        <li><span class="material-symbols-outlined">check_circle</span> Link to official government websites for every application</li>
      </ul>
      <h2 class="sub-h">Our promise</h2>
      <p class="page-desc">We only link to official government websites (.gov.in, .nic.in) for applications. We do not collect or store any personal information. The site is free for all users.</p>
      <h2 class="sub-h">Contact</h2>
      <p class="page-desc">Questions or suggestions? Visit our <a href="./contact.html" style="color:var(--primary);font-weight:700">Contact page</a>.</p>
    </article>
  </main>`,
  },
  {
    slug: "contact",
    title: "Contact Us",
    meta: "Contact Sarkari Hai — send feedback, suggestions or report issues.",
    body: `
  <main class="container page">
    <nav class="crumbs"><a href="./">Home</a> <span>›</span> Contact</nav>
    <h1 class="page-h1"><span class="material-symbols-outlined">mail</span> Contact Us</h1>
    <div class="card post-detail">
      <p class="page-desc">Have a question, feedback, or found something incorrect? Reach out and we will fix it quickly.</p>
      <p class="page-desc">For official information, always visit the government website listed on the relevant post page.</p>
      <div class="quick-stats">
        <div class="qs"><span class="material-symbols-outlined">alternate_email</span><b>Email</b><small>support@sarkari-hai.in</small></div>
        <div class="qs"><span class="material-symbols-outlined">send</span><b>Telegram</b><small>@sarkarihai</small></div>
      </div>
    </div>
  </main>`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    meta: "Sarkari Hai privacy policy — we do not collect personal data. All tools run in your browser.",
    body: `
  <main class="container page">
    <nav class="crumbs"><a href="./">Home</a> <span>›</span> Privacy Policy</nav>
    <h1 class="page-h1"><span class="material-symbols-outlined">privacy_tip</span> Privacy Policy</h1>
    <article class="card post-detail">
      <h2 class="sub-h">Information we collect</h2>
      <p class="page-desc">${SITE} does not collect, store, or share any personal information. We have no user accounts, no forms that store data, and no tracking of individual visitors.</p>
      <h2 class="sub-h">Cookies and advertising</h2>
      <p class="page-desc">We may show advertisements. Ad networks such as Google AdSense may use cookies to serve relevant ads. You can disable cookies in your browser settings at any time.</p>
      <h2 class="sub-h">Third-party links</h2>
      <p class="page-desc">We link to official government websites for applications and notifications. We are not responsible for the content or privacy practices of external sites. Always verify information on the official website.</p>
      <h2 class="sub-h">Changes</h2>
      <p class="page-desc">This policy may be updated occasionally. Continued use of the site means you accept the current policy.</p>
    </article>
  </main>`,
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    meta: "Sarkari Hai disclaimer — results and dates are for information; always verify on official government websites.",
    body: `
  <main class="container page">
    <nav class="crumbs"><a href="./">Home</a> <span>›</span> Disclaimer</nav>
    <h1 class="page-h1"><span class="material-symbols-outlined">warning</span> Disclaimer</h1>
    <article class="card post-detail">
      <h2 class="sub-h">Information only</h2>
      <p class="page-desc">${SITE} publishes job notifications, results, admit card and answer key information for the convenience of job seekers. All information is provided "as is" for informational purposes only.</p>
      <h2 class="sub-h">Always verify officially</h2>
      <p class="page-desc">Before applying, verify all details — eligibility, dates, fees — on the official government website. ${SITE} is not a government website and is not affiliated with any government body.</p>
      <h2 class="sub-h">No guarantee</h2>
      <p class="page-desc">We strive for accuracy but cannot guarantee that all information is complete or error-free. We are not liable for any loss arising from the use of this information. Application and result decisions are made solely by the respective recruiting bodies.</p>
    </article>
  </main>`,
  },
];

STATIC_PAGES.forEach((pg) => {
  fs.writeFileSync(
    path.join(outDir, `${pg.slug}.html`),
    pageShell({
      title: `${pg.title} — ${SITE}`,
      metaDesc: pg.meta,
      canonical: `${DOMAIN}/${pg.slug}.html`,
      body: pg.body,
      schema: [],
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

/* ---------- all-recruitment page (single file with every post) ---------- */
const allPosts = [...data.posts].sort((a, b) => (a.date < b.date ? 1 : -1));
fs.writeFileSync(
  path.join(outDir, "all-recruitment.html"),
  pageShell({
    title: `All Recruitment Posts — ${SITE}`,
    metaDesc: `All sarkari recruitment posts in one place: jobs, results, admit cards, answer keys, syllabus and admissions. ${allPosts.length} posts with official links.`,
    canonical: `${DOMAIN}/all-recruitment.html`,
    body: `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> All Recruitment Posts</nav>
  <h1 class="page-h1"><span class="material-symbols-outlined">lists</span> All Recruitment Posts <small>${allPosts.length} total</small></h1>
  <p class="page-desc">Every recruitment notification, result, admit card, answer key, syllabus and admission update — in one place. All apply links go to official government websites.</p>
  ${postTable(allPosts)}
</main>`,
    schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "All Recruitment Posts", url: `${DOMAIN}/all-recruitment.html` }],
  })
);

/* ---------- 404 page ---------- */
fs.writeFileSync(
  path.join(outDir, "404.html"),
  pageShell({
    title: `Page Not Found — ${SITE}`,
    metaDesc: "Page not found. Browse the latest sarkari jobs, results and admit cards.",
    canonical: `${DOMAIN}/404.html`,
    body: `
<main class="container notfound">
  <div class="big-404">404</div>
  <h1>Page not found</h1>
  <p>The page you are looking for may have been removed or moved.</p>
  <a class="app-btn" href="./"><span class="material-symbols-outlined">home</span> Back to Home</a>
</main>`,
    schema: [],
  })
);

/* ---------- sitemap ---------- */
const urls = [
  `${DOMAIN}/`,
  `${DOMAIN}/all-recruitment.html`,
  ...data.categories.map((c) => `${DOMAIN}/${c.slug}.html`),
  ...data.exams.map((e) => `${DOMAIN}/exam-${e.slug}.html`),
  ...data.posts.map((p) => `${DOMAIN}/${p.id}.html`),
  ...STATIC_PAGES.map((pg) => `${DOMAIN}/${pg.slug}.html`),
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
