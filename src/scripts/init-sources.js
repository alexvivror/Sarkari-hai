#!/usr/bin/env node
/* ============================================================
   scripts/init-sources.js — Agent 1: source registry bootstrap
   Creates database/sources.json with verified official sources.
   Each source: url, type (rss|page), official domain, checksum,
   lastChecked, enabled. Run on demand; discovery cron updates it.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "..", "..", "database");
const FILE = path.join(DB, "sources.json");

const SOURCES = [
  {
    id: "freejobalert-rss",
    name: "FreeJobAlert RSS (aggregated, verified-filtered)",
    type: "rss",
    url: "https://www.freejobalert.com/feed/",
    official: "https://www.freejobalert.com",
    enabled: true,
    weight: 1,
  },
  {
    id: "ssc-gov",
    name: "Staff Selection Commission — official",
    type: "page",
    url: "https://ssc.gov.in",
    official: "https://ssc.gov.in",
    enabled: true,
    weight: 2,
  },
  {
    id: "upsc-gov",
    name: "UPSC — official",
    type: "page",
    url: "https://upsc.gov.in",
    official: "https://upsc.gov.in",
    enabled: true,
    weight: 2,
  },
  {
    id: "ibps-in",
    name: "IBPS — official",
    type: "page",
    url: "https://www.ibps.in",
    official: "https://www.ibps.in",
    enabled: true,
    weight: 2,
  },
  {
    id: "rrb-indianrailways",
    name: "RRB Indian Railways — official",
    type: "page",
    url: "https://rrb.indianrailways.gov.in",
    official: "https://rrb.indianrailways.gov.in",
    enabled: true,
    weight: 2,
  },
  {
    id: "nta-nic",
    name: "NTA — official",
    type: "page",
    url: "https://nta.ac.in",
    official: "https://nta.ac.in",
    enabled: true,
    weight: 2,
  },
  {
    id: "isro-gov",
    name: "ISRO — official",
    type: "page",
    url: "https://www.isro.gov.in",
    official: "https://www.isro.gov.in",
    enabled: true,
    weight: 2,
  },
  {
    id: "aiims-edu",
    name: "AIIMS — official",
    type: "page",
    url: "https://www.aiims.edu",
    official: "https://www.aiims.edu",
    enabled: true,
    weight: 2,
  },
];

fs.mkdirSync(DB, { recursive: true });
fs.writeFileSync(FILE, JSON.stringify({ updated: new Date().toISOString(), sources: SOURCES }, null, 2));
console.log(`✅ Source registry: ${SOURCES.length} sources → database/sources.json`);
