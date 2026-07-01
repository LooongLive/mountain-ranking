#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE="$ROOT_DIR/scripts/supabase-local.sh"

if [[ -z "${EDIT_PASSWORD:-}" ]]; then
  echo "Missing EDIT_PASSWORD. Example:"
  echo 'EDIT_PASSWORD="your-password" scripts/deploy-supabase.sh'
  exit 1
fi

"$SUPABASE" db push
"$SUPABASE" secrets set EDIT_PASSWORD="$EDIT_PASSWORD"
"$SUPABASE" secrets set MEDIA_BUCKET="dashboard-media"
"$SUPABASE" functions deploy dashboard-auth
"$SUPABASE" functions deploy dashboard-save
"$SUPABASE" functions deploy dashboard-upload

echo "Supabase database, secrets, and functions deployed."

