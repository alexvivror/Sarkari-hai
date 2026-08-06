/* ============================================================
   services/sources.js — Agent 1: source registry service
   - load/save database/sources.json
   - fetch a source and compute content checksum (change detection)
   - mark checksum + lastChecked so the crawler only reprocesses
     sources that changed since the last run
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { log, logErr } = require("../lib/utils");

const FILE = path.join(__dirname, "..", "..", "database", "sources.json");

function loadSources() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")).sources || [];
  } catch {
    return [];
  }
}

function saveSources(sources) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ updated: new Date().toISOString(), sources }, null, 2));
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
}

/* fetch source content (RSS XML or HTML) with timeout */
async function fetchSource(src) {
  const res = await fetch(src.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SarkariHaiBot/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* check whether a source changed since last check; update state */
async function checkSource(src) {
  try {
    const content = await fetchSource(src);
    const sum = sha256(content);
    const changed = src.lastChecksum !== sum;
    src.lastChecksum = sum;
    src.lastChecked = new Date().toISOString();
    src.lastStatus = "ok";
    src.lastSize = content.length;
    return { src, changed, content };
  } catch (e) {
    src.lastChecked = new Date().toISOString();
    src.lastStatus = "error";
    src.lastError = e.message;
    logErr(`source ${src.id} error: ${e.message}`);
    return { src, changed: false, content: null, error: e.message };
  }
}

/* run all enabled sources, return those that changed */
async function checkAllSources() {
  const sources = loadSources();
  const results = [];
  for (const src of sources) {
    if (!src.enabled) continue;
    const r = await checkSource(src);
    if (r.changed && r.content) results.push(r);
  }
  saveSources(sources);
  return results;
}

module.exports = { loadSources, saveSources, checkSource, checkAllSources, sha256 };
