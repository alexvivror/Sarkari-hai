/* ============================================================
   components/ui.js — reusable HTML components
   header, footer, post table, category boxes, free tools,
   sidebar cards, back-to-top
   ============================================================ */
"use strict";

const { esc, isOfficial, daysRemaining } = require("../lib/utils");

/* ---------- header (sticky, search) ---------- */
function header(SITE, active) {
  const nav = [
    ["Latest", "./#latest"],
    ["All Posts", "./all-recruitment.html"],
    ["Jobs", "./latest-jobs.html"],
    ["Results", "./results.html"],
    ["Admit Card", "./admit-card.html"],
  ];
  return `
  <header class="header">
    <div class="header-inner">
      <a href="./" class="brand"><span class="brand-mark">स</span><span>${esc(SITE)}</span></a>
      <nav class="nav">${nav.map(([l, h]) => `<a href="${h}" ${active === l ? 'class="active"' : ""}>${l}</a>`).join("")}</nav>
      <button class="dark-toggle" id="darkToggle" aria-label="Toggle dark mode" title="Toggle dark mode"><span class="material-symbols-outlined" id="darkIcon">dark_mode</span></button>
    </div>
    <form class="searchbar" action="./search.html" method="get" role="search">
      <span class="material-symbols-outlined">search</span>
      <input type="search" name="q" placeholder="Search jobs, results, admit cards..." aria-label="Search">
      <button type="submit" class="search-btn">Search</button>
    </form>
  </header>`;
}

