const express = require('express');
const { pool } = require('../config/database');
const sse = require('../utils/sse');
const router = express.Router();

// GET - Obtener todas las salas con estado dinámico
router.get('/', async (req, res) => {
    try {
        // Obtener fecha y hora actual
        const ahora = new Date();
        const fechaActual = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
        const horaActual = ahora.toTimeString().slice(0, 5); // HH:MM
        
        console.log('📅 Verificando estado dinámico de salas');
        console.log('📅 Fecha actual:', fechaActual);
        console.log('⏰ Hora actual:', horaActual);
        
        // Query para obtener salas con estado dinámico basado en reservas
        const query = `
            SELECT 
                s.id_sala,
                s.nombre,
                s.ubicacion,
                s.capacidad,
                s.estado as estado_base,
                s.roles_permitidos,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM solicitudes sol 
                        WHERE sol.id_sala = s.id_sala 
                        AND sol.fecha = ?
                        AND sol.estado_reserva = 'aprobado'
                        AND sol.hora_inicio <= ?
                        AND sol.hora_fin > ?
                    ) THEN 'ocupado'
                    ELSE 'disponible'
                END as estado_actual,
                (
                    SELECT CONCAT(sol.hora_inicio, ' - ', sol.hora_fin) 
                    FROM solicitudes sol 
                    WHERE sol.id_sala = s.id_sala 
                    AND sol.fecha = ?
                    AND sol.estado_reserva = 'aprobado'
                    AND sol.hora_inicio <= ?
                    AND sol.hora_fin > ?
                    LIMIT 1
                ) as horario_ocupado
            FROM salas s
            ORDER BY s.id_sala DESC
        `;
        
        const [rows] = await pool.execute(query, [
            fechaActual, horaActual, horaActual,
            fechaActual, horaActual, horaActual
        ]);
        
        // Mapear resultados para usar estado_actual como estado principal
        const salas = rows.map(row => ({
            ...row,
            estado: row.estado_actual,
            horario_ocupado: row.horario_ocupado || null
        }));
        
        console.log('🏢 Salas con estado dinámico:', salas);
        
        res.json({
            success: true,
            data: salas,
            count: salas.length,
            timestamp: ahora.toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo salas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo salas',
            error: error.message
        });
    }
});

// GET - Obtener salas disponibles
router.get('/disponibles', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM salas WHERE estado = "disponible" ORDER BY nombre');
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error obteniendo salas disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo salas disponibles',
            error: error.message
        });
    }
});

// GET - Obtener sala por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM salas WHERE id_sala = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo sala',
            error: error.message
        });
    }
});

// POST - Crear nueva sala
router.post('/', async (req, res) => {
    try {
        const { nombre, capacidad, ubicacion, estado = 'disponible', roles_permitidos } = req.body;

        // Validaciones básicas
        if (!nombre || !capacidad || !ubicacion) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, capacidad y ubicación son requeridos'
            });
        }

    // Validar roles permitidos (CSV o array). Normalizar a minúsculas CSV
    const allowed = ['administrador', 'profesor', 'estudiante'];
    // Por defecto: admin y profesor (estudiantes usualmente no solicitan salas)
    let rolesCsv = 'administrador,profesor';
        if (roles_permitidos) {
            const list = Array.isArray(roles_permitidos) ? roles_permitidos : String(roles_permitidos).split(',');
            const norm = list
                .map(r => String(r).trim().toLowerCase())
                .filter(r => allowed.includes(r));
            if (norm.length === 0) {
                return res.status(400).json({ success: false, message: 'roles_permitidos inválidos' });
            }
            rolesCsv = Array.from(new Set(norm)).join(',');
        }

        // Verificar si ya existe una sala con ese nombre
        const [existingSala] = await pool.execute(
            'SELECT id_sala FROM salas WHERE nombre = ?',
            [nombre]
        );

        if (existingSala.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una sala con ese nombre'
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO salas (nombre, capacidad, ubicacion, estado, roles_permitidos) VALUES (?, ?, ?, ?, ?)',
            [nombre, capacidad, ubicacion, estado, rolesCsv]
        );

        // Notificar a los clientes SSE
        try {
            sse.broadcast('salas:update', { action: 'create', id_sala: result.insertId });
        } catch (_) {}

        res.status(201).json({
            success: true,
            message: 'Sala creada exitosamente',
            data: {
                id_sala: result.insertId,
                nombre,
                capacidad,
                ubicacion,
                estado,
                roles_permitidos: rolesCsv
            }
        });
    } catch (error) {
        console.error('Error creando sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando sala',
            error: error.message
        });
    }
});

