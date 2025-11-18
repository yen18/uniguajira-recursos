const express = require('express');
const { pool } = require('../config/database');
const sse = require('../utils/sse');
const router = express.Router();

// Helper para formatear fecha LOCAL como YYYY-MM-DD (evita desfase por UTC)
const formatLocalDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// GET - Obtener todos los videoproyectores con estado dinámico
router.get('/', async (req, res) => {
    try {
        // Obtener fecha y hora actual
        const ahora = new Date();
        const fechaActual = formatLocalDate(ahora); // YYYY-MM-DD (local)
    // Construir hora local con segundos para coincidir con columnas TIME
    const pad2 = (n) => String(n).padStart(2, '0');
    const horaActual = `${pad2(ahora.getHours())}:${pad2(ahora.getMinutes())}:${pad2(ahora.getSeconds())}`; // HH:MM:SS (local)
        
        console.log('📅 Verificando estado dinámico de videoproyectores');
        console.log('📅 Fecha actual:', fechaActual);
        console.log('⏰ Hora actual:', horaActual);
        
        // Leer parámetros opcionales para chequear un rango solicitado
        const { fecha: fechaReq, hi: horaIniReq, hf: horaFinReq } = req.query || {};
        const hasRange = Boolean(fechaReq && horaIniReq && horaFinReq);

        // Query base para obtener videoproyectores con estado dinámico basado en reservas
        let query = `
            SELECT 
                v.id_videoproyector,
                v.nombre,
                v.ubicacion,
                v.estado as estado_base,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM solicitudes s 
                        WHERE s.id_videoproyector = v.id_videoproyector 
                        AND s.fecha = ?
                        AND s.estado_reserva IN ('aprobado','aprobada')
                        AND s.hora_inicio <= ?
                        AND s.hora_fin > ?
                    ) OR EXISTS (
                        SELECT 1 FROM ocupaciones_especiales oe
                        WHERE oe.tipo_servicio='videoproyector' AND oe.id_recurso=v.id_videoproyector AND oe.activo=1
                    ) THEN 'ocupado'
                    ELSE 'disponible'
                END as estado_actual,
                (
                    SELECT CONCAT(s.hora_inicio, ' - ', s.hora_fin) 
                    FROM solicitudes s 
                    WHERE s.id_videoproyector = v.id_videoproyector 
                    AND s.fecha = ?
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND s.hora_inicio <= ?
                    AND s.hora_fin > ?
                    LIMIT 1
                ) as horario_ocupado,
                (
                    CASE 
                      WHEN EXISTS (
                        SELECT 1 FROM ocupaciones_especiales oe
                        WHERE oe.tipo_servicio='videoproyector' AND oe.id_recurso=v.id_videoproyector AND oe.activo=1
                      ) THEN 'administrador'
                      ELSE (
                        SELECT CASE LOWER(u.tipo_de_usuario)
                                 WHEN 'profesor' THEN 'profesor'
                                 WHEN 'administrador' THEN 'administrador'
                                 ELSE 'alumno'
                               END
                        FROM solicitudes s
                        INNER JOIN usuarios u ON u.id_usuario = s.id_usuario
                        WHERE s.id_videoproyector = v.id_videoproyector
                        AND s.fecha = ?
                        AND s.estado_reserva IN ('aprobado','aprobada')
                        AND s.hora_inicio <= ?
                        AND s.hora_fin > ?
                        LIMIT 1
                      )
                    END
                ) as actual_por,
                (
                    SELECT s.id_solicitud
                    FROM solicitudes s
                    WHERE s.id_videoproyector = v.id_videoproyector
                    AND s.fecha = ?
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND s.hora_inicio <= ?
                    AND s.hora_fin > ?
                    LIMIT 1
                ) as actual_id_solicitud,
                -- Próxima reserva (a partir de ahora)
                (
                    SELECT s.fecha
                    FROM solicitudes s
                    WHERE s.id_videoproyector = v.id_videoproyector
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND (s.fecha > ? OR (s.fecha = ? AND s.hora_inicio > ?))
                    ORDER BY s.fecha ASC, s.hora_inicio ASC
                    LIMIT 1
                ) as proxima_fecha,
                (
                    SELECT CONCAT(s.hora_inicio, ' - ', s.hora_fin)
                    FROM solicitudes s
                    WHERE s.id_videoproyector = v.id_videoproyector
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND (s.fecha > ? OR (s.fecha = ? AND s.hora_inicio > ?))
                    ORDER BY s.fecha ASC, s.hora_inicio ASC
                    LIMIT 1
                ) as proximo_horario,
                (
                    SELECT s.hora_inicio
                    FROM solicitudes s
                    WHERE s.id_videoproyector = v.id_videoproyector
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND (s.fecha > ? OR (s.fecha = ? AND s.hora_inicio > ?))
                    ORDER BY s.fecha ASC, s.hora_inicio ASC
                    LIMIT 1
                ) as proxima_hora_inicio,
                (
                    SELECT CASE LOWER(u.tipo_de_usuario)
                             WHEN 'profesor' THEN 'profesor'
                             WHEN 'administrador' THEN 'administrador'
                             ELSE 'alumno'
                           END
                    FROM solicitudes s
                    INNER JOIN usuarios u ON u.id_usuario = s.id_usuario
                    WHERE s.id_videoproyector = v.id_videoproyector
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND (s.fecha > ? OR (s.fecha = ? AND s.hora_inicio > ?))
                    ORDER BY s.fecha ASC, s.hora_inicio ASC
                    LIMIT 1
                ) as proximo_por,
                (
                    SELECT s.id_solicitud
                    FROM solicitudes s
                    WHERE s.id_videoproyector = v.id_videoproyector
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND (s.fecha > ? OR (s.fecha = ? AND s.hora_inicio > ?))
                    ORDER BY s.fecha ASC, s.hora_inicio ASC
                    LIMIT 1
                ) as proxima_id_solicitud`;

        if (hasRange) {
            query += `,
                -- Ocupación en el rango solicitado
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM solicitudes s 
                        WHERE s.id_videoproyector = v.id_videoproyector
                        AND s.estado_reserva IN ('aprobado','aprobada')
                        AND s.fecha = ?
                        AND (s.hora_inicio < ? AND s.hora_fin > ?)
                    ) THEN 1 ELSE 0 END as ocupado_en_rango,
                (
                    SELECT CASE LOWER(u.tipo_de_usuario)
                             WHEN 'profesor' THEN 'profesor'
                             WHEN 'administrador' THEN 'administrador'
                             ELSE 'alumno'
                           END
                    FROM solicitudes s
                    INNER JOIN usuarios u ON u.id_usuario = s.id_usuario
                    WHERE s.id_videoproyector = v.id_videoproyector
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND s.fecha = ?
                    AND (s.hora_inicio < ? AND s.hora_fin > ?)
                    ORDER BY s.hora_inicio ASC
                    LIMIT 1
                ) as por_en_rango,
                (
                    SELECT s.id_solicitud
                    FROM solicitudes s
                    WHERE s.id_videoproyector = v.id_videoproyector
                    AND s.estado_reserva IN ('aprobado','aprobada')
                    AND s.fecha = ?
                    AND (s.hora_inicio < ? AND s.hora_fin > ?)
                    ORDER BY s.hora_inicio ASC
                    LIMIT 1
                ) as id_solicitud_en_rango`;
        } else {
            query += `,
                NULL as ocupado_en_rango,
                NULL as por_en_rango,
                NULL as id_solicitud_en_rango`;
        }

        query += `
            FROM videoproyectores v
            ORDER BY v.id_videoproyector DESC`;

        const params = [
            fechaActual, horaActual, horaActual,
            fechaActual, horaActual, horaActual,
            // actual_por
            fechaActual, horaActual, horaActual,
            // actual_id_solicitud
            fechaActual, horaActual, horaActual,
            fechaActual, fechaActual, horaActual,
            fechaActual, fechaActual, horaActual,
            fechaActual, fechaActual, horaActual,
            fechaActual, fechaActual, horaActual,
            fechaActual, fechaActual, horaActual
        ];

        if (hasRange) {
            params.push(
                // ocupado_en_rango (fecha, hf, hi)
                fechaReq, horaFinReq, horaIniReq,
                // por_en_rango (fecha, hf, hi)
                fechaReq, horaFinReq, horaIniReq,
                // id_solicitud_en_rango (fecha, hf, hi)
                fechaReq, horaFinReq, horaIniReq
            );
        }

        const [rows] = await pool.execute(query, params);
        
        // Mapear resultados para usar estado_actual como estado principal
        const videoproyectores = rows.map(row => ({
            ...row,
            estado: row.estado_actual,
            horario_ocupado: row.horario_ocupado || null,
            actual_por: row.actual_por || null,
            actual_id_solicitud: row.actual_id_solicitud || null,
            proxima_fecha: row.proxima_fecha || null,
            proximo_horario: row.proximo_horario || null,
            proxima_hora_inicio: row.proxima_hora_inicio || null,
            proximo_por: row.proximo_por || null,
            proxima_id_solicitud: row.proxima_id_solicitud || null,
            ocupado_en_rango: row.ocupado_en_rango === 1 ? 1 : 0,
            por_en_rango: row.por_en_rango || null,
            id_solicitud_en_rango: row.id_solicitud_en_rango || null
        }));
        
        console.log('📽️ Videoproyectores con estado dinámico:', videoproyectores);
        
        res.json({
            success: true,
            data: videoproyectores,
            count: videoproyectores.length,
            timestamp: ahora.toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo videoproyectores:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo videoproyectores',
            error: error.message
        });
    }
});

