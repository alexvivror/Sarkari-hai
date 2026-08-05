#!/usr/bin/env node
/* ============================================================
   Sarkari Hai — daily auto-updater
   Fetches latest sarkari notifications from FreeJobAlert RSS,
   classifies them into categories, updates data/posts.json,
   regenerates the site, and pushes to GitHub (auto-deploys).

   Run: node fetch-latest.js [--no-push]   (--no-push: local only)
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "posts.json");
const RSS_URL = "https://www.freejobalert.com/feed/";
const MAX_POSTS = 24; // keep latest N real posts
const NO_PUSH = process.argv.includes("--no-push");

/* ---------------- category + exam classifiers ---------------- */
function classify(title) {
  const t = title.toLowerCase();
  let category = "latest-jobs";
  if (/(result|selected|merit|provisional|allotment|final answer)/.test(t)) category = "results";
  if (/(admit card|hall ticket|call letter|admitcard)/.test(t)) category = "admit-card";
  if (/(answer key|answerkey|response sheet)/.test(t)) category = "answer-key";
  if (/(syllabus|exam pattern|scheme of exam)/.test(t)) category = "syllabus";
  if (/(admission|seat allotment|entrance|counselling)/.test(t)) category = "admission";
  if (/(walkin|walk-in|interview)/.test(t) && category === "latest-jobs") category = "latest-jobs";

  let exam = "state";
  if (/\bssc\b|cgl|chsl|stenographer|mts|gd constable|ssc cpo/.test(t)) exam = "ssc";
  else if (/upsc|ias|ips|cse |civil services|nda|cds|ifos/.test(t)) exam = "upsc";
  else if (/railway|rrb|ntpc|group d|alp|rrc/.test(t)) exam = "railway";
  else if (/ibps|sbi|rbi|bank|po |clerk|rrb po|officer/.test(t)) exam = "bank";
  else if (/police|constable|si |sepoy|constable|excise|home guard/.test(t)) exam = "police";
  else if (/army|navy|air force|agniveer|defence|soldier|iaf|indian navy/.test(t)) exam = "defence";
  else if (/teacher|tet|ctet|dsssb|kvs|nvs|lecturer|professor|faculty|b.ed/.test(t)) exam = "teaching";
  return { category, exam };
}

function slugify(title) {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "post-" + Date.now();
}

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

/* ---------------- fetch RSS ---------------- */
async function fetchRss() {
  const res = await fetch(RSS_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SarkariHaiBot/1.0)" },
  });
  if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status}`);
  const xml = await res.text();

  // minimal XML -> items parse (works for RSS 2.0 without deps)
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

/* ---------------- build posts ---------------- */
function buildPosts(rssItems) {
  return rssItems.slice(0, MAX_POSTS).map((it, i) => {
    const { category, exam } = classify(it.title);
    const d = fmtDate(it.pubDate);
    return {
      id: slugify(it.title) + (i > 0 ? "-" + i : ""),
      title: it.title,
      category,
      exam,
      date: d.sort,
      applyStart: d.pretty,
      applyEnd: "—",
      examDate: "—",
      desc: it.desc || `Latest sarkari notification: ${it.title}. Apply before the deadline.`,
      details: [
        `Posted: ${d.pretty}`,
        "Source: FreeJobAlert (official links on post page)",
        "Verify details on the official website before applying",
      ],
      faqs: [
        { q: `How to apply for ${it.title}?`, a: "Click Apply Online on this page to open the official notification. Read the eligibility criteria carefully and complete your application before the last date." },
        { q: "Where can I find the official notification?", a: "The Download Notification button on this page links to the official announcement with full details including eligibility, fees, and selection process." },
      ],
      links: {
        apply: it.link,
        notification: it.link,
        official: it.link,
      },
    };
  });
}

/* ---------------- main ---------------- */
(async () => {
  try {
    console.log(`[${new Date().toISOString()}] Fetching latest sarkari notifications...`);
    const items = await fetchRss();
    console.log(`Fetched ${items.length} items from RSS`);

    const posts = buildPosts(items);
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    data.posts = posts;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`Updated data/posts.json with ${posts.length} posts`);

    // rebuild
    execSync("node build.js", { cwd: ROOT, stdio: "inherit" });
    console.log("Site regenerated ✓");

    if (NO_PUSH) {
      console.log("--no-push: skipping git commit/push");
      return;
    }

    // copy generated public + data into repo working dir
    const repoDir = process.env.SARKARI_REPO || path.join(ROOT, "..", "Sarkari-hai");
    execSync(`cp -r ${ROOT}/public/* "${repoDir}/" && cp ${DATA_FILE} "${repoDir}/data/"`, { stdio: "inherit" });

    const ssh = process.env.GIT_SSH_CMD || "ssh -i /opt/data/home/.ssh/id_ed25519 -o UserKnownHostsFile=/opt/data/.ssh/known_hosts";
    const stamp = new Date().toISOString().slice(0, 10);
    execSync(`cd "${repoDir}" && git add -A && git commit -m "Daily update: latest sarkari notifications ${stamp}" --allow-empty`, {
      env: { ...process.env, GIT_SSH_COMMAND: ssh },
      stdio: "inherit",
    });
    execSync(`cd "${repoDir}" && git push origin main`, {
      env: { ...process.env, GIT_SSH_COMMAND: ssh },
      stdio: "inherit",
    });
    console.log("Pushed to GitHub ✓ — Pages auto-deploying");
  } catch (e) {
    console.error("UPDATE FAILED:", e.message);
    process.exit(1);
  }
})();
