#!/usr/bin/env node
/* ============================================================
   tests/run.js — automated tests (QA gate)
   Usage: node tests/run.js
   Exits non-zero on any failure.
   ============================================================ */
"use strict";

const { findOfficial } = require("../src/services/official");
const { loadPosts, dedupPosts, purgeClosed, validatePost } = require("../src/services/content");
const { norm, parseDateStr, daysRemaining, isOfficial } = require("../src/lib/utils");

let pass = 0, fail = 0;
const t = (name, cond) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
};

console.log("═══ OFFICIAL DOMAIN MATCHING ═══");
t("RRB JE → railway", findOfficial("RRB JE 04/2026 Recruitment")?.slug === "railway");
t("IBPS Clerk → bank", findOfficial("IBPS Clerk Recruitment 2026 (CRP CSA-XVI)")?.slug === "bank");
t("UPSC IAS → upsc", findOfficial("UPSC IAS Pre 2026 Notification")?.slug === "upsc");
t("NEET UG → neet", findOfficial("NEET UG 2027 Admit Card")?.slug === "neet");
t("ISRO ICRB → isro", findOfficial("ISRO ICRB Recruitment 2026")?.slug === "isro");
t("NTPC → ntpc (not railway)", findOfficial("NTPC Deputy Manager Recruitment 2026")?.slug === "ntpc");
t("AIIMS → aiims", findOfficial("AIIMS Non Faculty Recruitment 2026")?.slug === "aiims");
t("'Project' does NOT match railway (word-boundary bug)", findOfficial("IIT Delhi Project Research Scientist 2026") === null);
t("District Court → null (no official match, skip)", findOfficial("District Court Cuttack Recruitment 2026") === null);
t("Union Bank SO → null (not IBPS)", findOfficial("Union Bank of India SO Recruitment 2026") === null);

console.log("═══ UTILITIES ═══");
t("parseDateStr '26 August 2026'", parseDateStr("26 August 2026")?.getDate() === 26);
t("parseDateStr tentative", parseDateStr("13 September 2026 (tentative)")?.getMonth() === 8);
t("daysRemaining future > 0", (daysRemaining("30 September 2026") ?? -1) > 0);
t("isOfficial gov.in", isOfficial("https://ssc.gov.in"));
t("isOfficial rejects aggregator", !isOfficial("https://freejobalert.com/x"));
t("norm strips punctuation", norm("SSC CGL 2026!") === "ssccgl2026");

console.log("═══ CONTENT VALIDATION ═══");
const data = loadPosts();
t("posts.json loads", Array.isArray(data.posts) && data.posts.length > 0);
const bad = data.posts.filter((p) => validatePost(p).length > 0);
t(`all ${data.posts.length} posts have official apply links (${bad.length} bad)`, bad.length === 0);

const titles = data.posts.map((p) => norm(p.title));
t("no duplicate posts", new Set(titles).size === titles.length);

console.log("═══ DEDUP + PURGE ═══");
const deduped = dedupPosts([...data.posts, ...data.posts.slice(0, 2)]);
t("dedup removes exact duplicates", deduped.length === data.posts.length);

// purge test with a fake closed post (must not mutate real data file)
const fake = { ...data, posts: [...data.posts, {
  id: "zz-test-closed", title: "ZZ Test Closed 2026 Final Result Declared",
  category: "latest-jobs", exam: "ssc", date: "2026-01-01",
  applyStart: "01 January 2026", applyEnd: "15 January 2026", examDate: "Final Result Declared",
  desc: "test", details: [], faqs: [],
  links: { apply: "https://ssc.gov.in", notification: "https://ssc.gov.in", official: "https://ssc.gov.in" },
}]};
const purged = purgeClosed(JSON.parse(JSON.stringify(fake)));
t("purge removes closed+result-declared vacancy", purged === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
