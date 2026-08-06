#!/usr/bin/env node
/* ============================================================
   scripts/update-categories.js — restructure categories to
   match the proven sarkariresult organization:
   Latest Jobs, Results, Admit Cards, Answer Keys, Syllabus,
   Admissions, Scholarships, Certificates, Other/Supporting
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "..", "database", "posts.json");
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

data.categories = [
  {
    slug: "latest-jobs",
    label: "Latest Jobs",
    hindi: "सरकारी नौकरी",
    icon: "work",
    desc: "Daily central and state government vacancy notifications — Railway, SSC, UPSC, Banking, Police, Defence, Teaching and state-level (UPSSSC, MPESB). Covers eligibility (10th/12th pass, graduates, higher), application dates, fees, posts and Apply Online links.",
  },
  {
    slug: "results",
    label: "Results",
    hindi: "रिजल्ट",
    icon: "fact_check",
    desc: "Latest exam results, scorecards, merit lists, category-wise cut-offs and marks for major exams and boards.",
  },
  {
    slug: "admit-card",
    label: "Admit Card",
    hindi: "एडमिट कार्ड",
    icon: "badge",
    desc: "Download links for hall tickets, exam city details, exam dates and related notices including postponements.",
  },
  {
    slug: "answer-key",
    label: "Answer Key",
    hindi: "आंसर की",
    icon: "quiz",
    desc: "Official and provisional answer keys with objection windows and exam analysis.",
  },
  {
    slug: "syllabus",
    label: "Syllabus",
    hindi: "सिलेबस",
    icon: "menu_book",
    desc: "Detailed syllabi and exam patterns for various recruitments and entrance exams.",
  },
  {
    slug: "admission",
    label: "Admissions",
    hindi: "प्रवेश",
    icon: "school",
    desc: "Entrance exam updates, counselling and forms — CUET, NEET-related, university admissions, ITI, B.Ed and more.",
  },
  {
    slug: "scholarship",
    label: "Scholarships",
    hindi: "छात्रवृत्ति",
    icon: "school",
    desc: "Scholarship notifications and online forms — UP Scholarship and other state/national schemes.",
  },
  {
    slug: "certificate",
    label: "Certificates",
    hindi: "प्रमाण पत्र",
    icon: "verified_user",
    desc: "Download links for e-certificates — CTET, HTET, UGC NET, CSIR NET and other certificates.",
  },
  {
    slug: "other",
    label: "Other",
    hindi: "अन्य",
    icon: "category",
    desc: "Exam calendars, outsourcing/offline jobs, document verification notices and broader recruitment notifications from Defence, Police, Teaching and PSUs.",
  },
];

/* migrate any posts whose category was renamed or needs mapping */
const VALID = new Set(data.categories.map((c) => c.slug));
const RENAME = { admission: "admission" }; /* no renames needed; all slugs valid */
for (const p of data.posts) {
  if (!VALID.has(p.category)) p.category = "latest-jobs"; /* safe fallback */
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
console.log(`✅ Categories updated: ${data.categories.length} (latest-jobs, results, admit-card, answer-key, syllabus, admission, scholarship, certificate, other)`);
console.log(`   Posts: ${data.posts.length}`);
