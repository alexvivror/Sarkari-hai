/* ============================================================
   services/auditlog.js — Agent 5: version history + audit log
   Records every change to the content database:
   add / update / purge / archive / reject, with timestamps.
   Enables rollback and proves "verified" provenance.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "..", "database", "audit.json");
const MAX_ENTRIES = 2000;

function loadLog() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveLog(log) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(log.slice(-MAX_ENTRIES), null, 2));
}

/* record an event: { action, postId, title, meta } */
function record({ action, postId, title, meta = {} }) {
  const log = loadLog();
  log.push({
    ts: new Date().toISOString(),
    action,
    postId: postId || null,
    title: title ? String(title).slice(0, 80) : null,
    meta,
  });
  saveLog(log);
}

/* get events for a specific post (version history) */
function history(postId) {
  return loadLog().filter((e) => e.postId === postId);
}

module.exports = { record, history, loadLog, saveLog };
