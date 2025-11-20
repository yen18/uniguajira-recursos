# Uniguajira Recursos

Sistema integral para la gestión de salas, videoproyectores y equipos adicionales, con autenticación JWT, flujo de actualización silenciosa de contraseñas (migración hash), SSE para actualizaciones en vivo y versión móvil (APK) vía Capacitor.

## Características
- CRUD de usuarios, salas, videoproyectores, equipos y solicitudes.
- Catálogo administrable de tipos de equipos.
- Autenticación con access + refresh tokens (rotación segura, hash almacenado, cookie httpOnly para refresh en web).
- Password hashing (bcrypt) y migración automática de contraseñas antiguas en texto plano.
- Validación estricta de contraseñas (regex fuerte) y reset con token temporal.
- SSE (Server Sent Events) para notificaciones instantáneas de cambios.
- Frontend React + MUI + offline queue básica.
- Mobile: Capacitor (Android APK) consumiendo la misma API pública HTTPS.
- Despliegue previsto con Docker + Caddy (HTTPS automático) o Render.

## Estructura
```
backend/              # API Express (server.js punto de entrada)
  routes/             # Módulos de rutas (usuarios, auth, salas, videoproyectores, equipos, solicitudes, admin)
  utils/              # auth (JWT/bcrypt), sse, mailer, validation
  config/database.js  # Pool MySQL y ensureSchema
  package.json
frontend/             # Aplicación React (SPA + Capacitor)
  src/                # Código fuente React
    services/         # api.js (Axios), authToken.js (storage)
    components/       # Equipos, Dashboard, etc.
    design/           # tokens UI
  public/             # index.html
  package.json
deploy/               # docker-compose.yml, Caddyfile, backend.env.example
capacitor.config.json # Configuración Capacitor
render.yaml           # Configuración opcional para Render
```

## Requisitos
- Node.js >= 18
- MySQL/MariaDB >= 10.6
- npm >= 8

## Entorno Backend (.env)
Ejemplo (ver también deploy/backend.env.example):
```
PORT=3001
DB_HOST=localhost
DB_USER=appuser
DB_PASSWORD=appPassFuerte
DB_NAME=gestion_de_recursos
JWT_SECRET=CAMBIAR_A_UN_VALOR_MUY_SEGURO
ACCESS_TOKEN_TTL_MIN=15
REFRESH_TOKEN_TTL_DAYS=7
FRONTEND_RESET_URL=https://tu-dominio.com/reset-password
CORS_ORIGINS=https://tu-dominio.com
PASSWORD_RESET_TTL_MIN=30
```

## Entorno Frontend (.env.production)
```
REACT_APP_API_URL=https://tu-dominio.com/api
REACT_APP_DEBUG=false
```

## Scripts útiles
```
# Backend
cd backend
npm install
node server.js

# Frontend (desarrollo)
cd frontend
npm install
npm start

# Build producción frontend
npm run build
```

## Despliegue Docker (simplificado)
```
cd deploy
cp backend.env.example backend.env
# Editar backend.env con credenciales
export APP_DOMAIN=tu-dominio.com
export ACME_EMAIL=admin@tu-dominio.com
docker compose up -d --build
```

## Despliegue en Render (Git Auto Deploy)

1. Crear repositorio en GitHub (público o privado) y subir esta estructura.
2. En Render: "New +" -> "Web Service" -> conectar con GitHub y seleccionar el repo.
3. Elegir la carpeta `backend` para el servicio Node (o usar `render.yaml` para configuración automática de ambos servicios).
4. Si usas `render.yaml` (ya incluido), Render detectará y creará dos servicios:
  - `yen-backend` (Node) rama `main` con `buildCommand: npm ci` y `startCommand: node server.js`.
  - `yen-frontend` (Static) rama `main` con build React y publicación de `build/`.
5. Configurar variables de entorno marcadas como `sync: false` en la UI de Render (DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET, CORS_ORIGINS, FRONTEND_RESET_URL, REACT_APP_API_URL).
6. Para `REACT_APP_API_URL` usar la URL pública del backend + `/api` (ej: `https://yen-backend.onrender.com/api`).
7. Guardar y habilitar Auto Deploy (queda activo por `autoDeploy: true` + `branch: main`). Cada `git push origin main` dispara build.
8. Verificar salud del backend en `/api/health` y luego probar solicitudes desde el frontend.

### Migraciones / Esquema
`SKIP_SCHEMA=0` permite que el backend ejecute `ensureSchema` al arrancar (ALTER TABLE ligeros). Para entornos críticos puedes poner `SKIP_SCHEMA=1` y gestionar migraciones manualmente.

### Ajustes de Rendimiento
- `OCCUPANCY_INTERVAL_MS` controla cada cuánto se recalcula la ocupación dinámica (default 60000 ms). Puedes subirlo (120000) para reducir carga.
- Usa la región más cercana a tu base de datos para menor latencia.

### Deploy Manual sin render.yaml
Si prefieres crear servicios manualmente:
Backend:
```
Build Command: npm ci
Start Command: node server.js
Root Directory: backend
```
Frontend:
```
Build Command: npm ci --legacy-peer-deps && npm run build
Publish Directory: frontend/build
Root Directory: frontend
```

### Flujos de Actualización
- En cada push a `main` se reconstruye backend y frontend (frontend sólo si cambian archivos bajo `frontend/`).
- Puedes activar "Pull Request Previews" en Render si deseas entornos temporales (no configurado en `render.yaml`).

### Troubleshooting
- Error DB conexión: revisa host/puerto/credenciales y firewall del proveedor MySQL.
- CORS bloqueado: confirma `CORS_ORIGINS` incluye exactamente el dominio del frontend (sin slash final) y `capacitor://localhost` si mobile.
- JWT inválido tras deploy: asegurarte de no rotar `JWT_SECRET` sin invalidar refresh tokens.
- Horas o fechas incorrectas: verificar zona horaria del contenedor; se usa fecha local mediante `new Date()` sin UTC.

### Pipeline Git Básico
```
git add .
git commit -m "feat: ajustes despliegue render"
git push origin main
# Render construye automáticamente
```

### Próximas Mejoras
- Agregar `pullRequestPreviewsEnabled: true` a `render.yaml` si se requieren entornos por PR.
- Separar base de datos administrada (PlanetScale/Railway) con backups automáticos.
- Añadir monitoreo (Sentry / Logflare) y métricas de rendimiento.


## Seguridad
- No subir archivos .env ni keystore.
- Usar contraseñas fuertes y rotarlas periódicamente.
- Configurar CORS_ORIGINS solo con los dominios válidos en producción.

## API (Resumen rápido)
- GET /api/usuarios
- POST /api/usuarios/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/password/forgot
- POST /api/auth/password/reset
- CRUD /api/salas, /api/videoproyectores, /api/equipos, /api/solicitudes
- /api/admin/equipos (catálogo), /api/solicitudes/stream (SSE)

## Próximos pasos
- Subir backend a servidor público o servicio (Render / VPS).
- Generar build frontend y servir con HTTPS.
- Compilar APK release (Capacitor + firma).
- Hardening: rate limits adecuados, logs rotación, backups DB.

## Licencia
Agregar licencia elegida (MIT, Apache 2.0, etc.) si aplica.
