const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
// SSL opcional (algunos proveedores como PlanetScale/Aiven lo requieren)
let sslOptions;
if (process.env.DB_SSL === '1' || process.env.DB_SSL === 'true') {
    sslOptions = {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
    };
    if (process.env.DB_SSL_CA) {
        // Permitir cargar CA desde env (usar \n en el valor)
        sslOptions.ca = process.env.DB_SSL_CA.replace(/\\n/g, '\n');
    }
}

const CONNECT_TIMEOUT = parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '15000', 10);
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_de_recursos',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_MAX || '10', 10),
    queueLimit: 0,
    connectTimeout: CONNECT_TIMEOUT,
    ...(sslOptions ? { ssl: sslOptions } : {})
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión con reintentos iniciales
const testConnection = async () => {
    const retries = parseInt(process.env.DB_INIT_RETRIES || '3', 10);
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const connection = await pool.getConnection();
            console.log(`✅ Conexión MySQL exitosa (intento ${attempt})`);
            connection.release();
            return true;
        } catch (error) {
            const details = [error.message, error.code, error.errno, error.sqlState].filter(Boolean).join(' | ');
            console.warn(`⚠️ Falló conexión MySQL intento ${attempt}/${retries}:`, details);
            if (attempt === retries) {
                console.error('❌ Error conectando a MySQL tras reintentos');
                return false;
            }
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
    return false;
};

// Ping keepalive para evitar timeouts en proveedores que cierran conexiones inactivas
const PING_INTERVAL = parseInt(process.env.DB_PING_INTERVAL_MS || '300000', 10); // 5 min
if (PING_INTERVAL > 0) {
    setInterval(() => {
        pool.query('SELECT 1').catch(() => {});
    }, PING_INTERVAL).unref();
}

// Asegurar cambios mínimos de esquema requeridos por el frontend
const ensureSchema = async () => {
    try {
        const conn = await pool.getConnection();
        try {
            // MariaDB 10.6 soporta IF NOT EXISTS
            await conn.query(`
                ALTER TABLE solicitudes 
                ADD COLUMN IF NOT EXISTS tipo_actividad VARCHAR(100) NULL DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS numero_asistentes VARCHAR(50) NULL DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS equip_videocamara TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_dvd TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_extension TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_audio TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_vhs TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_otros TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_cual VARCHAR(100) NULL DEFAULT NULL;
            `);
            console.log('🛠️ Esquema verificado/actualizado: columnas adicionales en solicitudes');

            // Campo para controlar roles permitidos por sala (CSV en minúsculas)
            await conn.query(`
                ALTER TABLE salas
                ADD COLUMN IF NOT EXISTS roles_permitidos VARCHAR(100) NOT NULL 
                DEFAULT 'administrador,profesor,estudiante';
            `);
            console.log('🛠️ Esquema verificado/actualizado: roles_permitidos en salas');

            // Tabla para ocupaciones especiales por administrador (bloqueos sin horario)
            await conn.query(`
                CREATE TABLE IF NOT EXISTS ocupaciones_especiales (
                    id_ocupacion INT AUTO_INCREMENT PRIMARY KEY,
                    tipo_servicio ENUM('sala','videoproyector') NOT NULL,
                    id_recurso INT NOT NULL,
                    nota VARCHAR(255) NULL,
                    creado_por INT NULL,
                    activo TINYINT(1) NOT NULL DEFAULT 1,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    released_at TIMESTAMP NULL DEFAULT NULL,
                    INDEX idx_servicio_recurso (tipo_servicio, id_recurso, activo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('🛠️ Esquema verificado/actualizado: ocupaciones_especiales');

            // Catálogo administrable de equipos adicionales para solicitudes
            await conn.query(`
                CREATE TABLE IF NOT EXISTS catalogo_equipos (
                    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
                    clave VARCHAR(50) NOT NULL UNIQUE,
                    nombre VARCHAR(100) NOT NULL,
                    activo TINYINT(1) NOT NULL DEFAULT 1,
                    orden INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('🛠️ Esquema verificado/actualizado: catalogo_equipos');

            // Semillas por defecto si la tabla está vacía
            const [rows] = await conn.query('SELECT COUNT(*) AS c FROM catalogo_equipos');
            if (rows && rows[0] && Number(rows[0].c) === 0) {
                await conn.query(
                    `INSERT INTO catalogo_equipos (clave, nombre, activo, orden) VALUES 
                    ('videocamara','Videocámara',1,1),
                    ('dvd','DVD',1,2),
                    ('extension','Extensión (cable)',1,3),
                    ('audio','Audio',1,4),
                    ('vhs','VHS',1,5),
                    ('otros','Otros',1,6)`
                );
                console.log('🌱 Catálogo de equipos inicial sembrado');
            }

            // Inventario de equipos (recursos) gestionados igual que videoproyectores/salas
            await conn.query(`
                CREATE TABLE IF NOT EXISTS equipos (
                    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
                    tipo ENUM('videocamara','dvd','extension','audio','vhs','otros') NOT NULL,
                    nombre VARCHAR(100) NOT NULL,
                    descripcion VARCHAR(255) NULL,
                    estado ENUM('disponible','ocupada','mantenimiento','inactivo') NOT NULL DEFAULT 'disponible',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NULL DEFAULT NULL,
                    INDEX idx_tipo_estado (tipo, estado)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('🛠️ Esquema verificado/actualizado: equipos');

            // Relación de solicitudes con equipos (opcional según tipo de servicio)
            await conn.query(`
                ALTER TABLE solicitudes
                ADD COLUMN IF NOT EXISTS id_equipo INT NULL DEFAULT NULL,
                ADD INDEX IF NOT EXISTS idx_id_equipo (id_equipo);
            `);
            console.log('🛠️ Esquema verificado/actualizado: columna id_equipo en solicitudes');

            // Ampliar ENUM de historial_reservas para incluir 'anulado'
            try {
                await conn.query(`
                    ALTER TABLE historial_reservas
                    MODIFY COLUMN estado_anterior ENUM('pendiente','aprobado','rechazado','anulado') NULL DEFAULT NULL,
                    MODIFY COLUMN estado_nuevo    ENUM('pendiente','aprobado','rechazado','anulado') NULL DEFAULT NULL;
                `);
                console.log('🛠️ Esquema verificado/actualizado: historial_reservas admite anulado');
            } catch (e) {
                console.warn('⚠️ No se pudo ajustar historial_reservas (posible falta de tabla o permisos):', e.message);
            }
        } finally {
            conn.release();
        }
    } catch (err) {
        console.warn('⚠️ No se pudo garantizar el esquema automáticamente:', err.message);
    }
};

module.exports = {
    pool,
    testConnection,
    ensureSchema
};