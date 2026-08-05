# Sarkari Hai 🏛️

**Latest Sarkari Jobs, Results, Admit Cards & Answer Keys** — a fast, modern, trust-first government jobs portal.

## 📁 Project Structure (modular)

```
Sarkari-hai/
├── src/
│   ├── components/        # reusable UI components (header, footer, tables, sidebar)
│   │   └── ui.js
│   ├── services/          # business logic
│   │   ├── official.js    # verified official govt domain registry (STRICT)
│   │   ├── content.js     # content mgmt: load/save, dedup, purge, archive
│   │   ├── fetch.js       # RSS fetch + verified post building
│   │   └── seo.js         # SEO: meta, OG, Twitter, JSON-LD, sitemap, robots
│   ├── lib/
│   │   └── utils.js       # shared helpers (escape, dates, slugify, countdown)
│   ├── cron/
│   │   ├── daily.js       # daily 8 AM IST updater (fetch→verify→publish→push)
│   │   └── hourly.js      # hourly background check
│   ├── scripts/
│   │   ├── build.js       # static site generator (orchestrator)
│   │   ├── preview.sh     # QA gate: tests + build + link/page checks
│   │   └── deploy.sh      # sync public/ → repo root
│   ├── server.js          # static server (Render)
│   ├── search.js          # client-side search
│   └── style.css          # responsive, mobile-first, dark mode
├── database/
│   ├── posts.json         # all live posts (single content directory)
│   └── archive.json       # archived (purged) posts — history preserved
├── tests/
│   └── run.js             # 21 automated tests (official matching, dedup, purge...)
├── docs/                  # management & research docs
├── public/                # GENERATED output (gitignored, CI-built)
├── .github/workflows/     # GitHub Actions → build + deploy Pages
├── render.yaml            # Render.com blueprint
└── package.json
```

## 🔒 Content Publishing Rules (enforced)

Every recruitment page includes: title, department, notification summary, vacancy details, eligibility, age limit, salary, application fee, selection process, important dates, required documents, official notification PDF link, official application link, FAQs, last-updated date.

- **Publish only after verification** against official notifications
- **Official links only** — strict registry in `src/services/official.js`, never guess
- **No duplicates** — dedup on every publish
- **Auto-purge + archive** — closed vacancies (final result declared) move to `database/archive.json`
- **Skip unverifiable** — no official match = no post

## 🔄 Automation

- **Daily 8 AM IST**: `node src/cron/daily.js` — fetch → verify → dedup → purge → publish → push
- **Hourly**: `node src/cron/hourly.js` — background check for new notifications
- GitHub Actions rebuilds `public/` on every push

## 🧪 QA Before Every Deploy

```bash
npm run preview    # = bash src/preview.sh
# 1. automated tests (21 checks)
# 2. build
# 3. all pages return 200
# 4. no 'undefined' leaks
# 5. all links verified official
```

## ✨ Features

- Responsive mobile-first design + **dark mode** (remembered)
- Instant client-side search + filters
- Exam calendar (upcoming dates), countdown tags (days left)
- Free tools strip (age, percentage, BMI, image, PDF, password)
- Full SEO: titles, meta, canonical, OG, Twitter, JSON-LD, breadcrumbs, sitemap, robots
- Hindi + English labels

## ⚠️ Disclaimer

Information only — not a government website. Always verify on official portals.
