const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const sse = require('../utils/sse');
const { validate, schemas } = require('../utils/validation');

// Endpoint de debugging para verificar recursos disponibles
router.get('/debug/recursos', async (req, res) => {
    try {
        console.log('🔍 DEBUG: Verificando recursos disponibles...');
        
        // Verificar salas disponibles
        const [salas] = await pool.execute('SELECT * FROM salas WHERE estado = "disponible"');
        console.log('🏢 Salas disponibles:', salas);
        
        // Verificar videoproyectores disponibles
        const [videoproyectores] = await pool.execute('SELECT * FROM videoproyectores WHERE estado = "disponible"');
        console.log('📽️ Videoproyectores disponibles:', videoproyectores);
        
        res.json({
            success: true,
            data: {
                salas_disponibles: salas,
                videoproyectores_disponibles: videoproyectores,
                total_salas: salas.length,
                total_videoproyectores: videoproyectores.length
            }
        });
    } catch (error) {
        console.error('❌ Error en debug:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Función para encontrar recurso disponible automáticamente del tipo especificado
async function findAvailableResource(fecha, hora_inicio, hora_fin, tipoServicio, userRole = null) {
    try {
        console.log('🔍 === BÚSQUEDA DE RECURSOS ===');
        console.log('📅 Fecha:', fecha);
        console.log('⏰ Horario:', hora_inicio, '-', hora_fin);
        console.log('🎯 Tipo de servicio:', tipoServicio);
        
    if (tipoServicio === 'sala') {
            // Buscar salas disponibles considerando horarios inteligentemente
            const salasQuery = `
                SELECT s.id_sala, s.nombre, s.ubicacion, s.capacidad
                FROM salas s
        WHERE s.estado = 'disponible'
        ${userRole && userRole !== 'administrador' ? "AND FIND_IN_SET(?, s.roles_permitidos)" : ''}
                AND s.id_sala NOT IN (
                    SELECT DISTINCT sol.id_sala
                    FROM solicitudes sol
                    WHERE sol.id_sala IS NOT NULL
                    AND sol.fecha = ?
                    AND sol.estado_reserva = 'aprobado'
                    AND (
                        -- Verificar solapamiento de horarios
                        (sol.hora_inicio <= ? AND sol.hora_fin > ?) OR 
                        (sol.hora_inicio < ? AND sol.hora_fin >= ?) OR
                        (sol.hora_inicio >= ? AND sol.hora_inicio < ?)
                    )
                )
                ORDER BY s.capacidad ASC
                LIMIT 1
            `;
            
            const params = [];
            if (userRole && userRole !== 'administrador') params.push(userRole);
            params.push(fecha, hora_inicio, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin);
            console.log('📋 Query para salas:', salasQuery);
            console.log('📋 Parámetros:', params);
            const [salasDisponibles] = await pool.execute(salasQuery, params);
            
            console.log('🏢 Salas encontradas:', salasDisponibles);
            
            if (salasDisponibles.length > 0) {
                const resultado = {
                    tipo: 'sala',
                    recurso: salasDisponibles[0],
                    id_sala: salasDisponibles[0].id_sala,
                    id_videoproyector: null
                };
                console.log('✅ Recurso SALA encontrado:', resultado);
                return resultado;
            }
            
        } else if (tipoServicio === 'videoproyector') {
            // Buscar videoproyectores disponibles considerando horarios inteligentemente
            const videoproyectoresQuery = `
                SELECT v.id_videoproyector, v.nombre, v.ubicacion
                FROM videoproyectores v
                WHERE v.estado = 'disponible'
                AND v.id_videoproyector NOT IN (
                    SELECT DISTINCT sol.id_videoproyector
                    FROM solicitudes sol
                    WHERE sol.id_videoproyector IS NOT NULL
                    AND sol.fecha = ?
                    AND sol.estado_reserva = 'aprobado'
                    AND (
                        -- Verificar solapamiento de horarios
                        (sol.hora_inicio <= ? AND sol.hora_fin > ?) OR 
                        (sol.hora_inicio < ? AND sol.hora_fin >= ?) OR
                        (sol.hora_inicio >= ? AND sol.hora_inicio < ?)
                    )
                )
                ORDER BY v.id_videoproyector ASC
                LIMIT 1
            `;
            
            console.log('📋 Query para videoproyectores:', videoproyectoresQuery);
            console.log('📋 Parámetros:', [fecha, hora_inicio, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin]);
            
            const [videoproyectoresDisponibles] = await pool.execute(videoproyectoresQuery, [
                fecha, hora_inicio, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin
            ]);
            
            console.log('📽️ Videoproyectores encontrados:', videoproyectoresDisponibles);
            
            if (videoproyectoresDisponibles.length > 0) {
                const resultado = {
                    tipo: 'videoproyector',
                    recurso: videoproyectoresDisponibles[0],
                    id_sala: null,
                    id_videoproyector: videoproyectoresDisponibles[0].id_videoproyector
                };
                console.log('✅ Recurso VIDEOPROYECTOR encontrado:', resultado);
                return resultado;
            }
        } else if (['videocamara','dvd','extension','audio','vhs','otros'].includes(tipoServicio)) {
            // Buscar equipos del tipo solicitado disponibles y no ocupados en el rango
            const equiposQuery = `
                SELECT e.id_equipo, e.nombre, e.tipo
                FROM equipos e
                WHERE e.estado = 'disponible' AND e.tipo = ?
                AND e.id_equipo NOT IN (
                    SELECT DISTINCT sol.id_equipo
                    FROM solicitudes sol
                    WHERE sol.id_equipo IS NOT NULL
                    AND sol.fecha = ?
                    AND sol.estado_reserva = 'aprobado'
                    AND (
                        (sol.hora_inicio <= ? AND sol.hora_fin > ?) OR 
                        (sol.hora_inicio < ? AND sol.hora_fin >= ?) OR
                        (sol.hora_inicio >= ? AND sol.hora_inicio < ?)
                    )
                )
                ORDER BY e.id_equipo ASC
                LIMIT 1
            `;
            const params = [tipoServicio, fecha, hora_inicio, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin];
            const [equiposDisponibles] = await pool.execute(equiposQuery, params);
            if (equiposDisponibles.length > 0) {
                const e = equiposDisponibles[0];
                return {
                    tipo: e.tipo,
                    recurso: { id_equipo: e.id_equipo, nombre: e.nombre },
                    id_sala: null,
                    id_videoproyector: null,
                    id_equipo: e.id_equipo
                };
            }
        }
        
        console.log('❌ NO se encontraron recursos disponibles');
        return null; // No hay recursos disponibles del tipo solicitado
    } catch (error) {
        console.error('💥 Error buscando recursos disponibles:', error);
        throw error;
    }
}

// GET - Obtener todas las solicitudes con información relacionada
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                s.*,
                u.nombre as nombre_usuario,
                u.apellido as apellido_usuario,
                u.correo_electronico,
                u.tipo_de_usuario,
                sa.nombre as nombre_sala,
                sa.capacidad as capacidad_sala,
                v.nombre as nombre_videoproyector,
                e.nombre as nombre_equipo,
                e.tipo as tipo_equipo
            FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN salas sa ON s.id_sala = sa.id_sala
            LEFT JOIN videoproyectores v ON s.id_videoproyector = v.id_videoproyector
            LEFT JOIN equipos e ON s.id_equipo = e.id_equipo
            ORDER BY s.id_solicitud DESC
        `;
        
        const [rows] = await pool.execute(query);
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo solicitudes',
            error: error.message
        });
    }
});

// GET - Obtener solicitudes por usuario
router.get('/usuario/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
            SELECT 
                s.*,
                sa.nombre as nombre_sala,
                v.nombre as nombre_videoproyector,
                e.nombre as nombre_equipo,
                e.tipo as tipo_equipo
            FROM solicitudes s
            LEFT JOIN salas sa ON s.id_sala = sa.id_sala
            LEFT JOIN videoproyectores v ON s.id_videoproyector = v.id_videoproyector
            LEFT JOIN equipos e ON s.id_equipo = e.id_equipo
            WHERE s.id_usuario = ?
            ORDER BY s.id_solicitud DESC
        `;
        
        const [rows] = await pool.execute(query, [userId]);
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error obteniendo solicitudes del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo solicitudes del usuario',
            error: error.message
        });
    }
});

