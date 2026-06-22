[CmdletBinding()]
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $root '.env'
$example = Join-Path $root '.env.example'
$secrets = Join-Path $root '.secrets'
$privateKey = Join-Path $secrets 'jwt-private.pem'
$publicKey = Join-Path $secrets 'jwt-public.pem'
$template = Join-Path $root 'infrastructure\kong\kong.yml.template'
$output = Join-Path $root 'infrastructure\kong\kong.yml'

if (-not (Test-Path $envFile)) { Copy-Item -LiteralPath $example -Destination $envFile }
New-Item -ItemType Directory -Path $secrets -Force | Out-Null

if ($Force -or -not (Test-Path $privateKey) -or -not (Test-Path $publicKey)) {
    & openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out $privateKey
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo generar la clave privada con OpenSSL' }
    & openssl rsa -pubout -in $privateKey -out $publicKey
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo generar la clave pública con OpenSSL' }
}

$settings = @{}
Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -and -not $_.StartsWith('#') -and $_.Contains('=')) {
        $pair = $_ -split '=', 2
        $settings[$pair[0].Trim()] = $pair[1].Trim()
    }
}

$origins = @($settings['CORS_ORIGINS'] -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$originsJson = ConvertTo-Json -InputObject $origins -Compress
$publicPem = ((Get-Content -LiteralPath $publicKey) | ForEach-Object { $_.TrimEnd("`r") } | ForEach-Object { "          $_" }) -join "`n"
$rendered = (Get-Content -Raw -LiteralPath $template)
$rendered = $rendered.Replace('__JWT_ISSUER__', $settings['JWT_ISSUER'])
$rendered = $rendered.Replace('__CORS_ORIGINS__', $originsJson)
$rendered = $rendered.Replace('__JWT_PUBLIC_KEY__', $publicPem)
Set-Content -LiteralPath $output -Value $rendered -Encoding utf8NoBOM

Write-Host 'Configuración local generada. Ejecuta: docker compose up --build'
