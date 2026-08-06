#!/usr/bin/env node
/* ============================================================
   cron/hourly.js — MASTER ORCHESTRATOR (Agents 1–12)
   Runs every hour:
   1. Crawl enabled sources (checksum change detection)
   2. Extract structured details from changed articles
   3. Build candidate posts (verified official domains only)
   4. Classify with confidence scoring (95+ publish / 80–94 review / <80 reject)
   5. Dedup + purge closed vacancies + audit log
   6. Rebuild site + RSS feed
   7. Notify (Telegram if configured)
   Usage: node src/cron/hourly.js [--publish] [--no-push]
   ============================================================ */
"use strict";

const path = require("path");
const { execSync } = require("child_process");

const { checkAllSources } = require("../services/sources");
const { fetchRss, buildVerifiedPosts } = require("../services/fetch");
const { extractPostDetails } = require("../services/extractor");
const { loadPosts, savePosts, dedupPosts, purgeClosed, STANDARD_DOCUMENTS, checkCompleteness } = require("../services/content");
const { classify, loadReview, saveReview } = require("../services/verifier");
const { record } = require("../services/auditlog");
const { writeRss, notifyTelegram } = require("../services/notify");
const { norm, log, logErr } = require("../lib/utils");

const ROOT = path.join(__dirname, "..", "..");
const PUBLIC = path.join(ROOT, "public");
const PUBLISH = process.argv.includes("--publish");
const NO_PUSH = process.argv.includes("--no-push");

