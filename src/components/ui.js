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
    ["Saved", "./saved-jobs.html"],
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
      // PWA install + offline
      if("serviceWorker" in navigator){
        window.addEventListener("load",function(){
          navigator.serviceWorker.register("./sw.js").catch(function(){});
        });
      }
      // install prompt
      var deferredPrompt=null;
      window.addEventListener("beforeinstallprompt",function(e){
        e.preventDefault(); deferredPrompt=e;
        var btn=document.getElementById("installBtn");
        if(btn) btn.style.display="inline-flex";
      });
      // saved jobs (localStorage bookmarks)
      window.shSaved=function(){try{return JSON.parse(localStorage.getItem("sh-saved")||"[]");}catch(e){return [];}};
      window.shToggleSave=function(id){
        var s=window.shSaved(),i=s.indexOf(id);
        if(i>=0)s.splice(i,1);else s.push(id);
        try{localStorage.setItem("sh-saved",JSON.stringify(s));}catch(e){}
        var b=document.querySelector('[data-save="'+id+'"]');
        if(b){b.classList.toggle("saved",i<0);b.querySelector("span").textContent=i<0?"bookmark_added":"bookmark_add";}
        return i<0;
      };
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

/* ---------- post card (clean LinkedIn-style card) ---------- */
function postCard(p, byCat, byExam) {
  const cat = byCat[p.category];
  const exam = byExam[p.exam];
  const off = isOfficial(p.links?.apply);
  const days = daysRemaining(p.applyEnd);
  const deadline = days !== null && days >= 0;
  const isNew = p.date && p.date >= new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  return `
  <article class="job-card cat-${p.category} exam-${p.exam}">
    <div class="job-card-top">
      <span class="job-cat ${p.category}"><span class="material-symbols-outlined">${cat.icon}</span></span>
      <div class="job-card-head">
        <a href="./posts/${p.id}.html" class="job-title">${esc(p.title)}</a>
        <div class="job-sub">${esc(exam.label)} <span class="dot">·</span> ${esc(cat.label)}</div>
        <div class="job-chips">
          ${isNew ? '<span class="pill new">New</span>' : ""}
          ${off ? '<span class="pill verified">✓ Verified</span>' : ""}
          ${p.status === "expected" ? '<span class="pill expected">Expected</span>' : ""}
          ${deadline ? `<span class="pill deadline">${days === 0 ? "Last day!" : days + " days left"}</span>` : ""}
        </div>
      </div>
    </div>
    <div class="job-card-foot">
      <div class="job-date">
        <span class="jd-label">Last date</span>
        <span class="jd-value">${esc(p.applyEnd || "—")}</span>
      </div>
      <div class="job-actions">
        <a class="btn-solid" href="${esc(p.links.apply)}" target="_blank" rel="noopener nofollow">Apply</a>
      </div>
    </div>
  </article>`;
}

/* ---------- full post card grid ---------- */
function postCardGrid(posts, byCat, byExam) {
  return `<div class="job-grid">${posts.map((p) => postCard(p, byCat, byExam)).join("\n")}</div>`;
}