/* ---------- footer ---------- */
function footer(SITE, data) {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4>${esc(SITE)}</h4>
          <p>${esc(data.site.tagline)}. ${esc(data.site.hindi)}.</p>
          <a href="./about.html">About Us</a>
          <a href="./contact.html">Contact</a>
          <a href="./privacy.html">Privacy Policy</a>
          <a href="./disclaimer.html">Disclaimer</a>
        </div>
        <div>
          <h4>Quick Links</h4>
          ${data.categories.map((c) => `<a href="./${c.slug}.html">${esc(c.label)}</a>`).join("")}
        </div>
        <div>
          <h4>Exams</h4>
          ${data.exams.map((e) => `<a href="./exam-${e.slug}.html">${esc(e.label)}</a>`).join("")}
        </div>
        <div>
          <h4>Follow Us</h4>
          <a href="#">Telegram</a>
          <a href="#">WhatsApp</a>
          <a href="#">YouTube</a>
        </div>
      </div>
      <p class="footer-note">⚠️ This site is for information only and is not a government website. Always verify on official government portals. ${esc(SITE)} © <span id="year"></span></p>
    </div>
  </footer>
  <button class="back-top" id="backTop" aria-label="Back to top"><span class="material-symbols-outlined">arrow_upward</span></button>
  <script>
    document.getElementById("year").textContent=new Date().getFullYear();
    (function(){
      var bt=document.getElementById("backTop");
      if(bt){
        var on=function(){bt.classList.toggle("show",(window.scrollY||document.documentElement.scrollTop)>400);};
        window.addEventListener("scroll",on,{passive:true});on();
        bt.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});
      }
      // dark mode toggle (remembers choice)
      var dt=document.getElementById("darkToggle"), di=document.getElementById("darkIcon");
      if(dt){
        var apply=function(dark){
          document.documentElement.classList.toggle("dark",dark);
          if(di) di.textContent=dark?"light_mode":"dark_mode";
          try{localStorage.setItem("sh-dark",dark?"1":"0");}catch(e){}
        };
        var saved=null;try{saved=localStorage.getItem("sh-dark");}catch(e){}
        if(saved!==null) apply(saved==="1");
        else apply(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);
        dt.addEventListener("click",function(){apply(!document.documentElement.classList.contains("dark"));});
      }
    })();
  </script>`;
}

/* ---------- post row (table) ---------- */
function postRow(p, byCat, byExam) {
  const cat = byCat[p.category];
  const off = isOfficial(p.links?.apply);
  const days = daysRemaining(p.applyEnd);
  return `<tr class="post-row cat-${p.category} exam-${p.exam}">
    <td class="post-name">
      <a href="./posts/${p.id}.html" class="post-title">${esc(p.title)}</a>
      ${off ? '<span class="official-tag" title="Links to official government website">✔ Official</span>' : ""}
      ${days !== null && days >= 0 && days <= 14 ? `<span class="countdown-tag">${days === 0 ? "Last day!" : days + "d left"}</span>` : ""}
      <span class="post-meta">
        <span class="chip-sm ${p.category}">${esc(cat ? cat.label : p.category)}</span>
        <span class="chip-sm">${esc(byExam[p.exam] ? byExam[p.exam].label : p.exam)}</span>
        <span class="chip-sm">${esc(p.examDate || "—")}</span>
      </span>
    </td>
    <td class="post-dates">
      <span class="dates"><b>Start:</b> ${esc(p.applyStart || "—")}</span>
      <span class="dates"><b>End:</b> ${esc(p.applyEnd || "—")}</span>
    </td>
    <td class="post-actions">
      <a class="act-btn primary" href="${esc(p.links.apply)}" target="_blank" rel="noopener nofollow">Apply Online</a>
      <a class="act-btn" href="${esc(p.links.notification)}" rel="noopener nofollow">Notification</a>
      <a class="act-btn ghost" href="${esc(p.links.official)}" target="_blank" rel="noopener nofollow">Official Site</a>
    </td>
  </tr>`;
}

/* ---------- full post table ---------- */
function postTable(posts, byCat, byExam) {
  return `<div class="table-wrap"><table class="post-table">
    <thead><tr><th>Post Name</th><th>Important Dates</th><th>Links</th></tr></thead>
    <tbody>${posts.map((p) => postRow(p, byCat, byExam)).join("\n")}</tbody>
  </table></div>`;
}

/* ---------- category boxes ---------- */
function catBoxes(categories, posts) {
  return categories
    .map((c) => {
      const items = posts.filter((p) => p.category === c.slug).slice(0, 5);
      return `<div class="cat-box">
        <h3><span class="material-symbols-outlined">${c.icon}</span> ${esc(c.label)} <small>${esc(c.hindi)}</small></h3>
        <ul>${items.map((p) => `<li><a href="./posts/${p.id}.html">${esc(p.title)}</a></li>`).join("")}</ul>
        <a class="more" href="./${c.slug}.html">View All →</a>
      </div>`;
    })
    .join("\n");
}

/* ---------- free tools strip ---------- */
function freeTools(tools) {
  return `
  <section class="container tools-strip">
    <h2 class="tools-strip-title"><span class="material-symbols-outlined">handyman</span> Free Tools <small>useful for every job seeker</small></h2>
    <div class="tools-grid">
      ${tools
        .map((t) => `<a class="tool-mini" href="${t.href}" target="_blank" rel="noopener"><span class="material-symbols-outlined">${t.icon}</span><div><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></div></a>`)
        .join("\n")}
    </div>
  </section>`;
}

/* ---------- sidebar ---------- */
function sidebar(examChips, trendingChips) {
  return `
    <aside class="side-col">
      <div class="card side-card">
        <h3><span class="material-symbols-outlined">groups</span> Join Our Channels</h3>
        <a class="channel telegram" href="#"><span class="material-symbols-outlined">send</span> Telegram Channel</a>
        <a class="channel whatsapp" href="#"><span class="material-symbols-outlined">chat</span> WhatsApp Group</a>
        <a class="channel youtube" href="#"><span class="material-symbols-outlined">play_circle</span> YouTube</a>
      </div>
      <div class="card side-card">
        <h3><span class="material-symbols-outlined">school</span> Exams</h3>
        <div class="chips">${examChips}</div>
      </div>
      <div class="card side-card">
        <h3><span class="material-symbols-outlined">trending_up</span> Trending Searches</h3>
        <div class="chips">${trendingChips}</div>
      </div>
      <div class="ad-slot" data-ad="sidebar"><span>Advertisement</span></div>
    </aside>`;
}

/* ---------- app banner ---------- */
function appBanner(SITE) {
  return `
  <section class="container">
    <div class="app-banner">
      <div class="app-info">
        <span class="app-icon material-symbols-outlined">smartphone</span>
        <div><h3>Get ${esc(SITE)} on your phone</h3><p>Instant job alerts, results &amp; admit cards — download the free app.</p></div>
      </div>
      <a class="app-btn" href="#"><span class="material-symbols-outlined">download</span> Download App</a>
    </div>
  </section>`;
}

module.exports = { header, footer, postRow, postTable, catBoxes, freeTools, sidebar, appBanner };