// GET - Obtener solicitudes por estado
router.get('/estado/:estado', async (req, res) => {
    try {
        const { estado } = req.params;
        
        if (!['pendiente', 'aprobado', 'rechazado', 'anulado'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado debe ser: pendiente, aprobado, rechazado o anulado'
            });
        }

        const query = `
            SELECT 
                s.*,
                u.nombre as nombre_usuario,
                u.apellido as apellido_usuario,
                sa.nombre as nombre_sala,
                v.nombre as nombre_videoproyector,
                e.nombre as nombre_equipo,
                e.tipo as tipo_equipo
            FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN salas sa ON s.id_sala = sa.id_sala
            LEFT JOIN videoproyectores v ON s.id_videoproyector = v.id_videoproyector
            LEFT JOIN equipos e ON s.id_equipo = e.id_equipo
            WHERE s.estado_reserva = ?
            ORDER BY s.fecha DESC, s.hora_inicio DESC
        `;
        
        const [rows] = await pool.execute(query, [estado]);
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error obteniendo solicitudes por estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo solicitudes por estado',
            error: error.message
        });
    }
});

// GET - Obtener solicitud por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                s.*,
                u.nombre as nombre_usuario,
                u.apellido as apellido_usuario,
                u.correo_electronico,
                sa.nombre as nombre_sala,
                v.nombre as nombre_videoproyector
            FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN salas sa ON s.id_sala = sa.id_sala
            LEFT JOIN videoproyectores v ON s.id_videoproyector = v.id_videoproyector
            WHERE s.id_solicitud = ?
        `;
        
        const [rows] = await pool.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo solicitud',
            error: error.message
        });
    }
});

// POST - Crear nueva solicitud con asignación automática
router.post('/', validate(schemas.solicitudCreate), async (req, res) => {
    console.log('📥 Recibida petición POST /solicitudes');
    console.log('📋 Datos recibidos (validados):', req.validated.body);
    
    try {
        // Asegurar columnas opcionales por si el servidor no ha corrido ensureSchema aún
        try {
            await pool.query(`ALTER TABLE solicitudes 
                ADD COLUMN IF NOT EXISTS tipo_actividad VARCHAR(100) NULL DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS numero_asistentes VARCHAR(50) NULL DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS equip_videocamara TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_dvd TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_extension TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_audio TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_vhs TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_otros TINYINT(1) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS equip_cual VARCHAR(100) NULL DEFAULT NULL;`);
        } catch (e) {
            console.warn('⚠️ No se pudo aplicar alter table en POST (puede existir ya):', e.message);
        }

        const {
            id_usuario,
            fecha,
            hora_inicio,
            hora_fin,
            estudiante,
            programa,
            tipo_actividad,
            numero_asistentes,
            asignatura,
            docente,
            semestre,
            celular,
            servicio,
            salon,
            equip_videocamara = false,
            equip_dvd = false,
            equip_extension = false,
            equip_audio = false,
            equip_vhs = false,
            equip_otros = false,
            equip_cual = null
        } = req.validated.body;

        console.log('🔍 Validando campos requeridos...');

        // Validaciones básicas
        // Ya se validaron campos requeridos con Zod

        // Validaciones de formato
        const asignaturaRegex = /^[a-zA-Z0-9\s]{3,50}$/;
        const salonRegex = /^[a-zA-Z0-9]{1,10}$/;
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
        const celularRegex = /^[0-9]{10}$/;

        if (!asignatura || !asignaturaRegex.test(asignatura)) {
            return res.status(400).json({
                success: false,
                message: 'Asignatura debe contener solo letras, números y espacios (3-50 caracteres)'
            });
        }

        if (!salon || !salonRegex.test(salon)) {
            return res.status(400).json({
                success: false,
                message: 'Salón debe contener solo letras y números (1-10 caracteres)'
            });
        }

        if (estudiante && !nombreRegex.test(estudiante)) {
            return res.status(400).json({
                success: false,
                message: 'Estudiante debe contener solo letras y espacios (2-50 caracteres)'
            });
        }

        if (!docente || !nombreRegex.test(docente)) {
            return res.status(400).json({
                success: false,
                message: 'Docente es requerido y debe contener solo letras y espacios (2-50 caracteres)'
            });
        }

        if (!celular || !celularRegex.test(celular)) {
            return res.status(400).json({
                success: false,
                message: 'Número de celular es requerido y debe contener exactamente 10 dígitos'
            });
        }

        if (semestre && (semestre < 1 || semestre > 10)) {
            return res.status(400).json({
                success: false,
                message: 'Semestre debe ser un número entre 1 y 10'
            });
        }

        // Validar que el servicio sea válido
        if (!['videoproyector', 'sala','videocamara','dvd','extension','audio','vhs','otros'].includes(servicio)) {
            return res.status(400).json({
                success: false,
                message: 'El servicio debe ser uno de: videoproyector, sala, videocamara, dvd, extension, audio, vhs, otros'
            });
        }

        // Normalizar booleans
        const eq_videocamara = Number(Boolean(equip_videocamara));
        const eq_dvd = Number(Boolean(equip_dvd));
        const eq_extension = Number(Boolean(equip_extension));
        const eq_audio = Number(Boolean(equip_audio));
        const eq_vhs = Number(Boolean(equip_vhs));
        const eq_otros = Number(Boolean(equip_otros));
        const eq_cual = equip_cual ? String(equip_cual).slice(0,100) : null;

        // Buscar recurso disponible automáticamente del tipo seleccionado
        console.log('🔍 Buscando recursos disponibles...');
        console.log('📋 Parámetros de búsqueda:', { fecha, hora_inicio, hora_fin, servicio });
        
        // Obtener rol del usuario para filtrar recursos permitidos
        let userRole = null;
        try {
            const [u] = await pool.execute('SELECT tipo_de_usuario FROM usuarios WHERE id_usuario = ? LIMIT 1', [id_usuario]);
            userRole = (u && u[0] && u[0].tipo_de_usuario) ? String(u[0].tipo_de_usuario).toLowerCase() : null;
        } catch(_) {}

        const recursoDisponible = await findAvailableResource(fecha, hora_inicio, hora_fin, servicio, userRole);
        console.log('🎯 Resultado de búsqueda:', recursoDisponible);
        
        if (!recursoDisponible) {
            console.log('❌ No hay recursos disponibles - RECHAZANDO automáticamente');
            
            // Crear solicitud como RECHAZADA automáticamente (sin transacción compleja)
            const [result] = await pool.execute(
                `INSERT INTO solicitudes 
                (id_usuario, id_sala, id_videoproyector, id_equipo, fecha, hora_inicio, hora_fin, 
                 estudiante, programa, tipo_actividad, numero_asistentes, asignatura, docente, semestre, celular, servicio, 
                 estado_reserva, salon, equip_videocamara, equip_dvd, equip_extension, equip_audio, equip_vhs, equip_otros, equip_cual) 
                VALUES (?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'rechazado', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_usuario, fecha, hora_inicio, hora_fin, estudiante, programa, tipo_actividad || null, numero_asistentes || null, asignatura, 
                 docente, semestre, celular, servicio, salon, eq_videocamara, eq_dvd, eq_extension, eq_audio, eq_vhs, eq_otros, eq_cual]
            );

            const response = {
                success: true,
                message: `❌ Solicitud RECHAZADA automáticamente - No hay ${servicio === 'sala' ? 'salas' : 'videoproyectores'} disponibles en el horario solicitado`,
                data: {
                    id_solicitud: result.insertId,
                    estado_reserva: 'rechazado',
                    aprobacion_automatica: false,
                    razon_rechazo: `No hay ${servicio === 'sala' ? 'salas' : 'videoproyectores'} disponibles en el horario ${hora_inicio} - ${hora_fin}`
                }
            };
            // Notificar por SSE
            try { sse.broadcast('solicitudes:update', { action: 'created', estado: 'rechazado', id_solicitud: result.insertId }); } catch {}
            return res.status(201).json(response);
        }

        console.log('✅ Recurso disponible encontrado:', recursoDisponible);
        console.log('🔄 Aprobando solicitud automáticamente...');

        // Iniciar transacción para crear solicitud y aprobarla automáticamente
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Crear solicitud como APROBADA automáticamente
            const [result] = await connection.execute(
                `INSERT INTO solicitudes 
                (id_usuario, id_sala, id_videoproyector, id_equipo, fecha, hora_inicio, hora_fin, 
                 estudiante, programa, tipo_actividad, numero_asistentes, asignatura, docente, semestre, celular, servicio, 
                 estado_reserva, salon, equip_videocamara, equip_dvd, equip_extension, equip_audio, equip_vhs, equip_otros, equip_cual) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprobado', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_usuario, recursoDisponible.id_sala || null, recursoDisponible.id_videoproyector || null, recursoDisponible.id_equipo || null,
                 fecha, hora_inicio, hora_fin, estudiante, programa, tipo_actividad || null, numero_asistentes || null, asignatura, docente, 
                 semestre, celular, recursoDisponible.tipo, salon, eq_videocamara, eq_dvd, eq_extension, eq_audio, eq_vhs, eq_otros, eq_cual]
            );

            const solicitudId = result.insertId;

            console.log(`✅ Recurso ${recursoDisponible.tipo} ${recursoDisponible.recurso.nombre} asignado para horario ${hora_inicio}-${hora_fin}`);

            // Registrar en historial la aprobación automática
            await connection.execute(
                `INSERT INTO historial_reservas 
                (id_solicitud, fecha_modificacion, estado_anterior, estado_nuevo, comentarios) 
                VALUES (?, NOW(), NULL, 'aprobado', 'Aprobación automática - recurso disponible en horario solicitado')`,
                [solicitudId]
            );

            await connection.commit();

            console.log('🎉 Solicitud creada y aprobada automáticamente');

            const response = {
                success: true,
                message: '✅ Solicitud creada y aprobada automáticamente',
                data: {
                    id_solicitud: solicitudId,
                    estado_reserva: 'aprobado',
                    aprobacion_automatica: true,
                    recurso_asignado: {
                        tipo: recursoDisponible.tipo,
                        nombre: recursoDisponible.recurso.nombre,
                        id: recursoDisponible.id_sala || recursoDisponible.id_videoproyector || recursoDisponible.id_equipo
                    }
                }
            };
            try { sse.broadcast('solicitudes:update', { action: 'created', estado: 'aprobado', id_solicitud: solicitudId }); } catch {}
            res.status(201).json(response);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error creando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando solicitud',
            error: error.message
        });
    }
});

// PUT - Actualizar solicitud
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fecha,
            hora_inicio,
            hora_fin,
            estudiante,
            programa,
            tipo_actividad,
            numero_asistentes,
            asignatura,
            docente,
            semestre,
            celular,
            salon,
            equip_videocamara = 0,
            equip_dvd = 0,
            equip_extension = 0,
            equip_audio = 0,
            equip_vhs = 0,
            equip_otros = 0,
            equip_cual = null
        } = req.body;

        // Verificar si la solicitud existe y está pendiente
        const [existingSolicitud] = await pool.execute(
            'SELECT estado_reserva FROM solicitudes WHERE id_solicitud = ?', 
            [id]
        );
        
        if (existingSolicitud.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        if (existingSolicitud[0].estado_reserva !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden modificar solicitudes pendientes'
            });
        }

        const [result] = await pool.execute(
            `UPDATE solicitudes SET 
            fecha = ?, hora_inicio = ?, hora_fin = ?, estudiante = ?, 
            programa = ?, tipo_actividad = ?, numero_asistentes = ?, asignatura = ?, docente = ?, semestre = ?, 
            celular = ?, salon = ?, equip_videocamara = ?, equip_dvd = ?, equip_extension = ?, equip_audio = ?, equip_vhs = ?, equip_otros = ?, equip_cual = ?
            WHERE id_solicitud = ?`,
            [fecha, hora_inicio, hora_fin, estudiante, programa, tipo_actividad || null, numero_asistentes || null, asignatura, 
             docente, semestre, celular, salon, Number(Boolean(equip_videocamara)), Number(Boolean(equip_dvd)), Number(Boolean(equip_extension)), Number(Boolean(equip_audio)), Number(Boolean(equip_vhs)), Number(Boolean(equip_otros)), equip_cual ? String(equip_cual).slice(0,100) : null, id]
        );

        res.json({
            success: true,
            message: 'Solicitud actualizada exitosamente'
        });
        try { sse.broadcast('solicitudes:update', { action: 'updated', id_solicitud: id }); } catch {}
    } catch (error) {
        console.error('Error actualizando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando solicitud',
            error: error.message
        });
    }
});

// PATCH - Cambiar estado de solicitud (aprobar/rechazar)
router.patch('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_reserva, estado, comentarios = null } = req.body;

        // Normalizar el estado (aceptar tanto formato antiguo como nuevo)
        let finalEstado = estado_reserva || estado;
        
        // Convertir formatos
        if (finalEstado === 'aprobada') finalEstado = 'aprobado';
        if (finalEstado === 'rechazada') finalEstado = 'rechazado';
        if (finalEstado === 'pendiente') finalEstado = 'pendiente';

        console.log('=== UPDATING SOLICITUD STATUS ===');
        console.log('ID:', id);
        console.log('Original estado:', estado_reserva || estado);
        console.log('Final estado:', finalEstado);

        if (!['aprobado', 'rechazado', 'pendiente', 'anulado'].includes(finalEstado)) {
            return res.status(400).json({
                success: false,
                message: 'El estado debe ser "aprobado", "rechazado", "anulado" o "pendiente"'
            });
        }

        // Verificar si la solicitud existe
        const [existingSolicitud] = await pool.execute(
            'SELECT * FROM solicitudes WHERE id_solicitud = ?', 
            [id]
        );
        
        if (existingSolicitud.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        const solicitud = existingSolicitud[0];

        // Iniciar transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Actualizar estado de solicitud
            await connection.execute(
                'UPDATE solicitudes SET estado_reserva = ? WHERE id_solicitud = ?',
                [finalEstado, id]
            );

            // Registrar en historial
            await connection.execute(
                `INSERT INTO historial_reservas 
                (id_solicitud, fecha_modificacion, estado_anterior, estado_nuevo, comentarios) 
                VALUES (?, NOW(), ?, ?, ?)`,
                [id, solicitud.estado_reserva, finalEstado, comentarios]
            );

            // Si se aprueba, actualizar estado del recurso a ocupado
            if (finalEstado === 'aprobado') {
                if (solicitud.servicio === 'sala' && solicitud.id_sala) {
                    await connection.execute(
                        'UPDATE salas SET estado = "ocupada" WHERE id_sala = ?',
                        [solicitud.id_sala]
                    );
                } else if (solicitud.servicio === 'videoproyector' && solicitud.id_videoproyector) {
                    await connection.execute(
                        'UPDATE videoproyectores SET estado = "ocupada" WHERE id_videoproyector = ?',
                        [solicitud.id_videoproyector]
                    );
                } else if (['videocamara','dvd','extension','audio','vhs','otros'].includes(solicitud.servicio) && solicitud.id_equipo) {
                    await connection.execute(
                        'UPDATE equipos SET estado = "ocupada" WHERE id_equipo = ?',
                        [solicitud.id_equipo]
                    );
                }
            }

            await connection.commit();

            res.json({
                success: true,
                message: `Solicitud ${finalEstado} exitosamente`,
                data: { id_solicitud: id, estado_reserva: finalEstado }
            });
            try { sse.broadcast('solicitudes:update', { action: 'status', id_solicitud: id, estado_reserva: finalEstado }); } catch {}
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error cambiando estado de solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error cambiando estado de solicitud',
            error: error.message
        });
    }
});

// DELETE - Eliminar solicitud (solo si está pendiente)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si la solicitud existe y obtener información del recurso
        const [existingSolicitud] = await pool.execute(
            'SELECT * FROM solicitudes WHERE id_solicitud = ?', 
            [id]
        );
        
        if (existingSolicitud.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        const solicitud = existingSolicitud[0];

        // Solo permitir eliminar solicitudes pendientes
        if (solicitud.estado_reserva !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden eliminar solicitudes pendientes'
            });
        }

        // Iniciar transacción para eliminar solicitud y liberar recursos si estaban asignados
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Liberar recursos si estaban asignados
            if (solicitud.estado_reserva === 'aprobado') {
                if (solicitud.servicio === 'sala' && solicitud.id_sala) {
                    await connection.execute(
                        'UPDATE salas SET estado = "disponible" WHERE id_sala = ?',
                        [solicitud.id_sala]
                    );
                } else if (solicitud.servicio === 'videoproyector' && solicitud.id_videoproyector) {
                    await connection.execute(
                        'UPDATE videoproyectores SET estado = "disponible" WHERE id_videoproyector = ?',
                        [solicitud.id_videoproyector]
                    );
                } else if (['videocamara','dvd','extension','audio','vhs','otros'].includes(solicitud.servicio) && solicitud.id_equipo) {
                    await connection.execute(
                        'UPDATE equipos SET estado = "disponible" WHERE id_equipo = ?',
                        [solicitud.id_equipo]
                    );
                }
            }

            // Eliminar solicitud
            await connection.execute('DELETE FROM solicitudes WHERE id_solicitud = ?', [id]);

            await connection.commit();

            res.json({
                success: true,
                message: 'Solicitud eliminada exitosamente'
            });
            try { sse.broadcast('solicitudes:update', { action: 'deleted', id_solicitud: id }); } catch {}

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error eliminando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando solicitud',
            error: error.message
        });
    }
});

module.exports = router;