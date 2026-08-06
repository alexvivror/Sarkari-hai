/* ============================================================
   services/notify.js — Agent 9-10: notification service
   - Generates public/feed.xml (RSS 2.0) from posts — subscribers
     can follow the site in any RSS reader
   - Optional Telegram hook (only fires when TELEGRAM_BOT_TOKEN
     and TELEGRAM_CHAT_ID env vars are set — otherwise logs only)
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const { esc } = require("../lib/utils");
const { log } = require("../lib/utils");

function rssFeed(posts, site) {
  const items = posts
    .slice(0, 50)
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${site.domain}/posts/${p.id}.html</link>
      <guid>${site.domain}/posts/${p.id}.html</guid>
      <pubDate>${new Date(p.date + "T00:00:00Z").toUTCString()}</pubDate>
      <description>${esc(p.desc)}</description>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(site.name)} — Latest Sarkari Jobs & Results</title>
    <link>${site.domain}/</link>
    <description>${esc(site.tagline)}. Latest government job notifications, results, admit cards and answer keys — verified official links only.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

function writeRss(posts, site, outDir) {
  fs.writeFileSync(path.join(outDir, "feed.xml"), rssFeed(posts, site));
  log(`RSS feed written → public/feed.xml (${Math.min(posts.length, 50)} items)`);
}

/* Telegram notification — fires only if token+chat configured */
async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    log(`[notify] telegram not configured — would send: ${String(text).slice(0, 90)}`);
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`telegram HTTP ${res.status}`);
    log(`[notify] telegram sent`);
    return true;
  } catch (e) {
    log(`[notify] telegram failed: ${e.message}`);
    return false;
  }
}

module.exports = { rssFeed, writeRss, notifyTelegram };
