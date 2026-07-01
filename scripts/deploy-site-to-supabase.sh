#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE="$ROOT_DIR/scripts/supabase-local.sh"
BUCKET="dashboard-site"
PROJECT_REF="ochhwfntlpzwjextvxsh"
RELEASE="$(date +%Y%m%d%H%M%S)"

cd "$ROOT_DIR"

npm run build
"$SUPABASE" db push --yes

"$SUPABASE" --experimental storage cp --linked --cache-control "max-age=31536000, immutable" --content-type "image/svg+xml" dist/favicon.svg "ss:///$BUCKET/releases/$RELEASE/favicon.svg"

for file in dist/assets/*.js; do
  "$SUPABASE" --experimental storage cp --linked --cache-control "max-age=31536000, immutable" --content-type "application/javascript" "$file" "ss:///$BUCKET/releases/$RELEASE/assets/$(basename "$file")"
done

for file in dist/assets/*.css; do
  "$SUPABASE" --experimental storage cp --linked --cache-control "max-age=31536000, immutable" --content-type "text/css" "$file" "ss:///$BUCKET/releases/$RELEASE/assets/$(basename "$file")"
done

SITE_RELEASE="$RELEASE" PROJECT_REF="$PROJECT_REF" SITE_BUCKET="$BUCKET" node scripts/generate-dashboard-web-function.mjs
"$SUPABASE" functions deploy --no-verify-jwt dashboard-web

echo
echo "Site deployed:"
echo "https://$PROJECT_REF.supabase.co/functions/v1/dashboard-web"
