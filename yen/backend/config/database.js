const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
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
    connectTimeout: CONNECT_TIMEOUT
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión con reintentos
const testConnection = async () => {
    const retries = parseInt(process.env.DB_INIT_RETRIES || '3', 10);
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const connection = await pool.getConnection();
            console.log(`✅ Conexión MySQL exitosa (intento ${attempt})`);
            connection.release();
            return true;
        } catch (error) {
            console.warn(`⚠️ Falló conexión MySQL intento ${attempt}/${retries}:`, error.message);
            if (attempt === retries) {
                console.error('❌ Error conectando a MySQL tras reintentos');
                return false;
            }
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
    return false;
};

// Ping keepalive
const PING_INTERVAL = parseInt(process.env.DB_PING_INTERVAL_MS || '300000', 10);
if (PING_INTERVAL > 0) {
    setInterval(() => { pool.query('SELECT 1').catch(()=>{}); }, PING_INTERVAL).unref();
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
                ADD COLUMN IF NOT EXISTS numero_asistentes VARCHAR(50) NULL DEFAULT NULL;
            `);
            console.log('🛠️ Esquema verificado/actualizado: columnas adicionales en solicitudes');

            // Campo para controlar roles permitidos por sala (CSV en minúsculas)
            await conn.query(`
                ALTER TABLE salas
                ADD COLUMN IF NOT EXISTS roles_permitidos VARCHAR(100) NOT NULL 
                DEFAULT 'administrador,profesor,estudiante';
            `);
            console.log('🛠️ Esquema verificado/actualizado: roles_permitidos en salas');
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