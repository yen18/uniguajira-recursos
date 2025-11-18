const express = require('express');
const { pool } = require('../config/database');
const sse = require('../utils/sse');
const { validate, schemas } = require('../utils/validation');
const router = express.Router();

// Validar que la clave de tipo exista en el catálogo
async function tipoExiste(tipo) {
  if (!tipo) return false;
  try {
    const [rows] = await pool.execute('SELECT 1 FROM catalogo_equipos WHERE clave=? LIMIT 1', [tipo]);
    return rows.length > 0;
  } catch (_) {
    return false;
  }
}

// GET - Listar todos los equipos (opcional filtro tipo)
router.get('/', async (req, res) => {
  try {
    const { tipo } = req.query;
    let sql = 'SELECT * FROM equipos';
    const params = [];
    if (tipo) { sql += ' WHERE tipo=?'; params.push(tipo); }
    sql += ' ORDER BY tipo ASC, id_equipo ASC';
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando equipos:', error);
    res.status(500).json({ success: false, message: 'Error listando equipos', error: error.message });
  }
});

// GET - Listar disponibles (opcional por tipo)
router.get('/disponibles', async (req, res) => {
  try {
    const { tipo } = req.query;
    let sql = "SELECT * FROM equipos WHERE estado='disponible'";
    const params = [];
    if (tipo) { sql += ' AND tipo=?'; params.push(tipo); }
    sql += ' ORDER BY tipo ASC, id_equipo ASC';
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando equipos disponibles:', error);
    res.status(500).json({ success: false, message: 'Error listando equipos disponibles', error: error.message });
  }
});

// GET - Por ID
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute('SELECT * FROM equipos WHERE id_equipo=?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error obteniendo equipo:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo equipo', error: error.message });
  }
});

// POST - Crear (validado)
router.post('/', validate(schemas.equipoCreate), async (req, res) => {
  try {
    const { tipo, nombre, descripcion = null, estado = 'disponible' } = req.validated.body || {};
    if (!(await tipoExiste(tipo))) return res.status(400).json({ success: false, message: 'Tipo inválido o inexistente en catálogo' });
    if (!nombre || String(nombre).trim().length < 2) return res.status(400).json({ success: false, message: 'Nombre requerido' });
    const [result] = await pool.execute(
      'INSERT INTO equipos (tipo, nombre, descripcion, estado) VALUES (?,?,?,?)',
      [tipo, String(nombre).trim(), descripcion ? String(descripcion).trim() : null, estado]
    );
    try { sse.broadcast('equipos:update', { action: 'create', tipo, id: result.insertId }); } catch {}
    res.status(201).json({ success: true, data: { id_equipo: result.insertId } });
  } catch (error) {
    console.error('Error creando equipo:', error);
    res.status(500).json({ success: false, message: 'Error creando equipo', error: error.message });
  }
});

// PUT - Actualizar
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, descripcion, tipo, estado } = req.body || {};
    const fields = [];
    const values = [];
    if (typeof nombre === 'string') { fields.push('nombre=?'); values.push(nombre.trim()); }
    if (typeof descripcion !== 'undefined') { fields.push('descripcion=?'); values.push(descripcion ? String(descripcion).trim() : null); }
    if (typeof tipo === 'string') {
      if (!(await tipoExiste(tipo))) return res.status(400).json({ success: false, message: 'Tipo inválido o inexistente en catálogo' });
      fields.push('tipo=?'); values.push(tipo);
    }
    if (typeof estado === 'string') { fields.push('estado=?'); values.push(estado); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Nada para actualizar' });
    values.push(id);
    const [result] = await pool.execute(`UPDATE equipos SET ${fields.join(', ')} WHERE id_equipo=?`, values);
    try { sse.broadcast('equipos:update', { action: 'update', id }); } catch {}
    res.json({ success: true, affected: result.affectedRows });
  } catch (error) {
    console.error('Error actualizando equipo:', error);
    res.status(500).json({ success: false, message: 'Error actualizando equipo', error: error.message });
  }
});

// DELETE - Eliminar
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.execute('DELETE FROM equipos WHERE id_equipo=?', [id]);
    try { sse.broadcast('equipos:update', { action: 'delete', id }); } catch {}
    res.json({ success: true, affected: result.affectedRows });
  } catch (error) {
    console.error('Error eliminando equipo:', error);
    res.status(500).json({ success: false, message: 'Error eliminando equipo', error: error.message });
  }
});

// PATCH - Cambiar estado (validado)
router.patch('/:id/estado', validate(schemas.equipoEstadoPatch), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.validated.body || {};
    if (!estado) return res.status(400).json({ success: false, message: 'Estado requerido' });
    const [result] = await pool.execute('UPDATE equipos SET estado=? WHERE id_equipo=?', [estado, id]);
    try { sse.broadcast('equipos:update', { action: 'estado', id, estado }); } catch {}
    res.json({ success: true, affected: result.affectedRows });
  } catch (error) {
    console.error('Error cambiando estado de equipo:', error);
    res.status(500).json({ success: false, message: 'Error cambiando estado de equipo', error: error.message });
  }
});

module.exports = router;
