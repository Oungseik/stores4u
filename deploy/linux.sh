#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

fail() {
  echo "Error: $*" >&2
  exit 1
}

[[ ${EUID:-$(id -u)} -ne 0 ]] || fail "Run this script as your desktop user, not root. It will use sudo for systemd."
[[ $# -eq 1 ]] || fail "Usage: ./deploy/linux.sh <stable-lan-ip-or-hostname>"

for command in bun caddy sudo systemctl; do
  command -v "$command" >/dev/null || fail "$command is required and must be available in PATH."
done

BUN=$(command -v bun)
CADDY=$(command -v caddy)
APP_USER=$(id -un)
LAN_HOST=$1

case "$ROOT$BUN$CADDY" in
  *[[:space:]]*) fail "The repository and Bun/Caddy paths must not contain spaces." ;;
esac

bun deploy/configure.ts "$LAN_HOST"
bun install --frozen-lockfile
if [[ ! -d packages/database/drizzle && -d databases/migrations ]]; then
  cp -a databases/migrations packages/database/drizzle
fi
bun run db:generate
rm -rf databases/migrations
cp -a packages/database/drizzle databases/migrations

APP_WAS_ACTIVE=false
if sudo systemctl is-active --quiet stores4u.service; then
  APP_WAS_ACTIVE=true
  sudo systemctl stop stores4u.service
fi

if ! DATABASE_BACKUP=$(bun deploy/backup-db.ts); then
  if [[ "$APP_WAS_ACTIVE" == true ]]; then
    sudo systemctl start stores4u.service
  fi
  fail "Database backup failed. The previous service was restarted when possible."
fi
PREVIOUS_BUILD="$ROOT/databases/deploy/build.previous"
HAD_PREVIOUS_BUILD=false
rm -rf "$PREVIOUS_BUILD"
if [[ -d apps/website/build ]]; then
  HAD_PREVIOUS_BUILD=true
  mv apps/website/build "$PREVIOUS_BUILD"
fi

rollback() {
  bun deploy/backup-db.ts --restore "${DATABASE_BACKUP:--}" || echo "Warning: database restore failed." >&2
  rm -rf apps/website/build
  if [[ "$HAD_PREVIOUS_BUILD" == true ]]; then
    mv "$PREVIOUS_BUILD" apps/website/build
  fi
  if [[ "$APP_WAS_ACTIVE" == true ]]; then
    sudo systemctl start stores4u.service || echo "Warning: previous service restart failed." >&2
  fi
}

if ! bun run build; then
  rollback
  fail "Build failed. The previous deployment was restored."
fi
if ! bun run db:migrate; then
  rollback
  fail "Database migration failed. The previous deployment was restored."
fi
rm -rf "$PREVIOUS_BUILD"

GENERATED_DIR="$ROOT/databases/deploy"
CADDY_DATA="$ROOT/databases/caddy-data"
CADDYFILE="$GENERATED_DIR/Caddyfile"
BOOTSTRAP_DIR="$ROOT/databases/bootstrap"
mkdir -p "$GENERATED_DIR" "$CADDY_DATA" "$BOOTSTRAP_DIR"

cat >"$GENERATED_DIR/stores4u.service" <<EOF
[Unit]
Description=Stores4U Bun server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$ROOT
Environment=NODE_ENV=production
ExecStart=$BUN run ./apps/website/build/index.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

cat >"$GENERATED_DIR/stores4u-caddy.service" <<EOF
[Unit]
Description=Stores4U private LAN HTTPS
After=network-online.target stores4u.service
Wants=network-online.target

[Service]
Type=notify
User=$APP_USER
WorkingDirectory=$ROOT
Environment=HOME=$HOME
Environment=XDG_DATA_HOME=$CADDY_DATA
ExecStart=$CADDY run --environ --config $CADDYFILE --adapter caddyfile
ExecReload=$CADDY reload --config $CADDYFILE --adapter caddyfile --force
Restart=on-failure
RestartSec=5
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

sudo install -m 0644 "$GENERATED_DIR/stores4u.service" /etc/systemd/system/stores4u.service
sudo install -m 0644 "$GENERATED_DIR/stores4u-caddy.service" /etc/systemd/system/stores4u-caddy.service
sudo systemctl daemon-reload
sudo systemctl enable stores4u.service stores4u-caddy.service >/dev/null
sudo systemctl restart stores4u.service
sudo systemctl restart stores4u-caddy.service

CERTIFICATE=""
for _ in {1..30}; do
  CERTIFICATE=$(find "$CADDY_DATA" -path '*/pki/authorities/local/root.crt' -print -quit 2>/dev/null || true)
  [[ -n "$CERTIFICATE" ]] && break
  sleep 1
done
[[ -n "$CERTIFICATE" ]] || fail "Caddy started but its root certificate was not created. Check: sudo journalctl -u stores4u-caddy"

cp "$CERTIFICATE" "$BOOTSTRAP_DIR/root.crt"
chmod 0644 "$BOOTSTRAP_DIR/root.crt"
FINGERPRINT=$(bun deploy/configure.ts --fingerprint "$BOOTSTRAP_DIR/root.crt")

if command -v curl >/dev/null && curl --silent --show-error --fail --cacert "$BOOTSTRAP_DIR/root.crt" "https://$LAN_HOST/health" >/dev/null; then
  echo "Health check passed."
else
  echo "Warning: local health check could not confirm the HTTPS URL. Check DNS/firewall and service logs." >&2
fi

cat <<EOF

Stores4U is running.

Phone certificate: http://$LAN_HOST:8080/root.crt
Phone setup page: http://$LAN_HOST:8080/
Application:       https://$LAN_HOST
Root CA SHA-256:   $FINGERPRINT

Before trusting root.crt, compare its SHA-256 fingerprint on the phone with the value above.
If a firewall is active, allow inbound TCP ports 443 and 8080.
Logs: sudo journalctl -u stores4u -u stores4u-caddy -f
Back up both databases/ and $CADDY_DATA; the latter keeps phones trusting HTTPS.
EOF