// PUT - Actualizar sala
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, capacidad, ubicacion, estado, roles_permitidos } = req.body;

        // Verificar si la sala existe
        const [existingSala] = await pool.execute('SELECT id_sala FROM salas WHERE id_sala = ?', [id]);
        if (existingSala.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada'
            });
        }

        // Preparar roles
        const allowed = ['administrador', 'profesor', 'estudiante'];
        let rolesCsv;
        if (typeof roles_permitidos !== 'undefined') {
            const list = Array.isArray(roles_permitidos) ? roles_permitidos : String(roles_permitidos).split(',');
            const norm = list.map(r => String(r).trim().toLowerCase()).filter(r => allowed.includes(r));
            if (norm.length === 0) {
                return res.status(400).json({ success: false, message: 'roles_permitidos inválidos' });
            }
            rolesCsv = Array.from(new Set(norm)).join(',');
        }

        const [result] = await pool.execute(
            `UPDATE salas SET nombre = ?, capacidad = ?, ubicacion = ?, estado = ?, 
             roles_permitidos = COALESCE(?, roles_permitidos) WHERE id_sala = ?`,
            [nombre, capacidad, ubicacion, estado, rolesCsv || null, id]
        );

        // Notificar actualización
        try {
            sse.broadcast('salas:update', { action: 'update', id_sala: Number(id) });
        } catch (_) {}

        res.json({
            success: true,
            message: 'Sala actualizada exitosamente',
            data: { id_sala: id, nombre, capacidad, ubicacion, estado, roles_permitidos: rolesCsv }
        });
    } catch (error) {
        console.error('Error actualizando sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando sala',
            error: error.message
        });
    }
});

// DELETE - Eliminar sala
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si la sala existe
        const [existingSala] = await pool.execute('SELECT id_sala FROM salas WHERE id_sala = ?', [id]);
        if (existingSala.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada'
            });
        }

        // Verificar si la sala tiene solicitudes asociadas
        const [solicitudes] = await pool.execute('SELECT COUNT(*) as count FROM solicitudes WHERE id_sala = ?', [id]);
        if (solicitudes[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar la sala porque tiene solicitudes asociadas'
            });
        }

        await pool.execute('DELETE FROM salas WHERE id_sala = ?', [id]);

        // Notificar eliminación
        try {
            sse.broadcast('salas:update', { action: 'delete', id_sala: Number(id) });
        } catch (_) {}

        res.json({
            success: true,
            message: 'Sala eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando sala',
            error: error.message
        });
    }
});

// PATCH - Cambiar estado de sala
router.patch('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !['disponible', 'ocupada'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado debe ser "disponible" u "ocupada"'
            });
        }

        // Verificar si la sala existe
        const [existingSala] = await pool.execute('SELECT id_sala FROM salas WHERE id_sala = ?', [id]);
        if (existingSala.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sala no encontrada'
            });
        }

        await pool.execute('UPDATE salas SET estado = ? WHERE id_sala = ?', [estado, id]);

        // Notificar cambio de estado
        try {
            sse.broadcast('salas:update', { action: 'estado', id_sala: Number(id), estado });
        } catch (_) {}

        res.json({
            success: true,
            message: `Estado de sala actualizado a ${estado}`,
            data: { id_sala: id, estado }
        });
    } catch (error) {
        console.error('Error actualizando estado de sala:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando estado de sala',
            error: error.message
        });
    }
});

// POST - Mantenimiento: normalizar roles_permitidos (remover 'estudiante')
router.post('/maintenance/normalize-roles', async (req, res) => {
    try {
        const sqlProcessed = `TRIM(BOTH ',' FROM REPLACE(REPLACE(REPLACE(LOWER(IFNULL(roles_permitidos,'')), 'estudiante,', ''), ',estudiante', ''), 'estudiante', ''))`;
        const updateQuery = `
            UPDATE salas SET roles_permitidos = 
            CASE WHEN ${sqlProcessed} = '' THEN 'administrador,profesor' ELSE ${sqlProcessed} END
        `;
        const [result] = await pool.execute(updateQuery);
        try { sse.broadcast('salas:update', { action: 'normalize-roles' }); } catch(_) {}
        res.json({ success: true, message: 'roles_permitidos normalizados', affectedRows: result.affectedRows });
    } catch (error) {
        console.error('Error normalizando roles_permitidos:', error);
        res.status(500).json({ success: false, message: 'Error normalizando roles', error: error.message });
    }
});

module.exports = router;