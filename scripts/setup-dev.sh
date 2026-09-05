#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

GROUP_NAME=${TURSO_GROUP_NAME:-stores4u-dev}
DATABASE_NAME=${TURSO_DATABASE_NAME:-stores4u-dev}
TURSO_LOCATION=${TURSO_LOCATION:-}

if [[ ${1:-} == "--help" ]]; then
  cat <<'EOF'
Usage: ./scripts/setup-dev.sh

Prepares a development machine: installs dependencies, authenticates Turso
when needed, creates/reuses isolated development resources, writes .env,
prepares local upload storage, and applies committed database migrations.

Optional environment variables:
  TURSO_GROUP_NAME       default: stores4u-dev
  TURSO_DATABASE_NAME    default: stores4u-dev
  TURSO_LOCATION         default: Turso's nearest location
EOF
  exit 0
fi

for command in bun turso openssl; do
  command -v "$command" >/dev/null || { echo "Missing command: $command" >&2; exit 1; }
done

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example."
fi

set_env() {
  local key=$1 value=$2 tmp
  tmp=$(mktemp)
  awk -v key="$key" -v value="$value" 'BEGIN { done=0 } $0 ~ "^" key "=" { print key "=\"" value "\""; done=1; next } { print } END { if (!done) print key "=\"" value "\"" }' .env >"$tmp"
  mv "$tmp" .env
}

echo "[1/5] Install dependencies"
bun install

echo "[2/5] Authenticate the development Turso account"
turso auth whoami >/dev/null 2>&1 || turso auth login

echo "[3/5] Create or reuse the development Turso database"
if ! turso group show "$GROUP_NAME" >/dev/null 2>&1; then
  group_args=(group create "$GROUP_NAME" --wait)
  [[ -n $TURSO_LOCATION ]] && group_args+=(--location "$TURSO_LOCATION")
  turso "${group_args[@]}"
fi
turso db show "$DATABASE_NAME" >/dev/null 2>&1 || turso db create "$DATABASE_NAME" --group "$GROUP_NAME" --wait
set_env TURSO_DATABASE_URL "$(turso db show "$DATABASE_NAME" --url)"
set_env TURSO_AUTH_TOKEN "$(turso db tokens create "$DATABASE_NAME")"
if ! bun --env-file=.env -e 'process.exit(process.env.BETTER_AUTH_SECRET ? 0 : 1)'; then
  set_env BETTER_AUTH_SECRET "$(openssl rand -hex 32)"
fi
set_env BETTER_AUTH_URL "http://localhost:5173"
set_env PUBLIC_SITE_NAME "stores4u"
set_env PUBLIC_ENVIRONMENT "development"

echo "[4/5] Prepare local file storage"
mkdir -p apps/website/.storage

echo "[5/5] Apply committed database migrations"
bun run db:migrate

echo "Development setup complete. Run: bun run dev"
