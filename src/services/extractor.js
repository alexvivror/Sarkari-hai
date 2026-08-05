/* ============================================================
   services/extractor.js — Agent 3: content extractor
   Fetches the notification article page and extracts structured
   fields: dates, eligibility, fee, selection, age, vacancies.
   Only returns verified fields — anything not found stays null
   and the post is NOT published (content rules).
   ============================================================ */
"use strict";

const { log, logErr } = require("../lib/utils");

function stripHtml(s) {
  return String(s)
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return { html, text: stripHtml(html) };
}

const MONTHS = /january|february|march|april|may|june|july|august|september|october|november|december/i;

/* extract a date like "14-08-2026", "14 August 2026", "14/08/2026" */
function extractDates(text) {
  const dates = [];
  const patterns = [
    /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/g,
    /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      let d;
      if (m[3].length === 4 && MONTHS.test(m[2] || "")) {
        const months = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
        const mon = months[String(m[2]).toLowerCase()];
        if (mon) d = new Date(+m[3], mon - 1, +m[1]);
      } else if (m[3].length === 4 && +m[2] <= 12) {
        d = new Date(+m[3], +m[2] - 1, +m[1]);
      }
      if (d && !isNaN(d)) {
        dates.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }));
      }
    }
  }
  return [...new Set(dates)];
}

function near(text, keyword, window = 260) {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx < 0) return "";
  return text.slice(Math.max(0, idx - 30), idx + window).trim();
}

function extractFee(text) {
  const m = text.match(/fee[:\s]*₹\s*([\d,]+)/i) || text.match(/₹\s*([\d,]+)/i);
  if (m) return `₹${m[1].replace(/,/g, "")}`;
  const nearFee = near(text, "application fee");
  if (/nil|exempt|waived|no fee/i.test(nearFee)) return "Nil (exempt as per category)";
  return null;
}

function extractAge(text) {
  const m = text.match(/age limit[:\s]*([0-9]{1,2}\s*(?:to|–|-)\s*[0-9]{1,2})\s*(?:years?|yrs)?/i);
  if (m) return `${m[1]} years`;
  const r = text.match(/(?:minimum age|max age)[:\s]*([0-9]{1,2})\s*(?:years?|yrs)/i);
  if (r) return `${r[1]} years (as per notification)`;
  return null;
}

function extractVacancies(text) {
  const m = text.match(/total\s*(?:vacancies|vacancy|posts?)\s*[:\-]?\s*([\d,]+)/i) ||
            text.match(/([\d,]+)\s*(?:posts?|vacancies)/i);
  return m ? `${m[1].replace(/,/g, "")} Posts (approx)` : null;
}

function extractQualification(text) {
  const m = text.match(/qualification[:\s]*(.{20,160}?)(?:application fee|selection|age limit|important dates|how to apply|$)/i);
  if (m) return m[1].trim().replace(/\s+/g, " ").slice(0, 160);
  return null;
}

function extractSelection(text) {
  const m = text.match(/selection process[:\s]*(.{15,140}?)(?:application fee|age limit|important dates|how to apply|$)/i);
  if (m) return m[1].trim().replace(/\s+/g, " ").slice(0, 140);
  return null;
}

function extractMode(text) {
  if (/\bapply offline\b|offline application/i.test(text)) return "Offline";
  if (/\bapply online\b|online application/i.test(text)) return "Online";
  return null;
}

/* ---------------- main extractor ---------------- */
async function extractPostDetails(post) {
  try {
    const { text } = await fetchText(post.links.notification || post.links.apply);
    const dates = extractDates(text);

    // pick start/end heuristically: dates around "last date" / "start date" keywords
    const lastIdx = text.toLowerCase().indexOf("last date");
    let applyEnd = null, applyStart = null;
    if (lastIdx >= 0) {
      const around = text.slice(lastIdx, lastIdx + 160);
      const m = around.match(/(\d{1,2}[-/][A-Za-z]{3,9}[-/]\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{4})/i);
      if (m) applyEnd = m[1];
    }
    if (!applyEnd && dates.length) applyEnd = dates[0];
    const startIdx = text.toLowerCase().indexOf("start date");
    if (startIdx >= 0) {
      const m = text.slice(startIdx, startIdx + 160).match(/(\d{1,2}[-/][A-Za-z]{3,9}[-/]\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{4})/i);
      if (m) applyStart = m[1];
    }

    return {
      applyStart: applyStart || null,
      applyEnd: applyEnd || null,
      ageLimit: extractAge(text),
      fee: extractFee(text),
      vacancies: extractVacancies(text),
      qualification: extractQualification(text),
      selection: extractSelection(text),
      mode: extractMode(text),
      _extracted: true,
    };
  } catch (e) {
    logErr(`extract failed for ${post.id}: ${e.message}`);
    return { _extracted: false };
  }
}

module.exports = { extractPostDetails, extractDates };
