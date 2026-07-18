[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$LanHost,
  [string]$CaddyPath = "",
  [Parameter(Mandatory = $true)]
  [string]$WinSWPath
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param([string]$File, [string[]]$Arguments)
  & $File @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$File exited with code $LASTEXITCODE"
  }
}

function Escape-Xml([string]$Value) {
  return [System.Security.SecurityElement]::Escape($Value)
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run PowerShell as Administrator."
}

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$BunPath = (Get-Command bun -ErrorAction Stop).Source
if (-not $CaddyPath) {
  $CaddyPath = (Get-Command caddy -ErrorAction Stop).Source
}
$CaddyPath = (Resolve-Path $CaddyPath).Path
$WinSWPath = (Resolve-Path $WinSWPath).Path

Invoke-Checked $BunPath @("deploy/configure.ts", $LanHost)
Invoke-Checked $BunPath @("install", "--frozen-lockfile")
$migrations = Join-Path $Root "packages/database/drizzle"
$persistedMigrations = Join-Path $Root "databases/migrations"
if (-not (Test-Path $migrations) -and (Test-Path $persistedMigrations)) {
  Copy-Item -Recurse $persistedMigrations $migrations
}
Invoke-Checked $BunPath @("run", "db:generate")
Remove-Item -Recurse -Force $persistedMigrations -ErrorAction SilentlyContinue
Copy-Item -Recurse $migrations $persistedMigrations

$appService = Get-Service -Name "stores4u" -ErrorAction SilentlyContinue
$appWasRunning = $appService -and $appService.Status -ne "Stopped"
if ($appWasRunning) {
  Stop-Service -Name "stores4u" -Force
}

try {
  $databaseBackup = ([string](Invoke-Checked $BunPath @("deploy/backup-db.ts"))).Trim()
} catch {
  if ($appWasRunning) { Start-Service -Name "stores4u" }
  throw
}
$backupToRestore = "-"
if ($databaseBackup) { $backupToRestore = $databaseBackup }
$liveBuild = Join-Path $Root "apps/website/build"
$previousBuild = Join-Path $Root "databases/deploy/build.previous"
$hadPreviousBuild = Test-Path $liveBuild
Remove-Item -Recurse -Force $previousBuild -ErrorAction SilentlyContinue
if ($hadPreviousBuild) { Move-Item $liveBuild $previousBuild }

function Restore-PreviousDeployment {
  try {
    Invoke-Checked $BunPath @("deploy/backup-db.ts", "--restore", $backupToRestore)
  } catch {
    Write-Warning "Database restore failed: $_"
  }
  Remove-Item -Recurse -Force $liveBuild -ErrorAction SilentlyContinue
  if ($hadPreviousBuild) { Move-Item $previousBuild $liveBuild }
  if ($appWasRunning) {
    try { Start-Service -Name "stores4u" } catch { Write-Warning "Previous service restart failed: $_" }
  }
}

try {
  Invoke-Checked $BunPath @("run", "build")
  Invoke-Checked $BunPath @("run", "db:migrate")
} catch {
  $failure = $_
  Restore-PreviousDeployment
  throw $failure
}

$GeneratedDir = Join-Path $Root "databases/deploy"
$ServicesDir = Join-Path $Root "databases/services"
$LogsDir = Join-Path $Root "databases/logs"
$CaddyData = Join-Path $Root "databases/caddy-data"
$BootstrapDir = Join-Path $Root "databases/bootstrap"
$Caddyfile = Join-Path $GeneratedDir "Caddyfile"
New-Item -ItemType Directory -Force -Path $GeneratedDir, $ServicesDir, $LogsDir, $CaddyData, $BootstrapDir | Out-Null

foreach ($serviceName in @("stores4u", "stores4u-caddy")) {
  $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
  if ($service) {
    if ($service.Status -ne "Stopped") { Stop-Service -Name $serviceName -Force }
    & sc.exe delete $serviceName | Out-Null
  }
}
Start-Sleep -Seconds 1

$appWrapper = Join-Path $ServicesDir "stores4u.exe"
$caddyWrapper = Join-Path $ServicesDir "stores4u-caddy.exe"
$appRuntime = Join-Path $ServicesDir "bun.exe"
$caddyRuntime = Join-Path $ServicesDir "caddy.exe"
Copy-Item -Force $WinSWPath $appWrapper
Copy-Item -Force $WinSWPath $caddyWrapper
Copy-Item -Force $BunPath $appRuntime
Copy-Item -Force $CaddyPath $caddyRuntime

