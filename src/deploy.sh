#!/usr/bin/env bash
# ============================================================
# Sarkari Hai — clean sync: public/ → repo working dir
# Deletes stale generated files so the repo only ever contains
# the current build output. Run after `node build.js`.
#   usage: bash deploy.sh <repo-dir>
# ============================================================
set -euo pipefail

REPO_DIR="${1:?usage: bash deploy.sh <repo-dir>}"
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)/public"

[ -d "$REPO_DIR/.git" ] || { echo "ERROR: $REPO_DIR is not a git repo"; exit 1; }

# 1. remove every generated artifact that exists in the repo but not in public/
cd "$REPO_DIR"
for f in *; do
  [ -e "$f" ] || continue
  case "$f" in
    .git|.github|data|build.js|fetch-latest.js|official.js|search.js|server.js|style.css|deploy.sh|README.md|render.yaml|package.json|pages-deploy.yml|FEATURES.md)
      continue ;; # source files — never delete
    *)
      if [ -f "$SRC_DIR/$f" ]; then
        # keep, it's current — will be overwritten by cp below
        :
      else
        rm -f "$f" && echo "  removed stale: $f"
      fi ;;
  esac
done

# 2. copy fresh build output
cp -f "$SRC_DIR"/* .
echo "  synced $(ls "$SRC_DIR" | wc -l) files from public/"
echo "SYNC OK"
