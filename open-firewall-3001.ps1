# Abre puerto 3001 en el Firewall de Windows para acceder desde LAN
# Ejecutar este script como Administrador

# Autoelevación (si no es admin)
$windowsIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$windowsPrincipal = New-Object Security.Principal.WindowsPrincipal($windowsIdentity)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator
if (-not $windowsPrincipal.IsInRole($adminRole)) {
    Write-Host "Requiere permisos de Administrador. Reintentando..." -ForegroundColor Yellow
    Start-Process powershell -Verb runAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "Creando regla de firewall para TCP 3001..." -ForegroundColor Cyan
try {
    netsh advfirewall firewall add rule name="YEN Backend 3001" dir=in action=allow protocol=TCP localport=3001 | Out-Null
    Write-Host "Regla creada o ya existente." -ForegroundColor Green
} catch {
    Write-Host "No se pudo crear la regla: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Reglas actuales para el puerto 3001:" -ForegroundColor Cyan
netsh advfirewall firewall show rule name="YEN Backend 3001"

Write-Host "Listo. Ahora pruebe desde otro dispositivo: http://<SU_IP_LAN>:3001/ (ej: http://192.168.1.45:3001/)" -ForegroundColor Green
