# deploy

## Purpose

Private-LAN production installation for the desktop-hosted Stores4U Bun server.

## Ownership

Owns the shared deployment configurator, certificate onboarding page, SQLite pre-migration backup helper, Linux systemd installer, Windows WinSW installer, and deployment documentation.

## Local Contracts

- Production runs `apps/website/build/index.js` with Bun; never Vite dev/preview.
- One Bun app process listens on `127.0.0.1:3000`; Caddy is the only LAN-facing process.
- Caddy uses `tls internal` on a stable private IPv4 address/hostname. Port 8080 serves the public root certificate and onboarding instructions; port 443 serves the app.
- Installers preserve `.env`, `databases/`, and Caddy CA data across reruns; they generate a Better Auth secret only when missing and normalize `DATABASE_PATH` to an absolute repo-root path.
- Persist the gitignored Drizzle migration history at `databases/migrations` and restore it before generation so an update/reinstall does not replay a new initial migration against an existing database.
- Stop the app and back up/checkpoint SQLite plus the current build before building/migrating. A failed build or migration restores both before restarting the previous service. Restart supervision is systemd on Linux and WinSW on Windows; PM2/Node is not used.
- Phones receive only `root.crt`. The operator must compare its SHA-256 fingerprint with the value shown locally by the installer before trusting it; HTTP is transport only. Never expose or copy Caddy's CA private key outside protected backups.

## Work Guidance

- Keep `linux.sh` and `windows.ps1` behavior aligned.
- Generated configs, service binaries, logs, database backups, and PKI stay under ignored `databases/`.
- Do not automate stable-IP/router configuration; require the operator to choose a stable LAN address explicitly.

## Verification

- `bun test deploy/deploy.test.ts`
- `bash -n deploy/linux.sh`
- Run each installer on its target OS before publishing an installation release.

## Child DOX Index

_none_
