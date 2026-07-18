# Private LAN deployment

Stores4U runs as a Bun production server behind Caddy. Caddy issues a private HTTPS certificate so phones can use the barcode camera without internet access.

## Before installing

Choose one stable LAN address for the desktop:

- Reserve its IPv4 address in the router, such as `192.168.1.50`; or
- Use a stable hostname supplied by local DNS; or
- Use the desktop's Wi-Fi hotspot and its fixed gateway address.

The address becomes the authentication origin. Keep it stable. Both installers are idempotent: rerun the same command to deploy an update without replacing the database or Caddy CA.

The first source installation needs the repository, Bun packages, Bun, Caddy, and (on Windows) WinSW. Download them before traveling to a location without internet access. Clone to a stable machine-wide path without spaces, such as `/opt/stores4u` or `C:\Stores4U`; service configuration stores this absolute path.

## Linux

Requirements:

- Bun and Caddy available in `PATH`
- systemd and `sudo`
- TCP ports 443 and 8080 available

Run from the repository root as the desktop user, not root:

```bash
chmod +x deploy/linux.sh
./deploy/linux.sh 192.168.1.50
```

The script installs and enables:

- `stores4u.service` — the Bun production server
- `stores4u-caddy.service` — private HTTPS and certificate bootstrap server

If the distribution's `caddy.service` is already enabled, stop and disable it first so it does not compete for ports:

```bash
sudo systemctl disable --now caddy.service
```

Open firewall ports when applicable:

```bash
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
```

Logs:

```bash
sudo journalctl -u stores4u -u stores4u-caddy -f
```

## Windows

Requirements:

- Bun available in `PATH`
- `caddy.exe` from [caddyserver.com/download](https://caddyserver.com/download)
- WinSW executable from [github.com/winsw/winsw/releases](https://github.com/winsw/winsw/releases)
- PowerShell running as Administrator
- TCP ports 443 and 8080 available

Run from the repository root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\deploy\windows.ps1 `
  -LanHost 192.168.1.50 `
  -CaddyPath C:\Tools\caddy.exe `
  -WinSWPath C:\Tools\WinSW-x64.exe
```

The installer registers automatic `stores4u` and `stores4u-caddy` Windows services under the low-privilege LocalService account and adds Windows Firewall rules for ports 443 and 8080 on Private/Domain networks. Mark the store Wi-Fi as a Private network. Service logs are written under `databases\logs`.

## Connect a phone

Connect the phone to the same Wi-Fi network, then open:

```text
http://192.168.1.50:8080/
```

The page explains the one-time certificate installation:

1. Download `root.crt`.
2. Compare the certificate's SHA-256 fingerprint with `Root CA SHA-256` shown locally by the desktop installer. Do not trust a mismatch. If the phone cannot show certificate details before installation, transfer `root.crt` directly from the desktop instead of downloading it over HTTP.
3. Install it as a trusted CA certificate.
4. On iPhone/iPad, also enable full trust under Certificate Trust Settings.
5. Open `https://192.168.1.50`, allow camera access, and bookmark it.

The HTTP onboarding page is only a transport and is not authenticated; the locally displayed fingerprint authenticates the certificate. A browser certificate-warning bypass is not enough for camera access. The CA must be installed as trusted.

## Updates and backups

Rerun the platform installer after pulling a new revision. It installs dependencies, stops the app, backs up the SQLite database and current build, builds, migrates, and restarts. A failed build or migration restores the previous database/build and restarts the previous service when one was running.

Back up the entire ignored `databases/` directory. It contains:

- the SQLite database and local uploads;
- pre-migration database backups;
- the persisted Drizzle migration history needed for safe reinstalls;
- generated service configuration;
- Caddy's private CA and public root certificate.

Protect backups: Caddy's CA private key is sensitive. Never give phones `root.key`; distribute only `databases/bootstrap/root.crt`.
