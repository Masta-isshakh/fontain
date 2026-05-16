param(
  [string]$Profile = 'fontain',
  [string]$Region = 'ap-south-1',
  [switch]$Debug
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "[sandbox] using profile: $Profile"
Write-Host "[sandbox] enforcing region: $Region"
aws configure set region $Region --profile $Profile | Out-Null

# Clear stale sandbox processes that can lock synthesis.
Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -match 'ampx sandbox' -and
    $_.CommandLine -match [regex]::Escape($repoRoot)
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

# Clear stale CDK outdir lock/artifacts.
if (Test-Path '.amplify\artifacts\cdk.out') {
  Remove-Item -Recurse -Force '.amplify\artifacts\cdk.out' -ErrorAction SilentlyContinue
}

$args = @('ampx', 'sandbox', '--profile', $Profile)
if ($Debug) {
  $args += '--debug'
}

Write-Host '[sandbox] starting Amplify sandbox...'
$ampxCmd = Join-Path $repoRoot 'node_modules/.bin/ampx.cmd'
if (-not (Test-Path $ampxCmd)) {
  throw "Cannot find local Amplify CLI at $ampxCmd. Run npm install first."
}

if ($Debug) {
  & $ampxCmd sandbox --profile $Profile --debug
} else {
  & $ampxCmd sandbox --profile $Profile
}
