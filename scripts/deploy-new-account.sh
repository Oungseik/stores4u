#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

GROUP_NAME=${TURSO_GROUP_NAME:-stores4u}
DATABASE_NAME=${TURSO_DATABASE_NAME:-stores4u}
TURSO_LOCATION=${TURSO_LOCATION:-aws-ap-south-1}
R2_BUCKET=stores4u

if [[ ${1:-} == "--help" ]]; then
  cat <<'EOF'
Usage: ./scripts/deploy-new-account.sh [--keep-login]

Deploys a fresh Stores4U instance using the target user's Turso and Cloudflare
accounts. By default it logs out of both CLIs first. Before running, copy
.env.example to .env.prod, set PUBLIC_ENVIRONMENT=production, and add the
production URL, OAuth, and Mistral values.

Optional environment variables:
  TURSO_GROUP_NAME       default: stores4u
  TURSO_DATABASE_NAME    default: stores4u
  TURSO_LOCATION         default: aws-ap-south-1
EOF
  exit 0
fi

for command in bun turso openssl curl; do
  command -v "$command" >/dev/null || { echo "Missing command: $command" >&2; exit 1; }
done

if [[ ! -f .env.prod ]]; then
  cp .env.example .env.prod
  echo "Created .env.prod. Set PUBLIC_ENVIRONMENT=production, set BETTER_AUTH_URL to the production HTTPS URL, add optional OAuth/OCR credentials, then rerun." >&2
  exit 1
fi

worker_url=$(bun --env-file=.env.prod -e 'process.stdout.write(process.env.BETTER_AUTH_URL ?? "")')
[[ $worker_url == https://* ]] || { echo "BETTER_AUTH_URL in .env.prod must be the production HTTPS URL." >&2; exit 1; }

read -r -p "Does .env.prod contain the target user's production URL and OAuth/OCR credentials? [y/N] " confirmed
[[ $confirmed =~ ^[Yy]$ ]] || exit 1

if [[ ${1:-} != "--keep-login" ]]; then
  echo "[1/7] Authenticate the target user's Turso account"
  turso auth logout >/dev/null 2>&1 || true
  turso auth login

  echo "[2/7] Authenticate the target user's Cloudflare account"
  (cd apps/website && bunx wrangler logout >/dev/null 2>&1 || true; bunx wrangler login)
else
  echo "[1/7] Reuse the current Turso login"
  turso auth whoami
  echo "[2/7] Reuse the current Cloudflare login"
  (cd apps/website && bunx wrangler whoami)
fi

set_env() {
  local key=$1 value=$2 tmp
  tmp=$(mktemp)
  awk -v key="$key" -v value="$value" 'BEGIN { done=0 } $0 ~ "^" key "=" { print key "=" value; done=1; next } { print } END { if (!done) print key "=" value }' .env.prod >"$tmp"
  mv "$tmp" .env.prod
}

echo "[3/7] Create the Turso group, database, and token"
turso group show "$GROUP_NAME" >/dev/null 2>&1 || turso group create "$GROUP_NAME" --location "$TURSO_LOCATION" --wait
if turso db show "$DATABASE_NAME" >/dev/null 2>&1; then
  read -r -p "Turso database '$DATABASE_NAME' exists. Reuse it? [y/N] " reuse_database
  [[ $reuse_database =~ ^[Yy]$ ]] || exit 1
else
  turso db create "$DATABASE_NAME" --group "$GROUP_NAME" --wait
fi
set_env TURSO_DATABASE_URL "$(turso db show "$DATABASE_NAME" --url)"
set_env TURSO_AUTH_TOKEN "$(turso db tokens create "$DATABASE_NAME")"

echo "[4/7] Create the Cloudflare R2 bucket"
if (cd apps/website && bunx wrangler r2 bucket list) | grep -q "^name:[[:space:]]*$R2_BUCKET$"; then
  read -r -p "R2 bucket '$R2_BUCKET' exists. Reuse it? [y/N] " reuse_bucket
  [[ $reuse_bucket =~ ^[Yy]$ ]] || exit 1
else
  (cd apps/website && bunx wrangler r2 bucket create "$R2_BUCKET")
fi

if (cd apps/website && bunx wrangler deployments status) >/dev/null 2>&1; then
  read -r -p "Worker 'stores4u' exists. Replace its deployment? [y/N] " reuse_worker
  [[ $reuse_worker =~ ^[Yy]$ ]] || exit 1
fi

# Generate the auth secret only for a new production environment.
if ! bun --env-file=.env.prod -e 'process.exit(process.env.BETTER_AUTH_SECRET ? 0 : 1)'; then
  set_env BETTER_AUTH_SECRET "$(openssl rand -hex 32)"
fi

echo "[5/7] Install dependencies"
bun install

echo "[6/7] Build, migrate Turso, and deploy with production secrets"
bun run deploy

echo "[7/7] Smoke-test Turso, Worker routes, and R2"
smoke_file=$(mktemp)
trap 'rm -f "$smoke_file"' EXIT
curl --retry 5 --retry-all-errors --retry-delay 2 --fail --silent "$worker_url/health" >/dev/null
curl --retry 5 --retry-all-errors --retry-delay 2 --fail --silent "$worker_url/setup" >/dev/null
printf 'stores4u-r2-ok' >"$smoke_file"
(cd apps/website && bunx wrangler r2 object put "$R2_BUCKET/deploy-smoke.txt" --file "$smoke_file" --content-type text/plain --remote -y >/dev/null)
[[ $(curl --retry 5 --retry-all-errors --retry-delay 2 --fail --silent "$worker_url/storage/deploy-smoke.txt") == "stores4u-r2-ok" ]]
(cd apps/website && bunx wrangler r2 object delete "$R2_BUCKET/deploy-smoke.txt" --remote >/dev/null)

echo "Deployment complete: $worker_url"
