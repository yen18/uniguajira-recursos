const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection, ensureSchema, pool } = require('./config/database');
require('dotenv').config();
// Sentry observability (errors + perf)
let Sentry; // lazy require to keep startup minimal if DSN absent
if (process.env.SENTRY_DSN) {
    Sentry = require('@sentry/node');
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
        profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
        integrations: [nodeProfilingIntegration()],
    });
}

// Importar rutas
const usuariosRoutes = require('./routes/usuarios');
const salasRoutes = require('./routes/salas');
const videoproyectoresRoutes = require('./routes/videoproyectores');
const equiposRoutes = require('./routes/equipos');
const solicitudesRoutes = require('./routes/solicitudes');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const sse = require('./utils/sse');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
if (Sentry) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
}
// CORS: permitir orígenes del frontend web y del contenedor Capacitor (Android)
// Producción: usar CORS_ORIGINS= https://mi-dominio.com,https://otro-dominio.com
const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const defaultDevOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost',
    'http://127.0.0.1',
];
const baseAllowedOrigins = envOrigins.length > 0 ? envOrigins : defaultDevOrigins;
const allowedOrigins = Array.from(new Set([...baseAllowedOrigins, 'capacitor://localhost']));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // herramientas CLI o app nativa
        const isAllowed = allowedOrigins.includes(origin) || /^http:\/\/192\.168\./.test(origin);
        if (process.env.NODE_ENV === 'production' && envOrigins.length > 0) {
            return isAllowed ? callback(null, true) : callback(new Error('CORS_NOT_ALLOWED'), false);
        }
        // En desarrollo, relajar CORS para evitar bloqueos
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression()); // gzip responses

// Seguridad HTTP (headers). Ajuste CORP para permitir consumo desde Capacitor
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Confiar en proxy si existe (necesario para rate limit tras reverse proxy)
app.set('trust proxy', 1);

// Rate limiting global moderado
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '500', 10),
    standardHeaders: true,
    legacyHeaders: false
});
app.use(globalLimiter);

// Rate limiting estricto para intentos de login
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '20', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too_many_requests', message: 'Demasiados intentos, espera e inténtalo de nuevo.' }
});
app.use('/api/usuarios/login', authLimiter);

// Logging de requests (solo en desarrollo para reducir ruido en APK / producción)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Sistema de Recursos Audiovisuales - Universidad de La Guajira Sede Maicao',
        version: '1.0.0',
        status: 'active'
    });
});

