#!/usr/bin/env node
/* ============================================================
   scripts/build.js — static site generator (orchestrator)
   Reads database/posts.json → generates public/
   Uses: services/content.js (data), services/seo.js (metadata),
         components/ui.js (UI), lib/utils.js (helpers)
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const { loadPosts } = require("../services/content");
const { pageShell, websiteSchema, jobPostingSchema, faqSchema, breadcrumbSchema, sitemapXml, robotsTxt } = require("../services/seo");
const { header, footer, postTable, catBoxes, freeTools, sidebar, appBanner } = require("../components/ui");
const { esc, prettyToday } = require("../lib/utils");

const data = loadPosts();
const SITE = data.site.name;
const DOMAIN = data.site.domain;
const BUILT_PRETTY = prettyToday();

const ROOT = path.join(__dirname, "..", "..");
const outDir = path.join(ROOT, "public");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "posts"), { recursive: true });

/* copy static assets from src/ */
for (const asset of ["style.css", "search.js"]) {
  const src = path.join(ROOT, "src", asset);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, asset));
}

const byCat = Object.fromEntries(data.categories.map((c) => [c.slug, c]));
const byExam = Object.fromEntries(data.exams.map((e) => [e.slug, e]));

function shell(opts) {
  return pageShell({ ...opts, SITE });
}

/* ---------- homepage ---------- */
const latest = [...data.posts].sort((a, b) => (a.date < b.date ? 1 : -1));

