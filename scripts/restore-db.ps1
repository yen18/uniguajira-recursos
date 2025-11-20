param(
    [Parameter(Mandatory=$true)][string]$Host,
    [Parameter(Mandatory=$true)][int]$Port,
    [Parameter(Mandatory=$true)][string]$User,
    [Parameter(Mandatory=$true)][string]$Password,
    [Parameter(Mandatory=$true)][string]$Db,
    [string]$SqlPath = "..\database\gestion_de_recursos.sql"
)

function Fail($msg) { Write-Host $msg -ForegroundColor Red; exit 1 }

# Resolve SQL path relative to script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path $SqlPath)) {
  $SqlPath = Join-Path $ScriptDir $SqlPath
}
if (-not (Test-Path $SqlPath)) { Fail "No se encontró el SQL en: $SqlPath" }

# Verify mysql client
$mysql = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysql) { Fail "No se encontró el cliente 'mysql'. Instálalo (MySQL or MariaDB client) y vuelve a intentar." }

Write-Host "Importando $SqlPath a $Host:$Port (DB conexion=$Db) ..." -ForegroundColor Cyan

# Build secure args (avoid exposing password in process list by using --password= prompt)
$env:MYSQL_PWD = $Password

# Use --protocol=TCP to avoid socket surprises on Windows; --default-character-set=utf8mb4 for consistency
$cmd = @(
  "-h", $Host,
  "-P", $Port,
  "-u", $User,
  "--protocol=TCP",
  "--default-character-set=utf8mb4",
  $Db
)

# Run import
try {
  Get-Content -Raw -Path $SqlPath | & mysql @cmd
  if ($LASTEXITCODE -ne 0) { Fail "El import terminó con código $LASTEXITCODE" }
  Write-Host "✅ Importación completada" -ForegroundColor Green
}
catch {
  Fail ("Error ejecutando mysql: " + $_.Exception.Message)
}
finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue | Out-Null
}
