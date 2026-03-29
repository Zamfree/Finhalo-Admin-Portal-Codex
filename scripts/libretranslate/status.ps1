$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$pidFile = Join-Path $repoRoot ".runtime\libretranslate.pid"

if (-not (Test-Path $pidFile)) {
  Write-Output "LibreTranslate status: stopped (no PID file)."
  exit 0
}

$servicePid = (Get-Content $pidFile -Raw).Trim()
if (-not $servicePid) {
  Write-Output "LibreTranslate status: unknown (empty PID file)."
  exit 0
}

$process = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
if ($process) {
  Write-Output "LibreTranslate status: running (PID $servicePid)."
  exit 0
}

Write-Output "LibreTranslate status: stale PID file (PID $servicePid not found)."
