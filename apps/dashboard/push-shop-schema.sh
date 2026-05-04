#!/usr/bin/env bash
set -euo pipefail

# Push the perstore-db schema to all remote shop databases
# Usage: ./push-shop-schema.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Source env (strip spaces after = to avoid command-not-found errors)
set -a
. <(sed 's/= /=/' ../../.env)
set +a

SHOPS=("gakom" "shwe-bag" "min-nyo-win" "min-nyo" "lucky" "lucky-2" "lucky-3")

for slug in "${SHOPS[@]}"; do
  url="libsql://${TURSO_GROUP}-${slug}-${TURSO_ORGANIZATION}.turso.io"
  echo "=== Pushing schema to ${slug} (${url}) ==="
  SHOP_DB_URL="$url" SHOP_DB_TOKEN="$TURSO_GROUP_AUTH_TOKEN" bunx --bun drizzle-kit push --config=drizzle.shop.config.ts
  echo "=== Done: ${slug} ==="
  echo ""
done

echo "All shop databases updated!"
