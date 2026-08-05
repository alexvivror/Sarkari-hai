#!/usr/bin/env node
/* ============================================================
   cron/daily.js — daily updater (runs 8 AM IST)
   fetch → verify → dedup → purge+archive → merge curated
   → regenerate site → push to GitHub (CI deploys)
   Usage: node src/cron/daily.js [--no-push]
   ============================================================ */
"use strict";

const path = require("path");
const { execSync } = require("child_process");

const { loadPosts, savePosts, dedupPosts, purgeClosed } = require("../services/content");
const { fetchRss, buildVerifiedPosts, MAX_POSTS } = require("../services/fetch");
const { norm, log, logErr } = require("../lib/utils");

const ROOT = path.join(__dirname, "..", "..");
const NO_PUSH = process.argv.includes("--no-push");

(async () => {
  try {
    log("Daily update started");
    const items = await fetchRss();
    log(`Fetched ${items.length} items from RSS`);

    const fresh = buildVerifiedPosts(items);
    const data = loadPosts();

    // merge curated (hand-verified) + fresh, no duplicates
    const curated = (data.posts || []).filter((p) => p.curated);
    const freshTitles = new Set(fresh.map((p) => norm(p.title)));
    const uniqueCurated = curated.filter((p) => !freshTitles.has(norm(p.title)));
    const maxFresh = Math.max(12, MAX_POSTS - uniqueCurated.length);
    let posts = [...uniqueCurated, ...fresh.slice(0, maxFresh)];

    // dedup + purge closed vacancies (archive them)
    posts = dedupPosts(posts);
    data.posts = posts;
    const purged = purgeClosed(data);

    savePosts(data);
    log(`Posts: ${uniqueCurated.length} curated + ${Math.min(maxFresh, fresh.length)} fresh = ${data.posts.length} (purged+archived: ${purged})`);

    // regenerate site
    execSync("node src/scripts/build.js", { cwd: ROOT, stdio: "inherit" });
    log("Site regenerated");

    if (NO_PUSH) { log("--no-push: skipping git push"); return; }

    // sync generated site to repo ROOT (branch-mode Pages serves root)
    const repoDir = process.env.SARKARI_REPO || path.join(ROOT, "..", "Sarkari-hai");
    const publicDir = path.join(ROOT, "public");
    const dbDir = path.join(ROOT, "database");
    execSync(
      `cp -f ${publicDir}/*.html ${publicDir}/*.css ${publicDir}/*.js ${publicDir}/*.xml ${publicDir}/*.txt "${repoDir}/" 2>/dev/null; ` +
      `mkdir -p "${repoDir}/posts" && cp -f ${publicDir}/posts/* "${repoDir}/posts/" && ` +
      `mkdir -p "${repoDir}/database" && cp -f ${dbDir}/posts.json ${dbDir}/archive.json "${repoDir}/database/"`,
      { stdio: "inherit" }
    );

    const ssh = process.env.GIT_SSH_CMD || "ssh -i /opt/data/home/.ssh/id_ed25519 -o UserKnownHostsFile=/opt/data/.ssh/known_hosts";
    const stamp = new Date().toISOString().slice(0, 10);
    execSync(`cd "${repoDir}" && git config user.email "alexvivror@gmail.com" && git config user.name "Piyush Kumar" && git add -A && git commit -m "Daily update: latest sarkari notifications ${stamp}" --allow-empty`, {
      env: { ...process.env, GIT_SSH_COMMAND: ssh },
      stdio: "inherit",
    });
    execSync(`cd "${repoDir}" && git push origin main`, {
      env: { ...process.env, GIT_SSH_COMMAND: ssh },
      stdio: "inherit",
    });
    log("Pushed to GitHub — auto-deploying");
  } catch (e) {
    logErr("DAILY UPDATE FAILED:", e.message);
    process.exit(1);
  }
})();
