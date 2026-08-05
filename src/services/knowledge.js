/* ============================================================
   services/knowledge.js — Knowledge Base
   Verified records of recruitment authorities, exam patterns,
   eligibility rules. Reused to keep content consistent.
   Stored in database/knowledge.json (editable, expandable).
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const KB_FILE = path.join(__dirname, "..", "..", "database", "knowledge.json");

const DEFAULT_KB = {
  authorities: [
    { slug: "ssc", name: "Staff Selection Commission", official: "https://ssc.gov.in", exams: ["CGL", "CHSL", "MTS", "CPO", "GD", "Stenographer"] },
    { slug: "upsc", name: "Union Public Service Commission", official: "https://upsc.gov.in", exams: ["CSE (IAS/IPS)", "NDA", "CDS", "IFoS", "CAPF"] },
    { slug: "rrb", name: "Railway Recruitment Boards", official: "https://rrb.indianrailways.gov.in", exams: ["NTPC", "Group D", "ALP", "JE", "RRC"] },
    { slug: "ibps", name: "Institute of Banking Personnel Selection", official: "https://www.ibps.in", exams: ["PO", "Clerk", "SO", "RRB"] },
    { slug: "nta", name: "National Testing Agency", official: "https://nta.ac.in", exams: ["NEET UG", "CUET UG", "JEE Main", "UGC NET"] },
    { slug: "isro", name: "ISRO Centralised Recruitment Board", official: "https://www.isro.gov.in", exams: ["ICRB Assistant/JPA/UDC"] },
    { slug: "aiims", name: "All India Institute of Medical Sciences", official: "https://www.aiims.edu", exams: ["NORCET", "Non-Faculty"] },
  ],
  patterns: {
    ssc_cgl: "Tier-I (CBT) → Tier-II (CBT) → Tier-III (descriptive) → Tier-IV (skill test); negative marking 0.50",
    upsc_cse: "Prelims (GS+CSAT) → Mains (9 papers) → Interview; total 2025 marks",
    ibps_po: "Prelims → Mains → Interview; attempts: 4 general / 7 OBC / unlimited SC-ST",
    rrb_ntpc: "CBT-1 (qualifying) → CBT-2 (merit) → typing/aptitude where applicable",
    neet_ug: "Single CBT, 180 questions (Physics 45, Chemistry 45, Biology 90), +4/-1 marking",
  },
  eligibility_rules: {
    age_relaxation: "OBC +3 years, SC/ST +5 years, PwD +10 years (relative to category) — as per govt rules",
    fee_waiver: "SC/ST/PwD/Ex-Servicemen usually exempt or reduced fee",
    domicile: "Some state exams require domicile certificate of the state",
  },
  salary_structures: {
    level_6: "Pay Level 6 (7th CPC): ₹35,400–₹1,12,400",
    level_4: "Pay Level 4: ₹25,500–₹81,100",
    level_7: "Pay Level 7: ₹44,900–₹1,42,400",
  },
};

function loadKB() {
  try {
    return JSON.parse(fs.readFileSync(KB_FILE, "utf8"));
  } catch {
    fs.mkdirSync(path.dirname(KB_FILE), { recursive: true });
    fs.writeFileSync(KB_FILE, JSON.stringify(DEFAULT_KB, null, 2));
    return DEFAULT_KB;
  }
}

function saveKB(kb) {
  fs.mkdirSync(path.dirname(KB_FILE), { recursive: true });
  fs.writeFileSync(KB_FILE, JSON.stringify(kb, null, 2));
}

/* lookup helpers */
function authority(slug) {
  return loadKB().authorities.find((a) => a.slug === slug);
}
function examPattern(key) {
  return loadKB().patterns[key];
}

module.exports = { loadKB, saveKB, authority, examPattern, KB_FILE };