const examChips = data.exams.map((e) => `<a class="chip" href="./exam-${e.slug}.html"><span class="material-symbols-outlined">${e.icon}</span>${esc(e.label)}</a>`).join("\n");
const trending = ["SSC CGL 2026", "UPSC IAS 2026", "RRB NTPC", "IBPS Clerk", "NEET 2027", "Delhi Police", "Agniveer Army", "CTET 2026", "JEE Main 2027", "CUET UG"]
  .map((t) => `<a class="chip" href="./search.html?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join("\n");

const tools = [
  { icon: "calculate", name: "Age Calculator", desc: "Exact age in days", href: "https://alexvivror.github.io/New/age-calculator.html" },
  { icon: "percent", name: "Percentage Calculator", desc: "% of, % change", href: "https://alexvivror.github.io/New/percentage-calculator.html" },
  { icon: "monitor_weight", name: "BMI Calculator", desc: "Body mass index", href: "https://alexvivror.github.io/New/bmi-calculator.html" },
  { icon: "image", name: "Image Resizer", desc: "Resize photos", href: "https://alexvivror.github.io/New/" },
  { icon: "description", name: "JPG to PDF", desc: "Convert files", href: "https://alexvivror.github.io/New/" },
  { icon: "lock", name: "Password Generator", desc: "Strong passwords", href: "https://alexvivror.github.io/New/password-generator.html" },
];

const homeBody = `
<main>
  <section class="ticker">
    <div class="container">
      <span class="ticker-label"><span class="material-symbols-outlined">campaign</span> Latest</span>
      <span class="ticker-text">${esc(latest[0]?.title)} · ${esc(latest[1]?.title)} · ${esc(latest[2]?.title)}</span>
    </div>
  </section>
  ${appBanner(SITE)}
  ${freeTools(tools)}
  <section class="container main-grid">
    <div class="content-col">
      <div class="card" id="latest">
        <h2 class="card-title"><span class="material-symbols-outlined">newspaper</span> Latest Jobs & Results <span class="updated-badge">Updated ${BUILT_PRETTY}</span></h2>
        ${postTable(latest.slice(0, 10), byCat, byExam)}
        <p class="all-link"><a href="./all-recruitment.html">View all ${latest.length} posts in one page →</a></p>
      </div>
      <div class="ad-slot" data-ad="infeed"><span>Advertisement</span></div>
      <div class="cat-grid">
        ${catBoxes(data.categories, data.posts)}
      </div>
    </div>
    ${sidebar(examChips, trending)}
  </section>
</main>`;

fs.writeFileSync(path.join(outDir, "index.html"), shell({
  title: `${SITE} — Latest Sarkari Jobs, Results, Admit Cards & Answer Keys`,
  metaDesc: `${data.site.tagline}. ${data.site.hindi}. Get latest sarkari job notifications, exam results, admit cards, answer keys and syllabus in one place.`,
  canonical: `${DOMAIN}/`,
  body: header(SITE, "Latest") + homeBody + footer(SITE, data),
  schema: [websiteSchema(SITE, DOMAIN), { "@context": "https://schema.org", "@type": "Organization", name: SITE, url: DOMAIN }],
}));

/* ---------- category pages ---------- */
data.categories.forEach((cat) => {
  const posts = data.posts.filter((p) => p.category === cat.slug).sort((a, b) => (a.date < b.date ? 1 : -1));
  const body = `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> ${esc(cat.label)}</nav>
  <h1 class="page-h1"><span class="material-symbols-outlined">${cat.icon}</span> ${esc(cat.label)} <small>${esc(cat.hindi)}</small></h1>
  <p class="page-desc">${esc(cat.desc)}</p>
  ${postTable(posts, byCat, byExam)}
</main>`;
  fs.writeFileSync(path.join(outDir, `${cat.slug}.html`), shell({
    title: `${cat.label} 2026 — ${SITE} | ${esc(cat.desc)}`,
    metaDesc: `${cat.label} 2026: ${esc(cat.desc)}. Latest updates, official links and dates on ${SITE}.`,
    canonical: `${DOMAIN}/${cat.slug}.html`,
    body: header(SITE) + body + footer(SITE, data),
    schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: cat.label, url: `${DOMAIN}/${cat.slug}.html` }],
  }));
});

/* ---------- exam pages ---------- */
data.exams.forEach((exam) => {
  const posts = data.posts.filter((p) => p.exam === exam.slug).sort((a, b) => (a.date < b.date ? 1 : -1));
  const body = `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> ${esc(exam.label)}</nav>
  <h1 class="page-h1"><span class="material-symbols-outlined">${exam.icon}</span> ${esc(exam.label)} Jobs & Results</h1>
  <p class="page-desc">Latest ${esc(exam.label)} recruitment, results, admit cards and answer keys.</p>
  ${postTable(posts, byCat, byExam)}
</main>`;
  fs.writeFileSync(path.join(outDir, `exam-${exam.slug}.html`), shell({
    title: `${exam.label} 2026 Jobs, Results & Admit Cards — ${SITE}`,
    metaDesc: `Latest ${exam.label} 2026 recruitment, results, admit cards and answer keys with official links on ${SITE}.`,
    canonical: `${DOMAIN}/exam-${exam.slug}.html`,
    body: header(SITE) + body + footer(SITE, data),
    schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: `${exam.label} 2026`, url: `${DOMAIN}/exam-${exam.slug}.html` }],
  }));
});

/* ---------- post detail pages (full required fields) ---------- */
data.posts.forEach((p) => {
  const cat = byCat[p.category];
  const exam = byExam[p.exam];
  const related = data.posts.filter((x) => x.id !== p.id && (x.exam === p.exam || x.category === p.category)).slice(0, 4);

  const ovFields = [
    ["Department / Organization", p.org],
    ["Post Name", p.postName],
    ["Total Vacancies", p.vacancies],
    ["Pay Level / Salary", p.salary],
    ["Application Mode", p.mode],
    ["Application Start", p.applyStart],
    ["Application End", p.applyEnd],
    ["Exam Date", p.examDate],
    ["Age Limit", p.ageLimit],
    ["Qualification / Eligibility", p.qualification],
    ["Application Fee", p.fee],
    ["Selection Process", p.selection],
    ["Required Documents", p.documents],
    ["Official Website", p.official ? `<a href="${esc(p.official)}" target="_blank" rel="noopener">${esc(p.official)}</a>` : null],
  ].filter(([k, v]) => v && v !== "—");

  const body = `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> <a href="./${cat.slug}.html">${esc(cat.label)}</a> <span>›</span> ${esc(p.title)}</nav>
  <article class="card post-detail">
    <div class="post-head">
      <span class="chip-sm ${p.category}">${esc(cat.label)}</span>
      <span class="chip-sm">${esc(exam.label)}</span>
      <span class="chip-sm">${esc(p.date)}</span>
      ${p.verified ? '<span class="chip-sm" style="background:#f0fdf4;color:#15803d">✔ Officially Verified</span>' : ""}
      <span class="chip-sm" style="background:#eff6ff;color:#1d4ed8">Updated: ${esc(p.date)}</span>
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
      <a class="act-btn primary big" href="${esc(p.links.apply)}" target="_blank" rel="noopener nofollow"><span class="material-symbols-outlined">launch</span> Apply Online</a>
      ${p.links.notification && p.links.notification !== "#" ? `<a class="act-btn big" href="${esc(p.links.notification)}" target="_blank" rel="noopener nofollow"><span class="material-symbols-outlined">description</span> Download Notification</a>` : ""}
      ${p.links.official ? `<a class="act-btn ghost big" href="${esc(p.links.official)}" target="_blank" rel="noopener nofollow"><span class="material-symbols-outlined">language</span> Official Website</a>` : ""}
    </div>
    <div class="ad-slot" data-ad="post"><span>Advertisement</span></div>

    <h2 class="sub-h">Post Details</h2>
    <ul class="detail-list">${(p.details || []).map((d) => `<li><span class="material-symbols-outlined">check_circle</span> ${esc(d)}</li>`).join("")}</ul>

    ${p.sections ? p.sections.map((s) => `<h2 class="sub-h">${esc(s.h2)}</h2><div class="content-block">${(s.paras || []).map((x) => `<p>${esc(x)}</p>`).join("")}${s.list ? `<ul class="detail-list">${s.list.map((x) => `<li><span class="material-symbols-outlined">arrow_right</span> ${esc(x)}</li>`).join("")}</ul>` : ""}</div>`).join("") : ""}

    <h2 class="sub-h">Frequently Asked Questions</h2>
    ${(p.faqs || []).map((f) => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("")}
  </article>
  ${related.length ? `
  <section class="related">
    <h2 class="sub-h">Related Posts</h2>
    <div class="mini-list">${related.map((r) => `<a class="mini" href="./posts/${r.id}.html"><span class="material-symbols-outlined">${byCat[r.category].icon}</span><div><b>${esc(r.title)}</b><small>${esc(r.examDate)}</small></div></a>`).join("")}</div>
  </section>` : ""}
</main>`;

  fs.writeFileSync(path.join(outDir, "posts", `${p.id}.html`), shell({
    title: `${p.title}${/\b20\d\d\b/.test(p.title) ? "" : " 2026"} — ${SITE}`,
    metaDesc: `${p.title}: ${esc(p.desc)}${p.applyStart && p.applyStart !== "—" ? ` Apply start ${p.applyStart}` : ""}${p.applyEnd && p.applyEnd !== "—" ? `, end ${p.applyEnd}` : ""}. Official links on ${SITE}.`,
    canonical: `${DOMAIN}/posts/${p.id}.html`,
    body: header(SITE) + body + footer(SITE, data),
    schema: [
      jobPostingSchema(p, DOMAIN, exam.label),
      faqSchema(p.faqs),
      breadcrumbSchema([
        { name: "Home", url: `${DOMAIN}/` },
        { name: cat.label, url: `${DOMAIN}/${cat.slug}.html` },
        { name: p.title, url: `${DOMAIN}/posts/${p.id}.html` },
      ]),
    ],
  }));
});

/* ---------- all-recruitment page ---------- */
const allPosts = [...data.posts].sort((a, b) => (a.date < b.date ? 1 : -1));
fs.writeFileSync(path.join(outDir, "all-recruitment.html"), shell({
  title: `All Recruitment Posts — ${SITE}`,
  metaDesc: `All sarkari recruitment posts in one place: jobs, results, admit cards, answer keys, syllabus and admissions. ${allPosts.length} posts with official links.`,
  canonical: `${DOMAIN}/all-recruitment.html`,
  body: header(SITE) + `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> All Recruitment Posts</nav>
  <h1 class="page-h1"><span class="material-symbols-outlined">lists</span> All Recruitment Posts <small>${allPosts.length} total</small></h1>
  <p class="page-desc">Every recruitment notification, result, admit card, answer key, syllabus and admission update — in one place. All apply links go to official government websites.</p>
  ${postTable(allPosts, byCat, byExam)}
</main>` + footer(SITE, data),
  schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "All Recruitment Posts", url: `${DOMAIN}/all-recruitment.html` }],
}));

/* ---------- exam calendar page (differentiator) ---------- */
const upcoming = [...data.posts]
  .filter((p) => p.examDate && !/declared|released|out|updated/i.test(p.examDate))
  .sort((a, b) => (a.examDate < b.examDate ? 1 : -1));

const calendarRows = upcoming
  .map((p) => `<tr>
    <td><a href="./posts/${p.id}.html" class="post-title">${esc(p.title)}</a></td>
    <td><span class="chip-sm ${p.category}">${esc(byCat[p.category].label)}</span> <span class="chip-sm">${esc(byExam[p.exam].label)}</span></td>
    <td><b>${esc(p.examDate)}</b></td>
    <td>${esc(p.applyEnd || "—")}</td>
  </tr>`)
  .join("\n");

fs.writeFileSync(path.join(outDir, "exam-calendar.html"), shell({
  title: `Exam Calendar 2026-27 — Upcoming Exam Dates — ${SITE}`,
  metaDesc: `Upcoming government exam dates 2026-27: SSC, UPSC, Railway, Bank, Police and more. Never miss an exam date — ${SITE} exam calendar.`,
  canonical: `${DOMAIN}/exam-calendar.html`,
  body: header(SITE) + `
<main class="container page">
  <nav class="crumbs"><a href="./">Home</a> <span>›</span> Exam Calendar</nav>
  <h1 class="page-h1"><span class="material-symbols-outlined">calendar_month</span> Exam Calendar 2026-27</h1>
  <p class="page-desc">Upcoming government exam dates — check what's next and never miss a deadline. All links verified to official sources.</p>
  <div class="card">
    <div class="table-wrap"><table class="post-table">
      <thead><tr><th>Exam / Post</th><th>Category</th><th>Exam Date</th><th>Apply Last Date</th></tr></thead>
      <tbody>${calendarRows || '<tr><td colspan="4" style="text-align:center;color:var(--muted)">No upcoming exams listed right now — check back soon.</td></tr>'}</tbody>
    </table></div>
  </div>
</main>` + footer(SITE, data),
  schema: [{ "@context": "https://schema.org", "@type": "ItemList", name: "Exam Calendar 2026-27", url: `${DOMAIN}/exam-calendar.html` }],
}));

/* ---------- static pages (About, Contact, Privacy, Disclaimer) ---------- */
const STATIC_PAGES = [
  {
    slug: "about", title: "About Us",
    meta: `About ${SITE} — a free platform for latest sarkari jobs, results, admit cards and answer keys.`,
    content: `<p class="page-desc">${SITE} is a free information platform that helps job seekers across India find the latest government job notifications, exam results, admit cards, answer keys and syllabus — all in one place.</p>
      <h2 class="sub-h">What we do</h2>
      <ul class="detail-list">
        <li><span class="material-symbols-outlined">check_circle</span> Publish latest sarkari job notifications after verification</li>
        <li><span class="material-symbols-outlined">check_circle</span> Provide exam results and admit card download links</li>
        <li><span class="material-symbols-outlined">check_circle</span> Share answer keys and syllabus for upcoming exams</li>
        <li><span class="material-symbols-outlined">check_circle</span> Link ONLY to official government websites for every application</li>
      </ul>
      <h2 class="sub-h">Our promise</h2>
      <p class="page-desc">We only link to official government websites (.gov.in, .nic.in) for applications. We do not collect or store any personal information. The site is free for all users. Unverified information is never published.</p>
      <h2 class="sub-h">Contact</h2>
      <p class="page-desc">Questions or suggestions? Visit our <a href="./contact.html" style="color:var(--primary);font-weight:700">Contact page</a>.</p>`,
  },
  {
    slug: "contact", title: "Contact Us",
    meta: `Contact ${SITE} — send feedback, suggestions or report issues.`,
    content: `<p class="page-desc">Have a question, feedback, or found something incorrect? Reach out and we will fix it quickly.</p>
      <p class="page-desc">For official information, always visit the government website listed on the relevant post page.</p>
      <div class="quick-stats">
        <div class="qs"><span class="material-symbols-outlined">alternate_email</span><b>Email</b><small>support@sarkari-hai.in</small></div>
        <div class="qs"><span class="material-symbols-outlined">send</span><b>Telegram</b><small>@sarkarihai</small></div>
      </div>`,
  },
  {
    slug: "privacy", title: "Privacy Policy",
    meta: `${SITE} privacy policy — we do not collect personal data. All tools run in your browser.`,
    content: `<h2 class="sub-h">Information we collect</h2>
      <p class="page-desc">${SITE} does not collect, store, or share any personal information. We have no user accounts, no forms that store data, and no tracking of individual visitors.</p>
      <h2 class="sub-h">Cookies and advertising</h2>
      <p class="page-desc">We may show advertisements. Ad networks such as Google AdSense may use cookies to serve relevant ads. You can disable cookies in your browser settings at any time.</p>
      <h2 class="sub-h">Third-party links</h2>
      <p class="page-desc">We link to official government websites for applications and notifications. We are not responsible for the content or privacy practices of external sites. Always verify information on the official website.</p>
      <h2 class="sub-h">Changes</h2>
      <p class="page-desc">This policy may be updated occasionally. Continued use of the site means you accept the current policy.</p>`,
  },
  {
    slug: "disclaimer", title: "Disclaimer",
    meta: `${SITE} disclaimer — results and dates are for information; always verify on official government websites.`,
    content: `<h2 class="sub-h">Information only</h2>
      <p class="page-desc">${SITE} publishes job notifications, results, admit card and answer key information for the convenience of job seekers. All information is provided "as is" for informational purposes only.</p>
      <h2 class="sub-h">Always verify officially</h2>
      <p class="page-desc">Before applying, verify all details — eligibility, dates, fees — on the official government website. ${SITE} is not a government website and is not affiliated with any government body.</p>
      <h2 class="sub-h">No guarantee</h2>
      <p class="page-desc">We strive for accuracy but cannot guarantee that all information is complete or error-free. We are not liable for any loss arising from the use of this information. Application and result decisions are made solely by the respective recruiting bodies.</p>`,
  },
];

STATIC_PAGES.forEach((pg) => {
  fs.writeFileSync(path.join(outDir, `${pg.slug}.html`), shell({
    title: `${pg.title} — ${SITE}`,
    metaDesc: pg.meta,
    canonical: `${DOMAIN}/${pg.slug}.html`,
    body: header(SITE) + `<main class="container page"><nav class="crumbs"><a href="./">Home</a> <span>›</span> ${pg.title}</nav><h1 class="page-h1"><span class="material-symbols-outlined">${pg.icon || "info"}</span> ${pg.title}</h1><article class="card post-detail">${pg.content}</article></main>` + footer(SITE, data),
    schema: [],
  }));
});

/* ---------- 404 ---------- */
fs.writeFileSync(path.join(outDir, "404.html"), shell({
  title: `Page Not Found — ${SITE}`,
  metaDesc: "Page not found. Browse the latest sarkari jobs, results and admit cards.",
  canonical: `${DOMAIN}/404.html`,
  body: header(SITE) + `<main class="container notfound"><div class="big-404">404</div><h1>Page not found</h1><p>The page you are looking for may have been removed or moved.</p><a class="app-btn" href="./"><span class="material-symbols-outlined">home</span> Back to Home</a></main>` + footer(SITE, data),
  schema: [],
}));

/* ---------- search page ---------- */
fs.writeFileSync(path.join(outDir, "search.html"), shell({
  title: `Search — ${SITE}`,
  metaDesc: `Search ${SITE} for jobs, results, admit cards, answer keys and syllabus.`,
  canonical: `${DOMAIN}/search.html`,
  body: header(SITE) + `<main class="container page"><h1 class="page-h1"><span class="material-symbols-outlined">search</span> Search Results</h1><div class="card"><form class="searchbar" action="./search.html" method="get"><span class="material-symbols-outlined">search</span><input type="search" id="q2" name="q" placeholder="Search..." aria-label="Search"><button type="submit" class="search-btn">Search</button></form><div id="search-results"><p class="page-desc">Type to search across all posts.</p></div></div></main><script src="search.js"></script>` + footer(SITE, data),
  schema: [],
}));

/* ---------- sitemap + robots ---------- */
const urls = [
  `${DOMAIN}/`,
  `${DOMAIN}/all-recruitment.html`,
  `${DOMAIN}/exam-calendar.html`,
  ...data.categories.map((c) => `${DOMAIN}/${c.slug}.html`),
  ...data.exams.map((e) => `${DOMAIN}/exam-${e.slug}.html`),
  ...data.posts.map((p) => `${DOMAIN}/posts/${p.id}.html`),
  ...STATIC_PAGES.map((pg) => `${DOMAIN}/${pg.slug}.html`),
];
fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemapXml(urls));
fs.writeFileSync(path.join(outDir, "robots.txt"), robotsTxt(DOMAIN));

/* ---------- search index ---------- */
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
