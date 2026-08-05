#!/usr/bin/env bash
# ============================================================
# Sarkari Hai — PREVIEW + VERIFY before deployment
# Usage: bash src/preview.sh
# Builds the site, serves it, and verifies every page:
#   - all pages return 200
#   - no "undefined" text leaked into output
#   - all external links are official (gov.in/nic.in/ac.in...)
#   - posts folder is populated
# Prints PASS/FAIL. Exit code 0 = safe to push.
# ============================================================
set -uo pipefail
cd "$(dirname "$0")/.."   # project root

PORT="${PORT:-3210}"

echo "🧪 Running automated tests (QA gate)..."
node tests/run.js || { echo "FAIL: tests failed — do NOT deploy"; exit 1; }

echo "🔨 Building site..."
node src/scripts/build.js || { echo "FAIL: build errored"; exit 1; }

echo "📊 Running quality audit (every page ≥ 70/100)..."
node src/scripts/audit.js || { echo "FAIL: quality audit below threshold — do NOT deploy"; exit 1; }

echo "🚀 Starting preview server on :$PORT ..."
PORT="$PORT" node src/server.js >/tmp/sarkari-preview.log 2>&1 &
SRV_PID=$!
trap "kill $SRV_PID 2>/dev/null" EXIT
sleep 1

FAIL=0

echo ""
echo "═══ 1) PAGE STATUS CHECK ═══"
PAGES_OK=0; PAGES_BAD=0; PAGES_TOTAL=0
for f in public/*.html public/posts/*.html; do
  PAGES_TOTAL=$((PAGES_TOTAL+1))
  url="http://localhost:$PORT/${f#public/}"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" = "200" ]; then PAGES_OK=$((PAGES_OK+1)); else PAGES_BAD=$((PAGES_BAD+1)); echo "  ✗ $code ${f#public/}"; fi
done
echo "  $PAGES_OK/$PAGES_TOTAL pages OK, $PAGES_BAD broken"
[ "$PAGES_BAD" = "0" ] || FAIL=1

echo ""
echo "═══ 2) 'undefined' LEAK CHECK ═══"
LEAK=$(grep -l "undefined" public/*.html public/posts/*.html 2>/dev/null | wc -l)
if [ "$LEAK" = "0" ]; then echo "  ✓ no 'undefined' in any page"; else echo "  ✗ $LEAK page(s) contain 'undefined'"; FAIL=1; fi

echo ""
echo "═══ 3) OFFICIAL-LINK AUDIT ═══"
BAD_LINKS=$(grep -ohE 'href="https?://[^"]+"' public/*.html public/posts/*.html 2>/dev/null \
  | grep -vE 'fonts\.googleapis|fonts\.gstatic|w3\.org|alexvivror\.github' \
  | grep -oE 'https?://[^/"]+' | sort -u \
  | grep -viE 'gov\.in|nic\.in|ac\.in|ibps\.in|ntpc\.co|isro\.gov|nhpcindia\.com|mumresults\.in|tn-mbamca\.com|aiims\.edu|iitd\.ac\.in|nta\.ac' || true)
if [ -z "$BAD_LINKS" ]; then echo "  ✓ all external links are official domains"; else echo "  ✗ NON-OFFICIAL LINKS FOUND:"; echo "$BAD_LINKS"; FAIL=1; fi

echo ""
echo "═══ 4) POSTS FOLDER ═══"
NPOSTS=$(ls public/posts/*.html 2>/dev/null | wc -l)
echo "  $NPOSTS post pages in public/posts/"
[ "$NPOSTS" -gt 0 ] || { echo "  ✗ no posts generated"; FAIL=1; }

echo ""
if [ "$FAIL" = "0" ]; then
  echo "✅ PREVIEW PASS — safe to deploy"
else
  echo "❌ PREVIEW FAILED — do NOT push, fix issues first"
fi
exit $FAIL