async function main() {
  log("═══ HOURLY ORCHESTRATION START ═══");

  /* ---- 1. crawl sources (Agent 1+2) ---- */
  const changed = await checkAllSources();
  log(`Sources checked; ${changed.length} changed since last run`);

  /* ---- 2. fetch RSS candidates (Agent 2) ---- */
  let candidates = [];
  try {
    const items = await fetchRss();
    candidates = buildVerifiedPosts(items);
    log(`RSS: ${items.length} raw → ${candidates.length} verified-domain candidates`);
  } catch (e) {
    logErr(`RSS fetch failed: ${e.message}`);
  }

  /* ---- 3. extract structured details (Agent 3) ---- */
  const extracted = [];
  for (const c of candidates.slice(0, 12)) {
    const details = await extractPostDetails(c);
    Object.assign(c, details);
    extracted.push(c);
  }
  const extractedOk = extracted.filter((c) => c._extracted).length;
  log(`Extraction: ${extractedOk}/${extracted.length} articles parsed`);

  /* ---- 4. classify with confidence (Agent 4) ---- */
  const sources = require("../services/sources").loadSources();
  const { publish, review, reject } = classify(extracted, sources);
  log(`Classified: ${publish.length} publish / ${review.length} review / ${reject.length} reject`);
  for (const r of reject) log(`  REJECT (not publishable): ${r.title.slice(0, 60)}`);
  for (const r of review) log(`  REVIEW QUEUE: ${r.title.slice(0, 60)}`);

  /* ---- 5. merge, dedup, purge, audit (Agent 5) ---- */
  const data = loadPosts();

  // completeness gate: only auto-publish fully-complete posts;
  // verified-but-incomplete → review queue (human completes)
  const autoPublish = [];
  const needsReview = [];
  for (const p of publish) {
    p.documents = p.documents || STANDARD_DOCUMENTS;
    const problems = checkCompleteness(p);
    if (problems.length) {
      p.confidence = 80;
      needsReview.push(p);
      log(`  → review (incomplete): ${p.title.slice(0, 60)} [${problems.join("; ")}]`);
    } else {
      autoPublish.push(p);
    }
  }
  if (needsReview.length) {
    const { saveReview } = require("../services/verifier");
    const q = loadReview();
    saveReview([...q, ...needsReview.map((p) => ({ ...p, addedAt: new Date().toISOString() }))]);
  }

  /* ---- 5b. self-clean review queue: drop stale / duplicate / wrong-board items ---- */
  try {
    const q = loadReview();
    const posts = (data.posts || []).map((p) => norm(p.title));
    const today = new Date().toISOString().slice(0, 10);
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const parseDate = (s) => {
      if (!s || s === "—") return null;
      const m = String(s).match(/(\d{1,2})\s*[-\/]\s*(\d{1,2})\s*[-\/]\s*(\d{4})/);
      if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      const m2 = String(s).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
      if (m2 && months[m2[2].slice(0, 3).toLowerCase()]) return new Date(+m2[3], months[m2[2].slice(0, 3).toLowerCase()] - 1, +m2[1]);
      return null;
    };
    const before = q.length;
    const seen = new Set();
    const kept = q.filter((it) => {
      const t = norm(it.title);
      if (seen.has(t) || posts.includes(t)) return false;
      seen.add(t);
      const end = parseDate(it.applyEnd);
      if (end && end < new Date(today + "T00:00:00")) return false;
      const link = ((it.links || {}).apply || (it.links || {}).notification || "").toLowerCase();
      if (t.includes("htet") && link.includes("ctet.nic.in")) return false; // wrong board
      return true;
    });
    if (kept.length < before) {
      saveReview(kept);
      log(`Review queue self-clean: ${before} → ${kept.length} (removed stale/dupes/wrong-board)`);
    }
  } catch (e) {
    logErr("Review self-clean failed:", e.message);
  }

  // keep ALL existing posts (curated + previously auto-published);
  // only add NEW verified auto-publishable posts (no duplicates)
  const freshTitles = new Set(autoPublish.map((p) => norm(p.title)));
  const keptExisting = (data.posts || []).filter((p) => !freshTitles.has(norm(p.title)));
  const merged = dedupPosts([...keptExisting, ...autoPublish]);
  data.posts = merged;

  for (const p of autoPublish) record({ action: "add", postId: p.id, title: p.title, meta: { source: "rss-auto" } });

  const purged = purgeClosed(data);
  if (purged) log(`Purged+archived ${purged} closed vacancies`);
  savePosts(data);

  /* ---- 6. rebuild site + RSS (Agent 6-9) ---- */
  execSync(`node ${path.join(ROOT, "src", "scripts", "build.js")}`, { cwd: ROOT, stdio: "inherit" });
  writeRss(data.posts, data.site, PUBLIC);
  log("Site + RSS rebuilt");

  /* ---- 7. notify (Agent 10) ---- */
  if (autoPublish.length) {
    await notifyTelegram(`🆕 ${autoPublish.length} new verified sarkari job update(s) on ${data.site.name}:\n${autoPublish.slice(0, 5).map((p) => `• ${p.title.slice(0, 70)}`).join("\n")}\n\n${data.site.domain}`);
  }

  /* ---- 8. push (deploy) ---- */
  if (NO_PUSH) { log("--no-push: skipping git"); return; }
  const repoDir = process.env.SARKARI_REPO || path.join(ROOT, "..", "Sarkari-hai");
  const dbDir = path.join(ROOT, "database");
  execSync(
    `cp -f ${PUBLIC}/*.html ${PUBLIC}/*.css ${PUBLIC}/*.js ${PUBLIC}/*.xml ${PUBLIC}/*.txt "${repoDir}/" 2>/dev/null; ` +
    `mkdir -p "${repoDir}/posts" && cp -f ${PUBLIC}/posts/* "${repoDir}/posts/" && ` +
    `mkdir -p "${repoDir}/database" && cp -f ${dbDir}/*.json "${repoDir}/database/"`,
    { stdio: "inherit" }
  );
  const ssh = process.env.GIT_SSH_CMD || "ssh -i /opt/data/home/.ssh/id_ed25519 -o UserKnownHostsFile=/opt/data/.ssh/known_hosts";
  const stamp = new Date().toISOString().slice(0, 16);

  /* ONLY push if something actually changed — an empty commit every hour
     cancels the in-flight GitHub Pages deploy and keeps the live site stale. */
  const changedCount = execSync(`cd "${repoDir}" && git status --porcelain | wc -l`, { encoding: "utf8" }).trim();
  if (Number(changedCount) === 0) {
    log("No changes — skipping push (avoids cancelling the live deploy)");
    return;
  }
  execSync(`cd "${repoDir}" && git config user.email "alexvivror@gmail.com" && git config user.name "Piyush Kumar" && git add -A && git commit -m "Hourly sync ${stamp}: +${autoPublish.length} new / ${review.length} review"`, {
    env: { ...process.env, GIT_SSH_COMMAND: ssh }, stdio: "inherit",
  });
  execSync(`cd "${repoDir}" && git push origin main`, { env: { ...process.env, GIT_SSH_COMMAND: ssh }, stdio: "inherit" });
  log("Pushed → auto-deploy");
}

main().catch((e) => { logErr("HOURLY FAILED:", e); process.exit(1); });