$rootXml = Escape-Xml $Root
$logsXml = Escape-Xml $LogsDir
$caddyfileXml = Escape-Xml $Caddyfile
$caddyDataXml = Escape-Xml $CaddyData

@"
<service>
  <id>stores4u</id>
  <name>Stores4U</name>
  <description>Stores4U Bun server</description>
  <executable>$(Escape-Xml $appRuntime)</executable>
  <arguments>run ./apps/website/build/index.js</arguments>
  <workingdirectory>$rootXml</workingdirectory>
  <env name="NODE_ENV" value="production" />
  <startmode>Automatic</startmode>
  <onfailure action="restart" delay="5 sec" />
  <stoptimeout>30 sec</stoptimeout>
  <logpath>$logsXml</logpath>
  <log mode="roll" />
</service>
"@ | Set-Content -Encoding UTF8 (Join-Path $ServicesDir "stores4u.xml")

@"
<service>
  <id>stores4u-caddy</id>
  <name>Stores4U Caddy</name>
  <description>Stores4U private LAN HTTPS</description>
  <executable>$(Escape-Xml $caddyRuntime)</executable>
  <arguments>run --environ --config &quot;$caddyfileXml&quot; --adapter caddyfile</arguments>
  <workingdirectory>$rootXml</workingdirectory>
  <env name="APPDATA" value="$caddyDataXml" />
  <env name="LOCALAPPDATA" value="$caddyDataXml" />
  <startmode>Automatic</startmode>
  <onfailure action="restart" delay="5 sec" />
  <stoptimeout>30 sec</stoptimeout>
  <logpath>$logsXml</logpath>
  <log mode="roll" />
</service>
"@ | Set-Content -Encoding UTF8 (Join-Path $ServicesDir "stores4u-caddy.xml")

Invoke-Checked $appWrapper @("install")
Invoke-Checked $caddyWrapper @("install")

# Run both services with Windows' low-privilege LocalService account.
& sc.exe config stores4u obj= "NT AUTHORITY\LocalService" password= "" | Out-Null
& sc.exe config stores4u-caddy obj= "NT AUTHORITY\LocalService" password= "" | Out-Null
& icacls $Root /grant '*S-1-5-19:(OI)(CI)RX' | Out-Null
& icacls (Join-Path $Root "databases") /grant '*S-1-5-19:(OI)(CI)M' | Out-Null
$currentAccount = $identity.Name
& icacls (Join-Path $Root ".env") /inheritance:r /grant:r "${currentAccount}:(F)" '*S-1-5-18:(F)' '*S-1-5-19:(R)' | Out-Null

Invoke-Checked $appWrapper @("start")
Invoke-Checked $caddyWrapper @("start")
Remove-Item -Recurse -Force $previousBuild -ErrorAction SilentlyContinue

if (-not (Get-NetFirewallRule -DisplayName "Stores4U HTTPS" -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName "Stores4U HTTPS" -Direction Inbound -Profile Private,Domain -Protocol TCP -LocalPort 443 -Action Allow | Out-Null
}
if (-not (Get-NetFirewallRule -DisplayName "Stores4U certificate setup" -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName "Stores4U certificate setup" -Direction Inbound -Profile Private,Domain -Protocol TCP -LocalPort 8080 -Action Allow | Out-Null
}

$certificate = $null
for ($attempt = 0; $attempt -lt 30 -and -not $certificate; $attempt++) {
  $certificate = Get-ChildItem $CaddyData -Recurse -Filter root.crt -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*pki*authorities*local*" } |
    Select-Object -First 1
  if (-not $certificate) { Start-Sleep -Seconds 1 }
}
if (-not $certificate) {
  throw "Caddy started but its root certificate was not created. Check databases/logs."
}
$rootCertificate = Join-Path $BootstrapDir "root.crt"
Copy-Item -Force $certificate.FullName $rootCertificate
$fingerprint = ([string](Invoke-Checked $BunPath @("deploy/configure.ts", "--fingerprint", $rootCertificate))).Trim()

$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curl) {
  & $curl.Source --silent --show-error --fail --cacert $rootCertificate "https://$LanHost/health" | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "Health check passed." }
  else { Write-Warning "The local HTTPS health check failed. Check the LAN address and service logs." }
}

Write-Host @"

Stores4U is running.

Phone certificate: http://${LanHost}:8080/root.crt
Phone setup page: http://${LanHost}:8080/
Application:       https://${LanHost}
Root CA SHA-256:   $fingerprint

Before trusting root.crt, compare its SHA-256 fingerprint on the phone with the value above.
Service logs: $LogsDir
Back up databases; it contains both store data and the private Caddy CA.
"@