// GET - Obtener videoproyectores disponibles
router.get('/disponibles', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM videoproyectores WHERE estado = "disponible" ORDER BY nombre');
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error obteniendo videoproyectores disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo videoproyectores disponibles',
            error: error.message
        });
    }
});

// GET - Obtener videoproyector por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM videoproyectores WHERE id_videoproyector = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Videoproyector no encontrado'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo videoproyector:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo videoproyector',
            error: error.message
        });
    }
});

// POST - Crear nuevo videoproyector
router.post('/', async (req, res) => {
    try {
        const { nombre, ubicacion, estado = 'disponible' } = req.body;

        // Validaciones básicas
        if (!nombre || !ubicacion) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y ubicación son requeridos'
            });
        }

        // Verificar si ya existe un videoproyector con ese nombre
        const [existingProjector] = await pool.execute(
            'SELECT id_videoproyector FROM videoproyectores WHERE nombre = ?',
            [nombre]
        );

        if (existingProjector.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un videoproyector con ese nombre'
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO videoproyectores (nombre, ubicacion, estado) VALUES (?, ?, ?)',
            [nombre, ubicacion, estado]
        );

        // Notificar a los clientes SSE
        try {
            sse.broadcast('videoproyectores:update', { action: 'create', id_videoproyector: result.insertId });
        } catch (_) {}

        res.status(201).json({
            success: true,
            message: 'Videoproyector creado exitosamente',
            data: {
                id_videoproyector: result.insertId,
                nombre,
                ubicacion,
                estado
            }
        });
    } catch (error) {
        console.error('Error creando videoproyector:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando videoproyector',
            error: error.message
        });
    }
});

