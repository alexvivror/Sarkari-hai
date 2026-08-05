/* ============================================================
   services/content.js — content management
   - load/save posts + archive
   - validation (required fields for verified posts)
   - dedup (no duplicate posts)
   - auto-purge closed vacancies after final result
   - archive expired posts to database/archive.json
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const { norm, parseDateStr, isOfficial, log } = require("../lib/utils");

const DB_DIR = path.join(__dirname, "..", "..", "database");
const DATA_FILE = path.join(DB_DIR, "posts.json");
const ARCHIVE_FILE = path.join(DB_DIR, "archive.json");

/* ---------- IO ---------- */
function loadPosts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { site: {}, categories: [], exams: [], posts: [] };
  }
}

function savePosts(data) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function loadArchive() {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVE_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveArchive(entries) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(entries, null, 2));
}

/* ---------- validation ---------- */
/* A verified post must have official links; unverified posts are dropped */
function validatePost(p) {
  const problems = [];
  if (!p.title) problems.push("missing title");
  if (!p.category) problems.push("missing category");
  if (!p.links || !isOfficial(p.links.apply)) problems.push("apply link not official");
  if (!p.desc) problems.push("missing description");
  return problems;
}

/* REQUIRED fields — every published post must have ALL of these filled.
   Nothing blank. Posts missing required fields are not publishable. */
const REQUIRED_FIELDS = [
  "title", "org", "postName", "vacancies", "salary", "mode",
  "applyStart", "applyEnd", "examDate", "ageLimit", "qualification",
  "fee", "selection", "documents", "desc", "official",
];

const BLANK = (v) => v === undefined || v === null || v === "" || v === "—";

function missingFields(p) {
  return REQUIRED_FIELDS.filter((f) => BLANK(p[f]));
}

/* completeness check — returns missing field list (empty = publishable) */
function checkCompleteness(p) {
  const missing = missingFields(p);
  const problems = [];
  if (missing.length) problems.push(`blank fields: ${missing.join(", ")}`);
  if (!p.details || p.details.length === 0) problems.push("blank details list");
  if (!p.faqs || p.faqs.length === 0) problems.push("blank FAQs");
  if (!p.links || !isOfficial(p.links.apply)) problems.push("apply link not official");
  return problems;
}

/* standard required documents for government job applications */
const STANDARD_DOCUMENTS = [
  "Recent passport-size photograph",
  "Scanned signature",
  "Photo ID proof (Aadhaar / PAN / Voter ID / Passport)",
  "Educational qualification certificates & mark sheets",
  "Category certificate (SC/ST/OBC/EWS), if applicable",
  "Date of birth proof (10th certificate / birth certificate)",
  "Experience / employment certificate (if required by the post)",
];

/* ---------- dedup ---------- */
function dedupPosts(posts) {
  const seen = new Set();
  const out = [];
  let dropped = 0;
  for (const p of posts) {
    const key = norm(p.title);
    if (seen.has(key)) { dropped++; continue; }
    seen.add(key);
    out.push(p);
  }
  if (dropped) log(`dedup: dropped ${dropped} duplicate post(s)`);
  return out;
}

/* ---------- purge + archive ---------- */
/* A vacancy post is removed (and archived) when its apply window has closed
   AND the final result is declared. Result/admit/answer posts stay. */
function purgeClosed(data) {
  const today = new Date();
  const archived = loadArchive();
  const kept = [];
  let purged = 0;

  for (const p of data.posts) {
    const isVacancy = p.category === "latest-jobs";
    const end = parseDateStr(p.applyEnd);
    const resultOut = /declared|released|final result|result out|selected|provisional/i.test(p.examDate || "") || p.category === "results";

    if (isVacancy && end && end < today && resultOut) {
      purged++;
      archived.push({ ...p, archivedAt: new Date().toISOString(), reason: "closed-after-final-result" });
      log(`PURGED+ARCHIVED: ${p.id} — ${String(p.title).slice(0, 50)}`);
    } else {
      kept.push(p);
    }
  }

  saveArchive(archived);
  data.posts = kept;
  return purged;
}

module.exports = {
  DB_DIR, DATA_FILE, ARCHIVE_FILE,
  loadPosts, savePosts, loadArchive, saveArchive,
  validatePost, checkCompleteness, missingFields, STANDARD_DOCUMENTS,
  dedupPosts, purgeClosed,
};
