const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { testConnection, ensureSchema, pool } = require('./config/database');
require('dotenv').config();

// Importar rutas
const usuariosRoutes = require('./routes/usuarios');
const salasRoutes = require('./routes/salas');
const videoproyectoresRoutes = require('./routes/videoproyectores');
const solicitudesRoutes = require('./routes/solicitudes');
const sse = require('./utils/sse');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// CORS: permitir orígenes de desarrollo comunes (3000/3002/3003, localhost/LAN)
app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origen (herramientas locales / health checks)
        if (!origin) return callback(null, true);

        try {
            const url = new URL(origin);
            const hostname = url.hostname;
            const port = url.port;

            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
            const isLan = /^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
            const allowedPorts = new Set(['3000', '3001', '3002', '3003', '5173']);

            if ((isLocalhost || isLan) && (allowedPorts.has(port) || port === '')) {
                return callback(null, true);
            }
        } catch (e) {
            // Si falla el parseo, denegar más abajo
        }

        // Lista explícita adicional por si se personaliza el puerto
        const whitelist = [
            'http://localhost:3000',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3002',
            'http://127.0.0.1:3003'
        ];
        if (whitelist.includes(origin)) return callback(null, true);

        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Sistema de Recursos Audiovisuales - Universidad de La Guajira Sede Maicao',
        version: '1.0.0',
        status: 'active'
    });
});

// Raíz /api (para compatibilidad con testConnection)
app.get('/api', (req, res) => {
    res.json({ message: 'API root', commit: process.env.RENDER_GIT_COMMIT || process.env.COMMIT_HASH || 'unknown' });
});

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/salas', salasRoutes);
app.use('/api/videoproyectores', videoproyectoresRoutes);
app.use('/api/solicitudes', solicitudesRoutes);

// Stream SSE para notificaciones en vivo con control de saturación
app.get('/api/solicitudes/stream', (req, res) => {
    if (!sse.canAccept()) {
        return res.status(503).json({ success: false, error: 'sse_max_clients_exceeded' });
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write('retry: 5000\n\n');
    sse.register(res);
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

// Healthcheck
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
            rssMB: (mem.rss/1024/1024).toFixed(1),
            heapUsedMB: (mem.heapUsed/1024/1024).toFixed(1)
        }
    });
});

// Versión / commit activo (para despliegues alternos si este árbol se usa)
app.get('/api/version', (req, res) => {
    const commit = process.env.RENDER_GIT_COMMIT || process.env.COMMIT_HASH || 'unknown';
    res.json({ commit, server_time: new Date().toISOString(), sse_clients: sse.getClientCount() });
});

    // Ajustes de timeouts para conexiones keep-alive (mitiga sockets colgados)
    server.keepAliveTimeout = parseInt(process.env.KEEPALIVE_TIMEOUT_MS || '61000', 10);
    server.headersTimeout = parseInt(process.env.HEADERS_TIMEOUT_MS || '65000', 10);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware para manejo de errores
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicio rápido + ensureSchema en background
const startServer = async () => {
    console.time('startup.total');
    let dbConnected = false;
    try {
        console.time('startup.db');
        dbConnected = await testConnection();
        console.timeEnd('startup.db');
        if (!dbConnected) {
            console.log('⚠️  Arrancando sin conexión a BD (revisar configuración)');
        }
    } catch (e) {
        console.timeEnd('startup.db');
        console.warn('⚠️ Error conexión BD:', e.message);
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor en http://localhost:${PORT}`);
        console.log('� Endpoints: /api/usuarios /api/salas /api/videoproyectores /api/solicitudes /api/health');
    });

        // Evitar caída por errores no capturados (log y continuar si es posible)
        process.on('uncaughtException', (err) => {
            console.error('uncaughtException:', err);
        });
        process.on('unhandledRejection', (reason) => {
            console.error('unhandledRejection:', reason);
        });

    // Metrics periódicas (desarrollo)
    if (process.env.NODE_ENV !== 'production') {
        setInterval(() => {
            const m = process.memoryUsage();
            console.log(`[metrics] SSE=${sse.getClientCount()} heap=${(m.heapUsed/1024/1024).toFixed(1)}MB rss=${(m.rss/1024/1024).toFixed(1)}MB`);
        }, 300000);
    }

    const graceful = async (sig) => {
        console.log(`\n🛑 Señal ${sig} recibida. Cerrando...`);
        try {
            sse.closeAll();
            await new Promise(r => server.close(r));
            console.log('🔒 HTTP cerrado');
            try { await pool.end(); console.log('🗄️ Pool MySQL cerrado'); } catch {}
        } catch (err) {
            console.error('Error en cierre:', err);
        } finally {
            process.exit(0);
        }
    };
    ['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => graceful(sig)));

    if (process.env.SKIP_SCHEMA === '1') {
        console.log('⏩ SKIP_SCHEMA=1. Omitiendo ensureSchema.');
        console.timeEnd('startup.total');
        return;
    }

    setImmediate(async () => {
        console.time('startup.ensureSchema');
        try { await ensureSchema(); console.timeEnd('startup.ensureSchema'); }
        catch (err) { console.timeEnd('startup.ensureSchema'); console.warn('⚠️ ensureSchema falló:', err.message); }
        finally { console.timeEnd('startup.total'); }
    });
};

startServer();