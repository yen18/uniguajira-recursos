// Archivo reconstruido para limpiar corrupción previa
const express = require('express');
const { pool } = require('../config/database');
const sse = require('../utils/sse');
const { sendOverrideNotification } = require('../utils/mailer');
const router = express.Router();

// Util simple para validar entradas
const validTipo = (t) => t === 'sala' || t === 'videoproyector';

// =============================
// Catálogo de Equipos (Servicios)
// =============================

// GET - Listar catálogo de equipos
router.get('/equipos', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id_equipo, clave, nombre, activo, orden, created_at
       FROM catalogo_equipos
       ORDER BY activo DESC, orden ASC, nombre ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando catálogo de equipos:', error);
    res.status(500).json({ success: false, message: 'Error listando catálogo', error: error.message });
  }
});

// POST - Crear un ítem del catálogo
router.post('/equipos', async (req, res) => {
  try {
    let { clave, nombre, activo = 1, orden = null } = req.body || {};
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Nombre es requerido' });
    }
    nombre = nombre.trim();
    if (!clave || typeof clave !== 'string' || clave.trim().length === 0) {
      clave = nombre.toLowerCase().normalize('NFD').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    } else {
      clave = String(clave).trim().toLowerCase();
    }
    activo = Number(Boolean(activo));
    const conn = await pool.getConnection();
    try {
      if (orden === null || typeof orden !== 'number') {
        const [maxRows] = await conn.execute('SELECT COALESCE(MAX(orden),0)+1 AS nextOrden FROM catalogo_equipos');
        orden = Number(maxRows[0].nextOrden || 1);
      }
      await conn.execute(
        'INSERT INTO catalogo_equipos (clave, nombre, activo, orden) VALUES (?,?,?,?)',
        [clave, nombre, activo, orden]
      );
      try { sse.broadcast('catalogo_equipos:update', { action: 'create', clave }); } catch {}
      res.json({ success: true, message: 'Equipo creado', data: { clave, nombre, activo, orden } });
    } finally {
      conn.release();
    }
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'La clave ya existe' });
    }
    console.error('Error creando equipo:', error);
    res.status(500).json({ success: false, message: 'Error creando equipo', error: error.message });
  }
});

// GET - Obtener ítem del catálogo por id (diagnóstico)
router.get('/equipos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
    const [rows] = await pool.execute('SELECT id_equipo, clave, nombre, activo, orden FROM catalogo_equipos WHERE id_equipo=? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error obteniendo ítem catálogo:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo ítem', error: error.message });
  }
});

// DELETE - Eliminar ítem por clave (idempotente, sin restricciones)
router.delete('/equipos/clave/:clave', async (req, res) => {
  try {
    const clave = String(req.params.clave || '').trim().toLowerCase();
    if (!clave) return res.status(400).json({ success: false, message: 'Clave inválida' });
    const [row] = await pool.execute('SELECT id_equipo FROM catalogo_equipos WHERE clave=? LIMIT 1', [clave]);
    if (!row.length) {
      return res.json({ success: true, message: 'Tipo ya eliminado', affected: 0 });
    }
    const id_equipo = row[0].id_equipo;
    const [result] = await pool.execute('DELETE FROM catalogo_equipos WHERE id_equipo=? LIMIT 1', [id_equipo]);
    if (result.affectedRows) {
      try { sse.broadcast('catalogo_equipos:update', { action: 'delete', id: id_equipo, clave }); } catch {}
    }
    res.json({ success: true, message: 'Tipo eliminado', affected: result.affectedRows });
  } catch (error) {
    console.error('Error eliminando ítem por clave (simplificado):', error);
    res.status(500).json({ success: false, message: 'Error eliminando ítem por clave', error: error.message });
  }
});

// PUT - Actualizar un ítem del catálogo
router.put('/equipos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
    const { nombre, activo, orden } = req.body || {};
    const fields = [];
    const values = [];
    if (typeof nombre === 'string' && nombre.trim().length > 0) { fields.push('nombre=?'); values.push(nombre.trim()); }
    if (typeof activo !== 'undefined') { fields.push('activo=?'); values.push(Number(Boolean(activo))); }
    if (typeof orden !== 'undefined') { fields.push('orden=?'); values.push(Number(orden)); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'Nada para actualizar' });
    values.push(id);
    const [result] = await pool.execute(`UPDATE catalogo_equipos SET ${fields.join(', ')} WHERE id_equipo=?`, values);
    if (result.affectedRows) { try { sse.broadcast('catalogo_equipos:update', { action: 'update', id }); } catch {} }
    res.json({ success: true, message: 'Equipo actualizado', affected: result.affectedRows });
  } catch (error) {
    console.error('Error actualizando equipo:', error);
    res.status(500).json({ success: false, message: 'Error actualizando equipo', error: error.message });
  }
});