// PUT - Actualizar videoproyector
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, ubicacion, estado } = req.body;

        // Verificar si el videoproyector existe
        const [existingProjector] = await pool.execute('SELECT id_videoproyector FROM videoproyectores WHERE id_videoproyector = ?', [id]);
        if (existingProjector.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Videoproyector no encontrado'
            });
        }

        const [result] = await pool.execute(
            'UPDATE videoproyectores SET nombre = ?, ubicacion = ?, estado = ? WHERE id_videoproyector = ?',
            [nombre, ubicacion, estado, id]
        );

        // Notificar actualización
        try {
            sse.broadcast('videoproyectores:update', { action: 'update', id_videoproyector: Number(id) });
        } catch (_) {}

        res.json({
            success: true,
            message: 'Videoproyector actualizado exitosamente',
            data: { id_videoproyector: id, nombre, ubicacion, estado }
        });
    } catch (error) {
        console.error('Error actualizando videoproyector:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando videoproyector',
            error: error.message
        });
    }
});

// DELETE - Eliminar videoproyector
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el videoproyector existe
        const [existingProjector] = await pool.execute('SELECT id_videoproyector, nombre FROM videoproyectores WHERE id_videoproyector = ?', [id]);
        if (existingProjector.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Videoproyector no encontrado'
            });
        }

        // Obtener fecha y hora actual
    const ahora = new Date();
    const fechaActual = formatLocalDate(ahora); // YYYY-MM-DD (local)
    const horaActual = ahora.toTimeString().slice(0, 5); // HH:MM (local)

        console.log('🗑️ Intentando eliminar videoproyector:', existingProjector[0].nombre);
        console.log('📅 Fecha actual:', fechaActual);
        console.log('⏰ Hora actual:', horaActual);

        // Verificar si el videoproyector tiene solicitudes ACTIVAS (aprobadas y en horario actual o futuro)
        const [solicitudesActivas] = await pool.execute(`
            SELECT COUNT(*) as count, GROUP_CONCAT(CONCAT(fecha, ' ', hora_inicio, '-', hora_fin)) as horarios
            FROM solicitudes 
            WHERE id_videoproyector = ? 
            AND estado_reserva = 'aprobado'
            AND (
                fecha > ? OR 
                (fecha = ? AND hora_fin > ?)
            )
        `, [id, fechaActual, fechaActual, horaActual]);

        console.log('📋 Solicitudes activas encontradas:', solicitudesActivas[0].count);
        console.log('📋 Horarios activos:', solicitudesActivas[0].horarios);

        if (solicitudesActivas[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el videoproyector "${existingProjector[0].nombre}" porque tiene reservas activas: ${solicitudesActivas[0].horarios}`,
                tipo: 'reservas_activas'
            });
        }

        // Si no tiene reservas activas, se puede eliminar
    await pool.execute('DELETE FROM videoproyectores WHERE id_videoproyector = ?', [id]);

        console.log('✅ Videoproyector eliminado exitosamente:', existingProjector[0].nombre);

        // Notificar eliminación
        try {
            sse.broadcast('videoproyectores:update', { action: 'delete', id_videoproyector: Number(id) });
        } catch (_) {}

        res.json({
            success: true,
            message: `Videoproyector "${existingProjector[0].nombre}" eliminado exitosamente`
        });
    } catch (error) {
        console.error('Error eliminando videoproyector:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando videoproyector',
            error: error.message
        });
    }
});

// PATCH - Cambiar estado de videoproyector
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

        // Verificar si el videoproyector existe
        const [existingProjector] = await pool.execute('SELECT id_videoproyector FROM videoproyectores WHERE id_videoproyector = ?', [id]);
        if (existingProjector.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Videoproyector no encontrado'
            });
        }

        await pool.execute('UPDATE videoproyectores SET estado = ? WHERE id_videoproyector = ?', [estado, id]);

        // Notificar cambio de estado
        try {
            sse.broadcast('videoproyectores:update', { action: 'estado', id_videoproyector: Number(id), estado });
        } catch (_) {}

        res.json({
            success: true,
            message: `Estado de videoproyector actualizado a ${estado}`,
            data: { id_videoproyector: id, estado }
        });
    } catch (error) {
        console.error('Error actualizando estado de videoproyector:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando estado de videoproyector',
            error: error.message
        });
    }
});

module.exports = router;