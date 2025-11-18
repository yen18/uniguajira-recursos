# Función para crear servicio NSSM (opcional) para backend persistente
function Ensure-BackendService {
	param(
		[string]$ServiceName = 'YEN-Backend',
		[string]$NodePath = 'node',
		[string]$ScriptPath = 'C:\xampp\htdocs\yen\yen\backend\server.js'
	)
	if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
		Write-Host "Servicio $ServiceName ya existe." -ForegroundColor Cyan
		return
	}
	$nssm = Get-Command nssm -ErrorAction SilentlyContinue
	if (-not $nssm) {
		Write-Host "nssm no encontrado. Instala NSSM y añade al PATH para crear el servicio." -ForegroundColor Yellow
		return
	}
	Write-Host "Creando servicio NSSM $ServiceName..." -ForegroundColor Green
	& nssm install $ServiceName $NodePath $ScriptPath
	& nssm set $ServiceName Start SERVICE_AUTO_START
	& nssm set $ServiceName AppStdout C:\xampp\htdocs\yen\yen\backend\logs\backend.out.log
	& nssm set $ServiceName AppStderr C:\xampp\htdocs\yen\yen\backend\logs\backend.err.log
	& nssm set $ServiceName AppRotateFiles 1
	& nssm set $ServiceName AppRotateOnline 1
	& nssm set $ServiceName AppRotateSeconds 86400
	Write-Host "Servicio $ServiceName creado. Iniciando..." -ForegroundColor Green
	Start-Service $ServiceName
}

# Intentar crear servicio persistente si NSSM disponible
Ensure-BackendService
# Script para iniciar los servicios del proyecto YEN

Write-Host "Iniciando servicios del proyecto YEN..." -ForegroundColor Green

# Iniciar Backend
Write-Host "Iniciando Backend..." -ForegroundColor Yellow
# Verificar si ya está escuchando el backend para evitar duplicados
$backendPort = 3001
$existingBackend = (Get-NetTCPConnection -State Listen -LocalPort $backendPort -ErrorAction SilentlyContinue)
if ($existingBackend) {
	Write-Host "Backend ya está escuchando en puerto $backendPort. Se omite nuevo inicio." -ForegroundColor Cyan
} else {
	Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\xampp\htdocs\yen\yen\backend'; Write-Host 'Iniciando servidor backend...' -ForegroundColor Green; node server.js" | Out-Null
}

# Esperar un poco antes de iniciar el frontend
Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "Iniciando Frontend..." -ForegroundColor Yellow
$frontendPort = 3000
$existingFrontend = (Get-NetTCPConnection -State Listen -LocalPort $frontendPort -ErrorAction SilentlyContinue)
if ($existingFrontend) {
	Write-Host "Frontend ya está escuchando en puerto $frontendPort. Se omite nuevo inicio." -ForegroundColor Cyan
} else {
	Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\xampp\htdocs\yen\yen\frontend'; Write-Host 'Iniciando aplicación React...' -ForegroundColor Green; npm start" | Out-Null
}

Write-Host "Servicios verificados/iniciándose..." -ForegroundColor Green
Write-Host "Healthcheck (backend) -> http://localhost:$backendPort/api/health" -ForegroundColor Magenta
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Espere unos segundos para que se inicien completamente." -ForegroundColor Yellow