/* ---------- category tiles (new gradient tile design) ---------- */
function catBoxes(categories, posts) {
  return categories
    .map((c) => {
      const count = posts.filter((p) => p.category === c.slug).length;
      return `<a class="cat-tile" data-cat="${c.slug}" href="./${c.slug}.html">
        <span class="tile-icon"><span class="material-symbols-outlined">${c.icon}</span></span>
        <b>${esc(c.label)}</b>
        <small>${esc(c.hindi)}</small>
        <span class="tile-count">${count}</span>
      </a>`;
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

/* ---------- exam-criteria tools (age limit, marks %, CGPA) ---------- */
function examTools() {
  return `
  <section class="container exam-tools" id="exam-tools">
    <h2 class="tools-strip-title"><span class="material-symbols-outlined">fact_check</span> Exam Eligibility Tools <small>check your criteria instantly</small></h2>
    <div class="exam-tools-grid">

      <div class="etool card">
        <h3><span class="material-symbols-outlined">cake</span> Age Limit Checker</h3>
        <p class="etool-desc">Enter your date of birth and the exam's age limit — see if you qualify.</p>
        <div class="field"><label for="et-dob">Date of Birth</label><input type="date" id="et-dob"></div>
        <div class="field-row">
          <div class="field"><label for="et-min">Min age</label><input type="number" id="et-min" value="18" min="0"></div>
          <div class="field"><label for="et-max">Max age</label><input type="number" id="et-max" value="32" min="0"></div>
        </div>
        <button class="btn" onclick="checkAgeLimit()">Check Eligibility</button>
        <div class="result" id="et-age-r" hidden></div>
      </div>

      <div class="etool card">
        <h3><span class="material-symbols-outlined">percent</span> Marks Percentage</h3>
        <p class="etool-desc">Calculate your percentage — needed for eligibility &amp; cutoffs.</p>
        <div class="field"><label for="et-marks">Marks obtained</label><input type="number" id="et-marks" placeholder="e.g. 412"></div>
        <div class="field"><label for="et-total">Total marks</label><input type="number" id="et-total" placeholder="e.g. 500"></div>
        <button class="btn" onclick="calcMarksPct()">Calculate %</button>
        <div class="result" id="et-pct-r" hidden></div>
      </div>

      <div class="etool card">
        <h3><span class="material-symbols-outlined">school</span> CGPA → Percentage</h3>
        <p class="etool-desc">Convert CGPA to percentage — many exams require minimum %.</p>
        <div class="field"><label for="et-cgpa">Your CGPA</label><input type="number" id="et-cgpa" step="0.01" placeholder="e.g. 7.8"></div>
        <div class="field"><label for="et-scale">Scale</label><select id="et-scale"><option value="10">Out of 10</option><option value="4">Out of 4</option></select></div>
        <button class="btn" onclick="calcCgpa()">Convert</button>
        <div class="result" id="et-cgpa-r" hidden></div>
      </div>

      <div class="etool card">
        <h3><span class="material-symbols-outlined">payments</span> Application Fee</h3>
        <p class="etool-desc">Estimate exam application fees for your category.</p>
        <div class="field"><label for="et-fee-gen">General/OBC fee (₹)</label><input type="number" id="et-fee-gen" placeholder="e.g. 100"></div>
        <div class="field"><label for="et-fee-res">SC/ST/PwD fee (₹)</label><input type="number" id="et-fee-res" placeholder="e.g. 0"></div>
        <button class="btn" onclick="showFees()">Show Fees</button>
        <div class="result" id="et-fee-r" hidden></div>
      </div>

    </div>
  </section>
  <script>
    function checkAgeLimit(){
      var dob=new Date(document.getElementById("et-dob").value);
      var min=+document.getElementById("et-min").value||0, max=+document.getElementById("et-max").value||0;
      if(isNaN(dob))return;
      var now=new Date();
      var age=now.getFullYear()-dob.getFullYear();
      var m=now.getMonth()-dob.getMonth();
      if(m<0||(m===0&&now.getDate()<dob.getDate()))age--;
      var el=document.getElementById("et-age-r");el.hidden=false;
      var ok=age>=min&&age<=max;
      el.innerHTML='<span class="big">'+age+' years</span><span class="meta">'+(ok?'✅ Eligible for '+min+'–'+max+' age limit':'❌ Not eligible ('+min+'–'+max+' required)')+'</span>';
    }
    function calcMarksPct(){
      var m=+document.getElementById("et-marks").value, t=+document.getElementById("et-total").value;
      if(!m||!t)return;
      var pct=m/t*100;
      var el=document.getElementById("et-pct-r");el.hidden=false;
      el.innerHTML='<span class="big">'+pct.toFixed(2)+'%</span><span class="meta">'+m+' / '+t+' marks'+(pct>=60?' · 1st class':pct>=50?' · 2nd class':pct>=40?' · pass':' · below pass')+'</span>';
    }
    function calcCgpa(){
      var c=+document.getElementById("et-cgpa").value, scale=+document.getElementById("et-scale").value;
      if(!c)return;
      var pct=scale===10?(c-0.75)*10:c*25;
      var el=document.getElementById("et-cgpa-r");el.hidden=false;
      el.innerHTML='<span class="big">'+pct.toFixed(2)+'%</span><span class="meta">CGPA '+c+' on '+scale+' scale</span>';
    }
    function showFees(){
      var g=+document.getElementById("et-fee-gen").value||0, r=+document.getElementById("et-fee-res").value||0;
      var el=document.getElementById("et-fee-r");el.hidden=false;
      el.innerHTML='<span class="big">₹'+g.toLocaleString()+'</span><span class="meta">General/OBC · SC/ST/PwD: ₹'+r.toLocaleString()+'</span>';
    }
    // prefill tools from URL params (?min=18&max=32&marks=412&total=500&cgpa=7.8&fee=100&feesc=0)
    (function(){
      var q=new URLSearchParams(location.search);
      if(q.get("min"))document.getElementById("et-min").value=q.get("min");
      if(q.get("max"))document.getElementById("et-max").value=q.get("max");
      if(q.get("marks"))document.getElementById("et-marks").value=q.get("marks");
      if(q.get("total"))document.getElementById("et-total").value=q.get("total");
      if(q.get("cgpa"))document.getElementById("et-cgpa").value=q.get("cgpa");
      if(q.get("fee"))document.getElementById("et-fee-gen").value=q.get("fee");
      if(q.get("feesc"))document.getElementById("et-fee-res").value=q.get("feesc");
    })();
  </script>`;
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

/* ---------- exam-tool suggestions (bottom CTA, form-filling) ---------- */
/* Analyzes a post's requirements and suggests the exact tools needed
   to FILL THE APPLICATION FORM for that exam: photo, signature,
   age (prefilled), marks %, documents checklist, fee. */
function toolSuggestions(p) {
  const sugg = [];
  const age = String(p.ageLimit || "").match(/(\d{1,2})\s*(?:to|–|-)\s*(\d{1,2})\s*(?:years?|yrs)/i);

  /* photo + signature — needed for EVERY application form */
  sugg.push({
    icon: "portrait",
    title: "Photo Resizer",
    why: "Passport-size photo for the application form (upload size limits)",
    href: "https://alexvivror.github.io/New/",
    tag: "Required for all forms",
  });
  sugg.push({
    icon: "draw",
    title: "Signature Resizer",
    why: "Scanned signature for the form — must match upload specs",
    href: "https://alexvivror.github.io/New/",
  });
  if (age) {
    sugg.push({
      icon: "cake",
      title: "Age Limit Checker",
      why: `Form needs age ${age[1]}–${age[2]} years — check yours before applying`,
      href: `./#exam-tools?min=${age[1]}&max=${age[2]}`,
      tag: "Prefilled for this exam",
    });
  }
  if (/cgpa|percentage|%|graduation/i.test(String(p.qualification || ""))) {
    sugg.push({
      icon: "percent",
      title: "Marks Percentage",
      why: "Form asks for your % marks — calculate exactly",
      href: "./#exam-tools",
    });
  }
  if (p.fee && p.fee !== "—" && !/as per|advertisement/i.test(String(p.fee))) {
    sugg.push({
      icon: "payments",
      title: "Fee & Payment",
      why: `Form requires ${p.fee} — pay only via official portal`,
      href: `./#exam-tools?fee=${p.fee.replace(/[^\d]/g, "")}`,
    });
  }
  if (sugg.length === 0) return "";
  return `
  <section class="sugg-bottom">
    <div class="sugg-head">
      <span class="sugg-icon"><span class="material-symbols-outlined">edit_note</span></span>
      <div>
        <h2>Ready to fill the application form?</h2>
        <p>Everything you need to complete ${esc(String(p.title).slice(0, 60))} — in one place</p>
      </div>
    </div>
    <div class="sugg-grid">
      ${sugg.map((s) => `<a class="sugg-item" href="${s.href}">
        <span class="material-symbols-outlined">${s.icon}</span>
        <div><b>${esc(s.title)}</b><small>${esc(s.why)}</small></div>
        ${s.tag ? `<span class="sugg-tag">${esc(s.tag)}</span>` : ""}
        <span class="sugg-arrow"><span class="material-symbols-outlined">arrow_forward</span></span>
      </a>`).join("\n")}
    </div>
    ${p.documents && p.documents.length ? `
    <details class="sugg-docs">
      <summary><span class="material-symbols-outlined">checklist</span> Keep these documents ready before filling the form</summary>
      <ul class="doc-checklist">
        ${p.documents.map((d) => `<li><label><input type="checkbox" data-doc="${esc(d)}"> <span>${esc(d)}</span></label></li>`).join("\n")}
      </ul>
      <p class="doc-note">Progress is saved on this device. Tick items as you gather them.</p>
    </details>` : ""}
  </section>
  <script>
    (function(){
      var boxes=document.querySelectorAll(".doc-checklist input[type=checkbox]");
      if(!boxes.length)return;
      var KEY="sh-docs-${p.id}";
      var saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){}
      boxes.forEach(function(b,i){
        var v=b.getAttribute("data-doc");
        if(saved[v])b.checked=true;
        b.addEventListener("change",function(){
          saved[v]=b.checked;
          try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}
          var n=document.querySelectorAll(".doc-checklist input:checked").length;
          var all=document.querySelectorAll(".doc-checklist input").length;
          var bar=document.getElementById("doc-progress");
          if(bar)bar.style.width=(n/all*100)+"%";
        });
      });
      var wrap=document.querySelector(".doc-checklist");
      if(wrap){
        var bar=document.createElement("div");
        bar.className="doc-progress-track";
        bar.innerHTML='<div class="doc-progress" id="doc-progress"></div>';
        wrap.parentNode.insertBefore(bar,wrap);
        var n=document.querySelectorAll(".doc-checklist input:checked").length;
        var all=document.querySelectorAll(".doc-checklist input").length;
        document.getElementById("doc-progress").style.width=(n/all*100)+"%";
      }
    })();
  </script>`;
}
function appBanner() {
  return "";
}

/* ---------- full post table (kept for post detail overviews) ---------- */
function postTable(posts, byCat, byExam) {
  return `<div class="table-wrap"><table class="post-table">
    <thead><tr><th>Post Name</th><th>Important Dates</th><th>Links</th></tr></thead>
    <tbody>${posts.map((p) => postRow(p, byCat, byExam)).join("\n")}</tbody>
  </table></div>`;
}

module.exports = { header, footer, postRow, postTable, postCard, postCardGrid, catBoxes, freeTools, examTools, sidebar, toolSuggestions, appBanner };
