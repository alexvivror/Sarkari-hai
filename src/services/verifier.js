/* ============================================================
   services/verifier.js — Agent 4: confidence scoring
   Every candidate post gets a 0–100 confidence score:
     95+  → AUTO-PUBLISH
     80–94 → REVIEW QUEUE (database/review.json) — needs human
     <80  → REJECT (never published)
   Score factors: official domain, field completeness, source
   weight, duplicate distance, extraction success.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const { isOfficial, log } = require("../lib/utils");
const { checkCompleteness, missingFields, REQUIRED_FIELDS } = require("./content");

const REVIEW_FILE = path.join(__dirname, "..", "..", "database", "review.json");

function loadReview() {
  try {
    return JSON.parse(fs.readFileSync(REVIEW_FILE, "utf8"));
  } catch {
    return [];
  }
}
function saveReview(items) {
  fs.mkdirSync(path.dirname(REVIEW_FILE), { recursive: true });
  fs.writeFileSync(REVIEW_FILE, JSON.stringify(items, null, 2));
}

  /* ---------------- scoring ---------------- */
function scorePost(post, ctx = {}) {
  let score = 0;

  /* 1. Official domain — hard gate */
  if (!isOfficial(post.links?.apply)) return { score: 0, verdict: "reject", reasons: ["apply link not official"] };
  score += 40;

  /* 2. Extraction success (agent 3 parsed the article) / curated */
  const verified = post._extracted || post.curated;
  if (post._extracted) score += 40;
  else if (post.curated) score += 35;

  /* 3. Source weight */
  score += Math.min(10, (ctx.weight || 1) * 5);

  /* 4. Field completeness — deduction for blanks */
  const missing = missingFields(post);
  score -= missing.length * 1.5;

  /* 5. Duplicate distance */
  score += Math.max(0, Math.min(10, (ctx.dupDistance ?? 1) * 10));

  /* 6. Full completeness bonus → auto-publish */
  if (missing.length === 0 && verified) score += 15;

  score = Math.round(Math.min(100, Math.max(0, score)));

  /* verdicts:
     - REJECT: not official OR no verification possible (nothing extracted, not curated)
     - REVIEW: verified-official but incomplete — human completes it (never lost)
     - PUBLISH: verified + complete */
  let verdict;
  if (!verified) verdict = "reject";
  else if (score >= 95 && missing.length === 0) verdict = "publish";
  else if (score >= 80) verdict = "review";
  else verdict = "review"; // verified official always reviewable, never silently dropped

  return { score, verdict, reasons: missing.length ? [`blank: ${missing.join(", ")}`] : [] };
}

/* ---------------- pipeline ---------------- */
/* Returns { publish: [], review: [], reject: [] } */
function classify(posts, sources) {
  const out = { publish: [], review: [], reject: [] };
  for (const p of posts) {
    const src = sources.find((s) => s.id === p.sourceId) || { weight: 1 };
    const r = scorePost(p, { weight: src.weight, dupDistance: p._dupDistance ?? 1 });
    if (r.verdict === "publish") out.publish.push(p);
    else if (r.verdict === "review") {
      p.confidence = r.score;
      out.review.push(p);
    } else out.reject.push(p);
  }
  if (out.review.length) {
    const q = loadReview();
    saveReview([...q, ...out.review.map((p) => ({ ...p, addedAt: new Date().toISOString() }))]);
    log(`review queue: +${out.review.length} awaiting human approval`);
  }
  return out;
}

module.exports = { scorePost, classify, loadReview, saveReview, REQUIRED_FIELDS };
