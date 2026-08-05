# 🏛️ Sarkari Hai — Operating Charter (CEO/CTO/PM)

> **Primary mission:** Make this the most trusted, fastest, and easiest-to-use
> Government Jobs & Exam Portal by continuously improving content quality, UX,
> performance, SEO, accessibility, security, and automation.

## 1. Editorial Policy (non-negotiable)
- Publish only after verification against official notifications.
- Every post: department, post, vacancies, eligibility, age, salary, fee,
  selection, dates, documents, official PDF + apply links, FAQs, last-updated.
- **Nothing blank.** Posts missing required fields are not published.
- Never invent information. Official facts vs summaries clearly distinguished.
- Mark updates with timestamps + verification source. Keep revision history
  (database/archive.json + audit log).
- Never link to unofficial/suspicious sites — strict official registry.

## 2. Quality Gates (before every deploy)
1. `npm run test` — 21+ automated tests (official matching, dedup, purge, completeness)
2. `node src/scripts/build.js` — build must succeed
3. `node src/scripts/audit.js` — every page ≥ 70/100 quality score
4. `bash src/preview.sh` — all pages 200, no undefined, official links only
5. Only then push.

## 3. AI Quality Score (0–100, per page)
SEO · Performance · Accessibility · Mobile · Trust · Completeness · Freshness · Readability
→ `src/services/quality.js` · report → `docs/AUDIT.md`
Any page below threshold must get a fix or explicit justification.

## 4. Automation
- **Daily 8 AM IST** — `src/cron/daily.js`: fetch → verify → extract → dedup →
  purge+archive → publish → push.
- **Hourly** — `src/cron/hourly.js`: change detection, new-notification check.
- **Daily audit** — quality score + broken-link/stale checks → report.

## 5. Knowledge Base
`database/knowledge.json` — authorities, exam patterns, eligibility rules,
salary structures. Reused for consistency; expand as verified info arrives.

## 6. Security
- No secrets in repo (SSH key local only, GIT_SSH_CMD env).
- Escape all HTML output (lib/utils esc) — XSS-safe.
- Strict official-domain registry prevents phishing-style links.
- Validate inputs in all services.

## 7. Performance Targets
- Homepage < 30KB, load < 1s (currently ~23KB / 0.22s ✓)
- Mobile-first, dark mode, no popups.

## 8. Roadmap
- [x] Verified-only publishing + official registry
- [x] Modular architecture (components/services/lib/cron/database/tests)
- [x] Dark mode, exam calendar, filters, countdowns, tool suggestions
- [x] Quality scoring + audit + knowledge base
- [ ] PWA installability (manifest + service worker)
- [ ] Mock tests / previous papers section
- [ ] Subscriber notifications (Telegram/WhatsApp/email)
- [ ] Admin dashboard (updates, failed crawls, pending review)
- [ ] Google Search Console + Analytics

## 9. AI Rules
- Think before changing; explain major decisions.
- Avoid unnecessary complexity; keep consistent; preserve backward compat.
- Never remove features without justification.

## 10. Documentation
- README.md — architecture & usage
- docs/RESEARCH.md — competitor research
- docs/AUDIT.md — quality scores (auto-generated)
- docs/MANAGEMENT.md — operations
- This charter — mission & policies
