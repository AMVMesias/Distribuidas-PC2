$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$drive = $root.Substring(0, 1).ToLowerInvariant()
$relativePath = $root.Substring(2).Replace('\', '/')
$wslRoot = "/mnt/$drive$relativePath"
& wsl -d Ubuntu -- bash "$wslRoot/scripts/seed-demo.sh" @args
if ($LASTEXITCODE -ne 0) {
    throw "La carga de datos terminó con código $LASTEXITCODE"
}
