Param(
    [string]$KeystorePath = "keystore.jks",
    [string]$Alias = "yen-release"
)

Write-Host "== Android Release Signing Setup ==" -ForegroundColor Cyan

if (Test-Path $KeystorePath) {
    Write-Host "Keystore ya existe: $KeystorePath" -ForegroundColor Yellow
} else {
    $storePass = Read-Host "Ingresa contraseña para el keystore"
    $keyPass = Read-Host "Ingresa contraseña para la clave (puede ser igual)"
    Write-Host "Generando keystore..." -ForegroundColor Green
    & keytool -genkeypair -v -keystore $KeystorePath -alias $Alias -keyalg RSA -keysize 2048 -validity 3650 -storepass $storePass -keypass $keyPass -dname "CN=YEN,O=YEN,L=Local,ST=Local,C=CO"
    if (-not $?) { Write-Host "Error generando keystore" -ForegroundColor Red; exit 1 }
    Write-Host "Keystore creado." -ForegroundColor Green
}

# Cargar propiedades
$gradlePropsPath = (Resolve-Path "..\gradle.properties").Path
Write-Host "Actualizando $gradlePropsPath" -ForegroundColor Green

$existing = Get-Content $gradlePropsPath -ErrorAction SilentlyContinue

function Set-GradleProp($name, $value) {
    if ($existing -and ($existing | Select-String "^$name=").Count -gt 0) {
        $global:existing = $existing -replace "^$name=.*", "$name=$value"
    } else {
        Add-Content $gradlePropsPath "$name=$value"
    }
}

if (-not $storePass) { $storePass = Read-Host "Contraseña del keystore (storepass)" }
if (-not $keyPass) { $keyPass = Read-Host "Contraseña de la clave (keypass)" }

$absKeystore = (Resolve-Path $KeystorePath).Path
Set-GradleProp "RELEASE_STORE_FILE" $absKeystore
Set-GradleProp "RELEASE_STORE_PASSWORD" $storePass
Set-GradleProp "RELEASE_KEY_ALIAS" $Alias
Set-GradleProp "RELEASE_KEY_PASSWORD" $keyPass

Write-Host "Propiedades de firma configuradas." -ForegroundColor Green
Write-Host "Ejecuta: cd .. ; ./gradlew.bat assembleRelease" -ForegroundColor Cyan
