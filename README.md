# Sarkari Hai 🏛️

**Latest Sarkari Jobs, Results, Admit Cards & Answer Keys** — a fast, modern competitor to sarkariresult.com.

## Features

- ✅ **Latest posts table** — post name + important dates + action links (Apply Online / Notification / Official Site)
- ✅ **6 categories**: Latest Jobs, Results, Admit Card, Answer Key, Syllabus, Admission
- ✅ **8 exam hubs**: SSC, UPSC, Railway, Bank, Police, Defence, Teaching, State Govt
- ✅ **18 individual post pages** with full details + FAQs + JobPosting/FAQ schema
- ✅ **Instant client-side search** (search.html?q=...)
- ✅ **Hindi + English** labels
- ✅ **AdSense-ready slots** (leaderboard, infeed, sidebar, post)
- ✅ **sitemap.xml + robots.txt** for SEO
- ✅ 100% static, mobile-first, loads instantly

## How it works

```
node build.js   # reads data/posts.json → generates ./public/ (all HTML)
node server.js  # serves ./public (for Render)
```

Add a new post by appending to `data/posts.json` and re-running `node build.js`. All pages regenerate automatically.

## Deploy

- **GitHub Pages**: enable at repo Settings → Pages → Source: *GitHub Actions* → `https://alexvivror.github.io/Sarkari-hai/`
- **Render**: create a Web Service from this repo (render.yaml auto-detected)

## Disclaimer

Demo data for demonstration. Always verify official details on government websites.