// Raíz /api para testConnection del frontend (evita 404)
app.get('/api', (req, res) => {
    res.json({
        message: 'API root',
        commit: process.env.RENDER_GIT_COMMIT || process.env.COMMIT_HASH || 'unknown',
        time: new Date().toISOString()
    });
});

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/salas', salasRoutes);
app.use('/api/videoproyectores', videoproyectoresRoutes);
app.use('/api/equipos', equiposRoutes);
// Colocar el stream ANTES del router de solicitudes para evitar que /:id capture "stream"
app.get('/api/solicitudes/stream', (req, res) => {
    if (!sse.canAccept?.() && sse.getClientCount() >= parseInt(process.env.SSE_MAX_CLIENTS || '200', 10)) {
        return res.status(503).json({ success: false, error: 'sse_max_clients_exceeded' });
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write('retry: 5000\n\n');
    sse.register(res);
    console.log('[SSE] Cliente conectado. Total:', sse.getClientCount());
    req.on('close', () => {
        console.log('[SSE] Cliente desconectado. Total:', sse.getClientCount() - 1);
        try { res.end(); } catch {}
    });
});
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/admin', adminRoutes);

// Healthcheck / métricas básicas
app.get('/api/health', async (req, res) => {
    let dbOk = false;
    try { dbOk = await testConnection(); } catch { dbOk = false; }
    const mem = process.memoryUsage();
    res.json({
        status: 'ok',
        db: dbOk ? 'connected' : 'error',
        sse_clients: sse.getClientCount(),
        uptime_sec: Math.round(process.uptime()),
        memory: {
            rss: mem.rss,
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal
        }
    });
});

// Version info (commit hash / timestamp) para verificar despliegue activo
app.get('/api/version', (req, res) => {
    const commit = process.env.RENDER_GIT_COMMIT || process.env.COMMIT_HASH || 'unknown';
    res.json({
        commit,
        deployed_at: process.env.RENDER_GIT_COMMIT ? undefined : process.env.DEPLOYED_AT,
        server_time: new Date().toISOString(),
        sse_clients: sse.getClientCount()
    });
});

// Endpoint DEV para forzar broadcast SSE (solo no-producción)
app.get('/api/dev/broadcast', (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, message: 'No disponible en producción' });
        }
        const event = String(req.query.event || 'solicitudes:update');
        const payload = {
            action: 'test',
            at: new Date().toISOString(),
            note: 'Broadcast de prueba'
        };
        sse.broadcast(event, payload);
        res.json({ success: true, event, payload });
    } catch (error) {
        console.error('Error en dev/broadcast:', error);
        res.status(500).json({ success: false, message: 'Error en broadcast', error: error.message });
    }
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware para manejo de errores (Sentry captura si activo)
app.use((error, req, res, next) => {
    if (Sentry) Sentry.captureException(error);
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor (optimizado: arranca rápido y ejecuta ensureSchema en background)
const startServer = async () => {
    console.time('startup.total');
    let dbConnected = false;
    try {
        console.time('startup.db');
        dbConnected = await testConnection();
        console.timeEnd('startup.db');
        if (!dbConnected) {
            console.log('⚠️  Iniciando servidor sin conexión a BD (revisar configuración)');
        }
    } catch (error) {
        console.timeEnd('startup.db');
        console.warn('⚠️  Error probando conexión BD:', error.message);
    }

    // Levantar servidor inmediatamente (no esperar ALTER TABLE)
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
        console.log(`✅ Arranque parcial listo. Ejecutando tareas post-inicio...`);
        console.log(`📋 Endpoints:`);
        console.log(`   GET    /api/usuarios`);
        console.log(`   GET    /api/salas`);
        console.log(`   GET    /api/videoproyectores`);
        console.log(`   GET    /api/solicitudes`);
        console.log(`   GET    /api/health`);
    });

    // Ajustes de timeouts para conexiones keep-alive (mitiga sockets colgados)
    // headersTimeout debe ser mayor que keepAliveTimeout
    server.keepAliveTimeout = parseInt(process.env.KEEPALIVE_TIMEOUT_MS || '61000', 10);
    server.headersTimeout = parseInt(process.env.HEADERS_TIMEOUT_MS || '65000', 10);

    // Log periódico de métricas solo en desarrollo
    if (process.env.NODE_ENV !== 'production') {
        setInterval(() => {
            const mem = process.memoryUsage();
            console.log(`[metrics] SSE clients=${sse.getClientCount()} heapUsed=${(mem.heapUsed/1024/1024).toFixed(1)}MB RSS=${(mem.rss/1024/1024).toFixed(1)}MB`);
        }, 300000); // cada 5 min
    }

    // Cierre gracioso
    const shutdown = async (signal) => {
        console.log(`\n⏩ Recibido ${signal}, cerrando servidor...`);
        try {
            server.close(() => console.log('🔒 Servidor HTTP cerrado.'));
            sse.shutdownAll();
            try { await pool.end(); console.log('🗄️ Pool MySQL cerrado.'); } catch (e) { console.warn('⚠️ Error cerrando pool:', e.message); }
        } catch (err) {
            console.error('❌ Error en shutdown:', err);
        } finally {
            setTimeout(() => process.exit(0), 500).unref();
        }
    };
    ['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));

    // Evitar caída por errores no capturados (log y continuar si es seguro)
    process.on('uncaughtException', (err) => {
        console.error('uncaughtException:', err);
    });
    process.on('unhandledRejection', (reason) => {
        console.error('unhandledRejection:', reason);
    });

    // Ejecutar ensureSchema en segundo plano salvo que se indique SKIP_SCHEMA
    if (process.env.SKIP_SCHEMA === '1') {
        console.log('⏩ SKIP_SCHEMA=1: omitida verificación/alteración de esquema.');
        console.timeEnd('startup.total');
        return;
    }

    setImmediate(async () => {
        console.time('startup.ensureSchema');
        try {
            await ensureSchema();
            console.timeEnd('startup.ensureSchema');
        } catch (err) {
            console.timeEnd('startup.ensureSchema');
            console.warn('⚠️  ensureSchema falló:', err.message);
        } finally {
            console.timeEnd('startup.total');
        }
    });
};

startServer();

// =============================
// Ocupación dinámica por horario
// =============================
// Cada minuto recalcula qué recursos deben estar "ocupada" según solicitudes aprobadas
// actuales (fecha = hoy y hora_actual entre hora_inicio y hora_fin). El resto vuelve a
// "disponible" si no tiene otra reserva activa.
function recalculateDynamicOccupancy() {
    const now = new Date();
    const todayStr = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-'); // Fecha local YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0,8);  // HH:MM:SS
    (async () => {
        try {
            // Solicitudes activas ahora
            const [active] = await pool.execute(
                `SELECT id_sala, id_videoproyector, id_equipo, servicio
                 FROM solicitudes
                 WHERE fecha = ?
                   AND estado_reserva = 'aprobado'
                   AND hora_inicio <= ? AND hora_fin > ?`,
                [todayStr, timeStr, timeStr]
            );
            const salasActivas = new Set(active.filter(a => a.servicio === 'sala' && a.id_sala).map(a => a.id_sala));
            const vpActivos = new Set(active.filter(a => a.servicio === 'videoproyector' && a.id_videoproyector).map(a => a.id_videoproyector));
            const eqActivos = new Set(active.filter(a => ['videocamara','dvd','extension','audio','vhs','otros'].includes(a.servicio) && a.id_equipo).map(a => a.id_equipo));

            // Actualizar salas
            await pool.execute('UPDATE salas SET estado = "disponible"');
            if (salasActivas.size) {
                await pool.execute(`UPDATE salas SET estado = 'ocupada' WHERE id_sala IN (${[...salasActivas].map(()=>'?').join(',')})`, [...salasActivas]);
            }
            // Actualizar videoproyectores
            await pool.execute('UPDATE videoproyectores SET estado = "disponible"');
            if (vpActivos.size) {
                await pool.execute(`UPDATE videoproyectores SET estado = 'ocupada' WHERE id_videoproyector IN (${[...vpActivos].map(()=>'?').join(',')})`, [...vpActivos]);
            }
            // Actualizar equipos
            await pool.execute('UPDATE equipos SET estado = "disponible" WHERE estado != "mantenimiento" AND estado != "inactivo"');
            if (eqActivos.size) {
                await pool.execute(`UPDATE equipos SET estado = 'ocupada' WHERE id_equipo IN (${[...eqActivos].map(()=>'?').join(',')})`, [...eqActivos]);
            }
            // Broadcast sólo si hay clientes SSE (reduce ruido)
            if (sse.getClientCount() > 0) {
                sse.broadcast('solicitudes:update', { action: 'occupancy_refresh', at: now.toISOString() });
            }
        } catch (e) {
            console.warn('[occupancy] Error recalculando ocupación:', e.message);
        }
    })();
}

// Intervalo cada 60s (ajustable)
setInterval(recalculateDynamicOccupancy, parseInt(process.env.OCCUPANCY_INTERVAL_MS || '60000',10));
console.log('⏱️ Ocupación dinámica activada (intervalo', process.env.OCCUPANCY_INTERVAL_MS || '60000', 'ms)');