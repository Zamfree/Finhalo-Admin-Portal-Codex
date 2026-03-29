$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$pidFile = Join-Path $repoRoot ".runtime\libretranslate.pid"

if (-not (Test-Path $pidFile)) {
  Write-Output "LibreTranslate is not running (no PID file)."
  exit 0
}

$servicePid = (Get-Content $pidFile -Raw).Trim()
if (-not $servicePid) {
  Remove-Item $pidFile -Force
  Write-Output "Removed empty PID file."
  exit 0
}

$process = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id $servicePid -Force
  Write-Output "Stopped LibreTranslate (PID $servicePid)."
} else {
  Write-Output "No process found for PID $servicePid."
}

Remove-Item $pidFile -Force
