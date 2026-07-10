#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_URL="${1:-https://github.com/LooongLive/mountain-ranking.git}"
PAGES_DIR="$ROOT_DIR/.gh-pages-deploy"

cd "$ROOT_DIR"

npm run build

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
fi

git branch -M main
git add .
git commit -m "Deploy mountain ranking dashboard" || true
git -c http.version=HTTP/1.1 push -u origin main

rm -rf "$PAGES_DIR"
mkdir -p "$PAGES_DIR"
cp -R dist/. "$PAGES_DIR/"
touch "$PAGES_DIR/.nojekyll"

git -C "$PAGES_DIR" init
git -C "$PAGES_DIR" remote add origin "$REMOTE_URL"
git -C "$PAGES_DIR" checkout -B gh-pages
git -C "$PAGES_DIR" add .
git -C "$PAGES_DIR" commit -m "Deploy GitHub Pages"
git -C "$PAGES_DIR" -c http.version=HTTP/1.1 push --force origin gh-pages

echo
echo "GitHub Pages files pushed."
echo "Open repository Settings > Pages, choose branch: gh-pages / root."
echo "After GitHub finishes publishing, use:"
echo "https://LooongLive.github.io/mountain-ranking/"
