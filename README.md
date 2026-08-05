# Sarkari Hai 🏛️

**Latest Sarkari Jobs, Results, Admit Cards & Answer Keys** — a fast, modern competitor to sarkariresult.com.

## 📁 Project Structure

```
Sarkari-hai/
├── src/                    # source code (everything you edit)
│   ├── build.js            # static site generator → public/
│   ├── fetch-latest.js     # daily updater (RSS → data/posts.json → push)
│   ├── official.js         # verified official govt domain registry (STRICT)
│   ├── server.js           # static server for Render / local preview
│   ├── search.js           # client-side search (copied into build)
│   ├── style.css           # all styles (responsive, mobile-first)
│   └── deploy.sh           # clean sync public/ → repo (removes stale pages)
├── data/
│   └── posts.json          # all post content (curated + auto-fetched)
├── public/                 # GENERATED output — never edit, gitignored
│   ├── index.html          # homepage
│   ├── all-recruitment.html # every post in one table
│   ├── posts/              # one page per post
│   ├── exam-*.html         # exam hubs (SSC, UPSC, Railway, ...)
│   └── *.html              # category + info pages
├── .github/workflows/      # GitHub Actions → build + deploy Pages
├── render.yaml             # Render.com blueprint
└── package.json
```

## 🔒 Official links only (by design)

- Every `apply` link comes from `src/official.js` — a **strict registry of verified government domains** (`.gov.in`, `.nic.in`, `.ac.in`, official org sites)
- Posts whose official domain can't be confidently identified are **skipped**, never guessed
- No aggregator links, no redirects through third parties

## 🔄 How updates work

**Daily cron (8 AM IST)** runs `node src/fetch-latest.js`:
1. Fetches latest 100 notifications from FreeJobAlert RSS
2. Strict-matches official domains (skips unverifiable posts)
3. Merges with hand-researched curated posts (no duplicates)
4. **Auto-purges closed vacancies** whose final result is declared
5. Regenerates site → pushes → GitHub Actions builds & deploys

## 🚀 Local dev

```bash
node src/build.js      # generate public/
node src/server.js     # serve on :3000
```

## ⚠️ Disclaimer

Information only — not a government website. Always verify on official portals.
