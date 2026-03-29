$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$runtimeDir = Join-Path $repoRoot ".runtime"
$pidFile = Join-Path $runtimeDir "libretranslate.pid"
$stdoutLog = Join-Path $runtimeDir "libretranslate.out.log"
$stderrLog = Join-Path $runtimeDir "libretranslate.err.log"
$exe = "C:\Users\zamfr\AppData\Roaming\Python\Python314\Scripts\libretranslate.exe"

if (-not (Test-Path $exe)) {
  throw "LibreTranslate executable not found: $exe"
}

if (-not (Test-Path $runtimeDir)) {
  New-Item -Path $runtimeDir -ItemType Directory | Out-Null
}

if (Test-Path $pidFile) {
  $existingPid = (Get-Content $pidFile -Raw).Trim()
  if ($existingPid) {
    $existing = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($existing) {
      Write-Output "LibreTranslate already running (PID $existingPid)."
      exit 0
    }
  }
}

$args = @(
  "--host", "127.0.0.1",
  "--port", "5000",
  "--disable-web-ui",
  "--load-only", "en,zh",
  "--threads", "2"
)

$process = Start-Process `
  -FilePath $exe `
  -ArgumentList $args `
  -PassThru `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog

Set-Content -Path $pidFile -Value $process.Id
Write-Output "LibreTranslate started (PID $($process.Id)) on http://127.0.0.1:5000"
