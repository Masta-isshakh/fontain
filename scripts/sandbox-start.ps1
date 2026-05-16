param(
  [string]$Profile = 'fontain',
  [string]$Region = 'ap-south-1',
  [switch]$Debug,
  [switch]$Once
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "[sandbox] using profile: $Profile"
Write-Host "[sandbox] enforcing region: $Region"
aws configure set region $Region --profile $Profile | Out-Null
aws configure set output json --profile $Profile | Out-Null

Write-Host '[sandbox] validating AWS credentials...'
try {
  aws sts get-caller-identity --profile $Profile | Out-Null
} catch {
  Write-Host '[sandbox] SSO token expired or missing. Opening login flow...'
  aws sso login --profile $Profile
  aws sts get-caller-identity --profile $Profile | Out-Null
}

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

Write-Host '[sandbox] starting Amplify sandbox...'
$ampxCmd = Join-Path $repoRoot 'node_modules/.bin/ampx.cmd'
if (-not (Test-Path $ampxCmd)) {
  throw "Cannot find local Amplify CLI at $ampxCmd. Run npm install first."
}

if (-not $env:npm_config_user_agent) {
  $env:npm_config_user_agent = 'npm/11 node/22'
}

$cmdArgs = @('sandbox', '--profile', $Profile)
if ($Debug) {
  $cmdArgs += '--debug'
}
if ($Once) {
  $cmdArgs += '--once'
}

& $ampxCmd @cmdArgs
