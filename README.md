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
