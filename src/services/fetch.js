/* ============================================================
   services/fetch.js — fetch + verify latest notifications
   - fetch RSS from job alert feed
   - strict official-domain match (services/official.js)
   - build verified post objects (never guess a link)
   ============================================================ */
"use strict";

const { findOfficial } = require("./official");
const { slugify, log } = require("../lib/utils");

const RSS_URL = "https://www.freejobalert.com/feed/";
const MAX_POSTS = 24;

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

async function fetchRss() {
  const res = await fetch(RSS_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SarkariHaiBot/1.0)" },
  });
  if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status}`);
  const xml = await res.text();
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const grab = (tag) => {
      const r = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return r ? r[1].trim() : "";
    };
    const title = grab("title").replace(/<!\[CDATA\[|\]\]>/g, "");
    const link = grab("link");
    const pubDate = grab("pubDate");
    const desc = stripHtml(grab("description"));
    if (title && link) items.push({ title, link, pubDate, desc });
  }
  return items;
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return { sort: "2000-01-01", pretty: "—" };
  return {
    sort: d.toISOString().slice(0, 10),
    pretty: d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
  };
}

/* Only include posts where we can confidently link an official govt domain.
   NEVER guess — unverifiable items are skipped. */
function buildVerifiedPosts(rssItems) {
  const posts = [];
  let skipped = 0;
  for (let i = 0; i < rssItems.length && posts.length < MAX_POSTS; i++) {
    const it = rssItems[i];
    const match = findOfficial(it.title);
    if (!match || !match.cfg.apply) { skipped++; continue; }
    const d = fmtDate(it.pubDate);
    const officialUrl = match.cfg.apply;
    posts.push({
      id: slugify(it.title) + "-" + i,
      title: it.title,
      category: "latest-jobs",
      exam: match.slug,
      date: d.sort,
      applyStart: d.pretty,
      applyEnd: "—",
      examDate: "—",
      desc: it.desc || `Latest sarkari notification: ${it.title}. Apply before the deadline.`,
      details: [`Posted: ${d.pretty}`, `Apply on official website: ${officialUrl}`, "Verify details on the official website before applying"],
      faqs: [
        { q: `How to apply for ${it.title}?`, a: "Click Apply Online on this page to open the official website. Read the eligibility criteria carefully and complete your application before the last date." },
        { q: "Where can I find the official notification?", a: "The Apply Online button on this page links to the official government website with full details including eligibility, fees, and selection process." },
      ],
      links: { apply: officialUrl, notification: officialUrl, official: officialUrl },
    });
  }
  log(`  (${skipped} items skipped — no verified official domain)`);
  return posts;
}

module.exports = { fetchRss, buildVerifiedPosts, MAX_POSTS };
