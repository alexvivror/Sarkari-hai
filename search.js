/* Sarkari Hai — client-side search */
"use strict";

(async function () {
  const params = new URLSearchParams(window.location.search);
  const q = (params.get("q") || "").trim();
  const input = document.getElementById("q2");
  const resultsEl = document.getElementById("search-results");

  if (!resultsEl) return;
  if (input) input.value = q;

  let posts = [];
  try {
    posts = await (await fetch("./index.json")).json();
  } catch (e) {
    resultsEl.innerHTML = '<p class="no-results">Search index failed to load.</p>';
    return;
  }

  function search(text) {
    const t = text.toLowerCase();
    if (!t) {
      resultsEl.innerHTML = '<p class="page-desc">Type to search across all posts.</p>';
      return;
    }
    const hits = posts.filter((p) =>
      [p.title, p.cat, p.exam, p.desc, p.examDate].join(" ").toLowerCase().includes(t)
    );
    if (!hits.length) {
      resultsEl.innerHTML = `<p class="no-results">No results for "${esc(text)}". Try another keyword.</p>`;
      return;
    }
    resultsEl.innerHTML =
      `<p class="page-desc">${hits.length} result${hits.length > 1 ? "s" : ""} for "${esc(text)}"</p>` +
      hits
        .map(
          (p) => `<a class="search-result" href="./${p.id}.html">
            <b>${esc(p.title)}</b>
            <small>${esc(p.cat)} · ${esc(p.exam)} · ${esc(p.examDate)}</small>
          </a>`
        )
        .join("");
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  if (input) {
    input.addEventListener("input", () => search(input.value));
  }
  if (q) search(q);
})();
