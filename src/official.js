/* ============================================================
   Sarkari Hai — official government domain registry (STRICT)
   Every apply link must be a verified official domain.
   Posts are only auto-matched when the title contains an
   unmistakable exam identifier — otherwise they are skipped.
   ============================================================ */
"use strict";

const OFFICIAL = {
  ssc: {
    name: "Staff Selection Commission",
    apply: "https://ssc.gov.in",
    official: "https://ssc.gov.in",
    // strict: exam body + known exam names
    patterns: [/\bssc\b.*\b(cgl|chsl|mts|cpo|stenographer|gd|je|selection post)\b/i, /\bsarkari result\b/i],
  },
  upsc: {
    name: "UPSC",
    apply: "https://upsc.gov.in",
    official: "https://upsc.gov.in",
    patterns: [/\bupsc\b/i, /\bcivil services\b/i, /\bias (pre|prelims|mains)\b/i, /\bips exam\b/i],
  },
  railway: {
    name: "Indian Railways (RRB)",
    apply: "https://rrb.indianrailways.gov.in/",
    official: "https://rrb.indianrailways.gov.in/",
    patterns: [/\b(rrb|railway)\b/i, /\brrb\b.*\b(ntpc|group d|alp|je|rrc)\b/i],
  },
  bank: {
    name: "IBPS",
    apply: "https://www.ibps.in",
    official: "https://www.ibps.in",
    patterns: [/\bibps\b/i, /\bcrp\b/i, /\b(rbi|sbi) (po|clerk|so)\b/i],
  },
  defence: {
    name: "Indian Army / Defence",
    apply: "https://joinindianarmy.nic.in",
    official: "https://joinindianarmy.nic.in",
    patterns: [/\bagniveer\b/i, /\b(indian army|join indian army|army rally|soldier)\b/i, /\b(air force|navy|nda|cda|afcat)\b/i],
  },
  teaching: {
    name: "CTET / Teaching",
    apply: "https://ctet.nic.in",
    official: "https://ctet.nic.in",
    patterns: [/\bctet\b/i, /\b(tet|htet|utet|uptet|reet)\b/i, /\bkvs (teacher|recruitment)\b/i, /\bnvs (teacher|recruitment)\b/i],
  },
  isro: {
    name: "ISRO",
    apply: "https://www.isro.gov.in/Careers.html",
    official: "https://www.isro.gov.in",
    patterns: [/\bisro\b/i, /\bicrb\b/i],
  },
  ntpc: {
    name: "NTPC",
    apply: "https://ntpc.co.in/",
    official: "https://ntpc.co.in/",
    patterns: [/\bntpc\b/i],
  },
  aiims: {
    name: "AIIMS",
    apply: "https://www.aiims.edu",
    official: "https://www.aiims.edu",
    patterns: [/\baiims\b/i, /\bnorcet\b/i],
  },
  neet: {
    name: "NTA (NEET/CUET/JEE)",
    apply: "https://neet.nta.nic.in",
    official: "https://nta.ac.in",
    patterns: [/\bneet\b/i, /\bcuet\b/i, /\bjee (main|advanced)\b/i, /\bnta\b/i],
  },
  kvs: {
    name: "KVS",
    apply: "https://kvsangathan.nic.in",
    official: "https://kvsangathan.nic.in",
    patterns: [/\bkvs\b/i, /\bkendriya vidyalaya\b/i],
  },
  nvs: {
    name: "NVS",
    apply: "https://navodaya.gov.in",
    official: "https://navodaya.gov.in",
    patterns: [/\bnvs\b/i, /\bnavodaya\b/i],
  },
};

/* ---------- strict matcher ---------- */
/* Returns the single best official entry, or null.
   Order matters: first entry whose pattern matches wins.
   No fuzzy scoring — a match is a match, no match = skip. */
function findOfficial(text) {
  for (const [slug, cfg] of Object.entries(OFFICIAL)) {
    for (const re of cfg.patterns) {
      if (re.test(text)) return { slug, cfg };
    }
  }
  return null;
}

module.exports = { OFFICIAL, findOfficial };
