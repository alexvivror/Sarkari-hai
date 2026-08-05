#!/usr/bin/env node
/* ============================================================
   cron/hourly.js — hourly background check
   Lightweight: fetches feed, reports how many new verified
   notifications exist. Does NOT publish — daily.js publishes.
   Can be called with --publish to trigger an early publish
   when a major notification appears.
   ============================================================ */
"use strict";

const path = require("path");
const { fetchRss, buildVerifiedPosts } = require("../services/fetch");
const { loadPosts, dedupPosts } = require("../services/content");
const { norm, log, logErr } = require("../lib/utils");

(async () => {
  try {
    const items = await fetchRss();
    const fresh = buildVerifiedPosts(items);
    const data = loadPosts();
    const existing = new Set(data.posts.map((p) => norm(p.title)));

    const isNew = fresh.filter((p) => !existing.has(norm(p.title)));
    log(`Hourly check: ${fresh.length} verified in feed, ${isNew.length} new since last build`);

    // surface major new notifications
    const major = isNew.filter((p) => /(notification|apply|recruitment|result|admit)/i.test(p.title));
    for (const m of major.slice(0, 5)) log(`  NEW: ${m.title.slice(0, 70)} [${m.links.apply}]`);

    if (process.argv.includes("--publish") && isNew.length > 0) {
      log("--publish: triggering early publish");
      const { execSync } = require("child_process");
      execSync(`node ${path.join(__dirname, "daily.js")}`, { stdio: "inherit" });
    }
  } catch (e) {
    logErr("Hourly check failed:", e.message);
    process.exit(1);
  }
})();
