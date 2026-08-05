/* ============================================================
   services/quality.js — AI Quality Score (0–100 per page)
   Categories: SEO, Performance, Accessibility, Mobile, Trust,
   Readability, Completeness, Freshness, UX.
   Every page gets a score; anything below threshold is flagged
   with a concrete recommendation.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

/* score an HTML file's content */
function scorePage(filePath, pageName) {
  const html = fs.readFileSync(filePath, "utf8");
  const scores = {};
  const issues = [];

  /* SEO */
  let seo = 100;
  if (!/<title>[^<]{10,}<\/title>/.test(html)) { seo -= 25; issues.push("title missing or too short"); }
  if (!/<meta name="description" content=".{30,}">/.test(html)) { seo -= 20; issues.push("meta description missing/short"); }
  if (!/<link rel="canonical"/.test(html)) { seo -= 15; issues.push("canonical missing"); }
  if (!/application\/ld\+json/.test(html)) { seo -= 15; issues.push("JSON-LD schema missing"); }
  if (!/og:title/.test(html)) { seo -= 10; issues.push("Open Graph missing"); }
  if (html.length < 4000) { seo -= 15; issues.push("page too thin"); }
  scores.seo = Math.max(0, seo);

  /* Performance (heuristic) */
  let perf = 100;
  const kb = html.length / 1024;
  if (kb > 80) { perf -= 30; issues.push(`page heavy (${Math.round(kb)}KB)`); }
  else if (kb > 40) { perf -= 10; }
  if ((html.match(/<script/g) || []).length > 6) { perf -= 15; issues.push("too many scripts"); }
  if ((html.match(/<img/g) || []).length > 20) { perf -= 10; issues.push("too many images"); }
  scores.performance = Math.max(0, perf);

  /* Accessibility */
  let a11y = 100;
  const imgs = (html.match(/<img(?![^>]*alt=)[^>]*>/g) || []).length;
  if (imgs) { a11y -= imgs * 5; issues.push(`${imgs} img(s) without alt`); }
  if (!/lang="en"/.test(html)) { a11y -= 15; issues.push("missing lang attribute"); }
  if (!/aria-label|role=/.test(html)) { a11y -= 10; issues.push("few ARIA landmarks"); }
  scores.accessibility = Math.max(0, a11y);

  /* Mobile */
  let mobile = 100;
  if (!/viewport/.test(html)) { mobile -= 40; issues.push("no viewport meta"); }
  if (/width:\s*\d{3,}px/.test(html)) { mobile -= 20; issues.push("fixed pixel widths"); }
  scores.mobile = Math.max(0, mobile);

  /* Trust */
  let trust = 100;
  if (!/\.gov\.in|\.nic\.in/.test(html)) { trust -= 25; issues.push("no official gov links on page"); }
  if (!/verified|official/i.test(html)) { trust -= 15; issues.push("no trust badges"); }
  if (!/disclaimer|not a government/i.test(html)) { trust -= 10; issues.push("missing disclaimer"); }
  scores.trust = Math.max(0, trust);

  /* Completeness */
  let complete = 100;
  if (/undefined/.test(html)) { complete -= 30; issues.push("'undefined' leak found"); }
  if (/href="#"/.test(html)) { complete -= 15; issues.push("placeholder links (#)"); }
  if (/\.\.\/\//.test(html)) { complete -= 15; issues.push("broken relative paths"); }
  scores.completeness = Math.max(0, complete);

  /* Freshness */
  let fresh = 100;
  if (/20\d\d-01-0[1-9]|Updated .*January/.test(html) && !new RegExp(new Date().getFullYear()).test(html)) {
    fresh -= 30; issues.push("content may be stale");
  }
  scores.freshness = fresh;

  /* Readability */
  const words = (html.replace(/<[^>]+>/g, " ").match(/\b\w{3,}\b/g) || []).length;
  let read = 100;
  if (words < 150) { read -= 25; issues.push("too few words for readability"); }
  scores.readability = Math.max(0, read);

  const overall = Math.round(
    (scores.seo + scores.performance + scores.accessibility + scores.mobile +
     scores.trust + scores.completeness + scores.freshness + scores.readability) / 8
  );

  return { page: pageName, overall, scores, issues: [...new Set(issues)] };
}

/* score the entire public/ output */
function auditSite(publicDir) {
  const results = [];
  const walk = (dir, prefix = "") => {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full, prefix + f + "/");
      else if (f.endsWith(".html")) results.push(scorePage(full, prefix + f));
    }
  };
  walk(publicDir);
  return results;
}

module.exports = { scorePage, auditSite };
