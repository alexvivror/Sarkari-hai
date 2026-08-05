/* ============================================================
   lib/utils.js — shared helpers (escape, dates, slugify)
   ============================================================ */
"use strict";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* normalize for dedup comparison: lowercase, alnum only */
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/* slugify a title for URLs */
function slugify(title) {
  const s = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "post-" + Date.now();
}

/* parse "26 August 2026", "13 September 2026 (tentative)" → Date|null */
function parseDateStr(s) {
  if (!s || s === "—") return null;
  const m = String(s).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const months = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const mon = months[String(m[2]).toLowerCase()];
  if (mon === undefined) return null;
  const dt = new Date(Number(m[3]), mon, Number(m[1]));
  return isNaN(dt) ? null : dt;
}

/* pretty date for the "Updated" badge */
function prettyToday() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

/* days remaining until applyEnd (for countdown feature) */
function daysRemaining(applyEndStr) {
  const end = parseDateStr(applyEndStr);
  if (!end) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
}

/* is this URL a trusted official government/verified domain? */
function isOfficial(url) {
  return /\.gov\.in|\.nic\.in|\.ac\.in|\.edu|ibps\.in|ntpc\.co|isro\.gov|nhpcindia\.com|mumresults\.in|tn-mbamca\.com/i.test(url || "");
}

/* simple async logger with timestamps */
function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}
function logErr(...args) {
  console.error(`[${new Date().toISOString()}] ERROR`, ...args);
}

module.exports = { esc, norm, slugify, parseDateStr, prettyToday, daysRemaining, isOfficial, log, logErr };