// =============================
// Ocupaciones Especiales
// =============================

// GET - Listar ocupaciones especiales activas
router.get('/ocupaciones', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id_ocupacion, tipo_servicio, id_recurso, nota, creado_por, activo, created_at, released_at
       FROM ocupaciones_especiales WHERE activo = 1 ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando ocupaciones especiales:', error);
    res.status(500).json({ success: false, message: 'Error listando ocupaciones', error: error.message });
  }
});

// POST - Ocupar recursos
router.post('/ocupaciones/ocupar', async (req, res) => {
  try {
    const { tipo_servicio, ids, nota = null, creado_por = null } = req.body || {};
    if (!validTipo(tipo_servicio) || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }
    const conn = await pool.getConnection();
    try {
      let inserted = 0;
      for (const rid of ids) {
        const [exists] = await conn.execute(
          'SELECT 1 FROM ocupaciones_especiales WHERE tipo_servicio=? AND id_recurso=? AND activo=1 LIMIT 1',
          [tipo_servicio, rid]
        );
        if (exists.length > 0) continue;
        await conn.execute(
          'INSERT INTO ocupaciones_especiales (tipo_servicio, id_recurso, nota, creado_por, activo) VALUES (?,?,?,?,1)',
          [tipo_servicio, rid, nota, creado_por]
        );
        inserted++;
      }
      try {
        if (tipo_servicio === 'videoproyector') sse.broadcast('videoproyectores:update', { action: 'ocupaciones:ocupar' });
        if (tipo_servicio === 'sala') sse.broadcast('salas:update', { action: 'ocupaciones:ocupar' });
      } catch {}
      res.json({ success: true, message: 'Recursos ocupados', inserted });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error ocupando recursos:', error);
    res.status(500).json({ success: false, message: 'Error ocupando recursos', error: error.message });
  }
});

// POST - Liberar recursos
router.post('/ocupaciones/liberar', async (req, res) => {
  try {
    const { tipo_servicio, ids } = req.body || {};
    if (!validTipo(tipo_servicio) || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }
    const placeholders = ids.map(()=>'?').join(',');
    const [result] = await pool.execute(
      `UPDATE ocupaciones_especiales SET activo=0, released_at=NOW() WHERE tipo_servicio=? AND id_recurso IN (${placeholders}) AND activo=1`,
      [tipo_servicio, ...ids]
    );
    try {
      if (tipo_servicio === 'videoproyector') sse.broadcast('videoproyectores:update', { action: 'ocupaciones:liberar' });
      if (tipo_servicio === 'sala') sse.broadcast('salas:update', { action: 'ocupaciones:liberar' });
    } catch {}
    res.json({ success: true, message: 'Recursos liberados', affected: result.affectedRows });
  } catch (error) {
    console.error('Error liberando recursos:', error);
    res.status(500).json({ success: false, message: 'Error liberando recursos', error: error.message });
  }
});

// POST - Override próximo horario aprobado
router.post('/override', async (req, res) => {
  try {
    const { tipo_servicio, id_recurso, motivo = null, creado_por = null } = req.body || {};
    if (!validTipo(tipo_servicio) || !id_recurso) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos (tipo_servicio, id_recurso)' });
    }
    const conn = await pool.getConnection();
    try {
      const selectSql = tipo_servicio === 'sala'
        ? `SELECT s.*, u.correo_electronico, sa.nombre AS recurso_nombre FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN salas sa ON s.id_sala = sa.id_sala
            WHERE s.id_sala = ? AND s.servicio='sala' AND s.estado_reserva='aprobado'
            ORDER BY CONCAT(s.fecha,' ',s.hora_inicio) ASC LIMIT 1`
        : `SELECT s.*, u.correo_electronico, v.nombre AS recurso_nombre FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN videoproyectores v ON s.id_videoproyector = v.id_videoproyector
            WHERE s.id_videoproyector = ? AND s.servicio='videoproyector' AND s.estado_reserva='aprobado'
            ORDER BY CONCAT(s.fecha,' ',s.hora_inicio) ASC LIMIT 1`;
      const [rows] = await conn.execute(selectSql, [id_recurso]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No hay solicitud aprobada próxima para este recurso' });
      }
      const solicitud = rows[0];
      await conn.execute('UPDATE solicitudes SET estado_reserva = ? WHERE id_solicitud = ?', ['anulado', solicitud.id_solicitud]);
      await conn.execute(
        'INSERT INTO historial_reservas (id_solicitud, fecha_modificacion, estado_anterior, estado_nuevo, comentarios) VALUES (?,?,?,?,?)',
        [solicitud.id_solicitud, new Date(), solicitud.estado_reserva, 'anulado', `Override admin: ${motivo || 'sin motivo'}`]
      );
      const [exists] = await conn.execute(
        'SELECT 1 FROM ocupaciones_especiales WHERE tipo_servicio=? AND id_recurso=? AND activo=1 LIMIT 1',
        [tipo_servicio, id_recurso]
      );
      if (exists.length === 0) {
        await conn.execute(
          'INSERT INTO ocupaciones_especiales (tipo_servicio, id_recurso, nota, creado_por, activo) VALUES (?,?,?,?,1)',
          [tipo_servicio, id_recurso, `override:${motivo || 'prioridad admin'}`, creado_por]
        );
      }
      let emailInfo = null;
      try {
        emailInfo = await sendOverrideNotification({
          to: solicitud.correo_electronico,
          recursoTipo: tipo_servicio,
          recursoNombre: solicitud.recurso_nombre || 'recurso',
          fecha: solicitud.fecha,
          hora_inicio: solicitud.hora_inicio,
          hora_fin: solicitud.hora_fin,
          motivo
        });
      } catch (e) {
        emailInfo = { error: e.message };
      }
      try { sse.broadcast('solicitudes:update', { action: 'override', id_solicitud: solicitud.id_solicitud }); } catch {}
      try {
        if (tipo_servicio === 'videoproyector') sse.broadcast('videoproyectores:update', { action: 'override' });
        if (tipo_servicio === 'sala') sse.broadcast('salas:update', { action: 'override' });
      } catch {}
      res.json({
        success: true,
        message: 'Solicitud anulada y recurso marcado como ocupación especial',
        data: {
          id_solicitud: solicitud.id_solicitud,
          estado_final: 'anulado',
          recurso: { tipo: tipo_servicio, id: id_recurso },
          email: emailInfo
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error en override:', error);
    res.status(500).json({ success: false, message: 'Error realizando override', error: error.message });
  }
});

// DELETE - Eliminar ítem del catálogo (idempotente, sin verificaciones de uso)
router.delete('/equipos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });
    const [row] = await pool.execute('SELECT id_equipo, clave FROM catalogo_equipos WHERE id_equipo=? LIMIT 1', [id]);
    if (!row.length) {
      return res.json({ success: true, message: 'Tipo ya eliminado', affected: 0 });
    }
    const clave = row[0].clave;
    const [result] = await pool.execute('DELETE FROM catalogo_equipos WHERE id_equipo=? LIMIT 1', [id]);
    if (result.affectedRows) {
      try { sse.broadcast('catalogo_equipos:update', { action: 'delete', id, clave }); } catch {}
    }
    res.json({ success: true, message: 'Tipo eliminado', affected: result.affectedRows });
  } catch (error) {
    console.error('Error eliminando ítem de catálogo (simplificado):', error);
    res.status(500).json({ success: false, message: 'Error eliminando ítem', error: error.message });
  }
});

module.exports = router;

// GET - Listar ocupaciones especiales activas
router.get('/ocupaciones', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id_ocupacion, tipo_servicio, id_recurso, nota, creado_por, activo, created_at, released_at
       FROM ocupaciones_especiales WHERE activo = 1 ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando ocupaciones especiales:', error);
    res.status(500).json({ success: false, message: 'Error listando ocupaciones', error: error.message });
  }
});

// POST - Ocupar recursos (caso especial, sin horario). Body: { tipo_servicio, ids: number[], nota? }
router.post('/ocupaciones/ocupar', async (req, res) => {
  try {
    const { tipo_servicio, ids, nota = null, creado_por = null } = req.body || {};
    if (!validTipo(tipo_servicio) || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }

    const conn = await pool.getConnection();
    try {
      let inserted = 0;
      for (const id of ids) {
        // Evitar duplicados si ya está activo
        const [exists] = await conn.execute(
          'SELECT 1 FROM ocupaciones_especiales WHERE tipo_servicio=? AND id_recurso=? AND activo=1 LIMIT 1',
          [tipo_servicio, id]
        );
        if (exists.length > 0) continue;
        await conn.execute(
          'INSERT INTO ocupaciones_especiales (tipo_servicio, id_recurso, nota, creado_por, activo) VALUES (?,?,?,?,1)',
          [tipo_servicio, id, nota, creado_por]
        );
        inserted++;
      }
      // Notificar listas correspondientes
      try {
        if (tipo_servicio === 'videoproyector') sse.broadcast('videoproyectores:update', { action: 'ocupaciones:ocupar' });
        if (tipo_servicio === 'sala') sse.broadcast('salas:update', { action: 'ocupaciones:ocupar' });
      } catch (_) {}
      res.json({ success: true, message: 'Recursos ocupados', inserted });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error ocupando recursos:', error);
    res.status(500).json({ success: false, message: 'Error ocupando recursos', error: error.message });
  }
});

// POST - Liberar recursos (caso especial). Body: { tipo_servicio, ids: number[] }
router.post('/ocupaciones/liberar', async (req, res) => {
  try {
    const { tipo_servicio, ids } = req.body || {};
    if (!validTipo(tipo_servicio) || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }
    const [result] = await pool.execute(
      `UPDATE ocupaciones_especiales SET activo=0, released_at=NOW() WHERE tipo_servicio=? AND id_recurso IN (${ids.map(()=>'?').join(',')}) AND activo=1`,
      [tipo_servicio, ...ids]
    );
    try {
      if (tipo_servicio === 'videoproyector') sse.broadcast('videoproyectores:update', { action: 'ocupaciones:liberar' });
      if (tipo_servicio === 'sala') sse.broadcast('salas:update', { action: 'ocupaciones:liberar' });
    } catch (_) {}
    res.json({ success: true, message: 'Recursos liberados', affected: result.affectedRows });
  } catch (error) {
    console.error('Error liberando recursos:', error);
    res.status(500).json({ success: false, message: 'Error liberando recursos', error: error.message });
  }
});

// POST - Override (definido correctamente al final)
router.post('/override', async (req, res) => {
  try {
    const { tipo_servicio, id_recurso, motivo = null, creado_por = null } = req.body || {};
    if (!validTipo(tipo_servicio) || !id_recurso) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos (tipo_servicio, id_recurso)' });
    }
    const conn = await pool.getConnection();
    try {
      const selectSql = tipo_servicio === 'sala'
        ? `SELECT s.*, u.correo_electronico, sa.nombre AS recurso_nombre FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN salas sa ON s.id_sala = sa.id_sala
            WHERE s.id_sala = ? AND s.servicio='sala' AND s.estado_reserva='aprobado'
            ORDER BY CONCAT(s.fecha,' ',s.hora_inicio) ASC LIMIT 1`
        : `SELECT s.*, u.correo_electronico, v.nombre AS recurso_nombre FROM solicitudes s
            LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
            LEFT JOIN videoproyectores v ON s.id_videoproyector = v.id_videoproyector
            WHERE s.id_videoproyector = ? AND s.servicio='videoproyector' AND s.estado_reserva='aprobado'
            ORDER BY CONCAT(s.fecha,' ',s.hora_inicio) ASC LIMIT 1`;
      const [rows] = await conn.execute(selectSql, [id_recurso]);
      if (!rows.length) return res.status(404).json({ success: false, message: 'No hay solicitud aprobada próxima para este recurso' });
      const solicitud = rows[0];
      await conn.execute('UPDATE solicitudes SET estado_reserva = ? WHERE id_solicitud = ?', ['anulado', solicitud.id_solicitud]);
      await conn.execute(
        'INSERT INTO historial_reservas (id_solicitud, fecha_modificacion, estado_anterior, estado_nuevo, comentarios) VALUES (?,?,?,?,?)',
        [solicitud.id_solicitud, new Date(), solicitud.estado_reserva, 'anulado', `Override admin: ${motivo || 'sin motivo'}`]
      );
      const [exists] = await conn.execute(
        'SELECT 1 FROM ocupaciones_especiales WHERE tipo_servicio=? AND id_recurso=? AND activo=1 LIMIT 1',
        [tipo_servicio, id_recurso]
      );
      if (!exists.length) {
        await conn.execute(
          'INSERT INTO ocupaciones_especiales (tipo_servicio, id_recurso, nota, creado_por, activo) VALUES (?,?,?,?,1)',
          [tipo_servicio, id_recurso, `override:${motivo || 'prioridad admin'}`, creado_por]
        );
      }
      let emailInfo = null;
      try {
        emailInfo = await sendOverrideNotification({
          to: solicitud.correo_electronico,
          recursoTipo: tipo_servicio,
          recursoNombre: solicitud.recurso_nombre || 'recurso',
          fecha: solicitud.fecha,
          hora_inicio: solicitud.hora_inicio,
          hora_fin: solicitud.hora_fin,
          motivo
        });
      } catch (e) { emailInfo = { error: e.message }; }
      try { sse.broadcast('solicitudes:update', { action: 'override', id_solicitud: solicitud.id_solicitud }); } catch {}
      try {
        if (tipo_servicio === 'videoproyector') sse.broadcast('videoproyectores:update', { action: 'override' });
        if (tipo_servicio === 'sala') sse.broadcast('salas:update', { action: 'override' });
      } catch {}
      res.json({ success: true, message: 'Solicitud anulada y recurso marcado como ocupación especial', data: { id_solicitud: solicitud.id_solicitud, estado_final: 'anulado', recurso: { tipo: tipo_servicio, id: id_recurso }, email: emailInfo } });
    } finally { conn.release(); }
  } catch (error) {
    console.error('Error realizando override:', error);
    res.status(500).json({ success: false, message: 'Error realizando override', error: error.message });
  }
});

module.exports = router;
