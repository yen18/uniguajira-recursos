const express = require('express');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { validate, schemas } = require('../utils/validation');
const router = express.Router();

// GET - Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id_usuario, nombre, apellido, correo_electronico, tipo_de_usuario FROM usuarios ORDER BY id_usuario DESC');
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo usuarios',
            error: error.message
        });
    }
});

// GET - Obtener usuario por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            'SELECT id_usuario, nombre, apellido, correo_electronico, tipo_de_usuario FROM usuarios WHERE id_usuario = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo usuario',
            error: error.message
        });
    }
});

// POST - Crear nuevo usuario (validado + hash bcrypt)
router.post('/', validate(schemas.usuarioCreate), async (req, res) => {
    try {
        const { nombre, apellido, correo_electronico, pass, tipo_de_usuario } = req.validated.body;
        if (!nombre || !apellido || !correo_electronico || !pass || !tipo_de_usuario) {
            return res.status(400).json({ success:false, message:'Todos los campos son requeridos' });
        }
        const [existingUser] = await pool.execute('SELECT id_usuario FROM usuarios WHERE correo_electronico=?', [correo_electronico]);
        if (existingUser.length) {
            return res.status(400).json({ success:false, message:'El correo electrónico ya está registrado' });
        }
        const { hashPassword } = require('../utils/auth');
        let hashed;
        try { hashed = await hashPassword(pass); } catch { return res.status(400).json({ success:false, message:'Contraseña inválida' }); }
        const [result] = await pool.execute(
            'INSERT INTO usuarios (nombre, apellido, correo_electronico, pass, tipo_de_usuario) VALUES (?,?,?,?,?)',
            [nombre, apellido, correo_electronico, hashed, tipo_de_usuario]
        );
        res.status(201).json({ success:true, message:'Usuario creado exitosamente', data:{ id_usuario: result.insertId, nombre, apellido, correo_electronico, tipo_de_usuario } });
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ success:false, message:'Error creando usuario', error:error.message });
    }
});

// PUT - Actualizar usuario
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, correo_electronico, tipo_de_usuario } = req.body;

        // Verificar si el usuario existe
        const [existingUser] = await pool.execute('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const [result] = await pool.execute(
            'UPDATE usuarios SET nombre = ?, apellido = ?, correo_electronico = ?, tipo_de_usuario = ? WHERE id_usuario = ?',
            [nombre, apellido, correo_electronico, tipo_de_usuario, id]
        );

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: { id_usuario: id, nombre, apellido, correo_electronico, tipo_de_usuario }
        });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando usuario',
            error: error.message
        });
    }
});

// DELETE - Eliminar usuario
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el usuario existe
        const [existingUser] = await pool.execute('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        await pool.execute('DELETE FROM usuarios WHERE id_usuario = ?', [id]);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando usuario',
            error: error.message
        });
    }
});

// POST - Login (migración silenciosa a hash)
router.post('/login', validate(schemas.usuarioLogin), async (req, res) => {
  try {
    const { correo_electronico, pass } = req.validated.body;
        if (!correo_electronico || !pass) {
            if (process.env.AUTH_VERBOSE === '1') console.warn('[AUTH][login] Falla: campos vacíos', { correo_electronico_present: !!correo_electronico, pass_present: !!pass });
            return res.status(400).json({ success:false, message:'Correo y contraseña son requeridos' });
        }
    // Permitir alias sin email: si no contiene '@' buscar también por alias temporal
    let queryUser = correo_electronico;
    const [users] = await pool.execute('SELECT * FROM usuarios WHERE correo_electronico=? LIMIT 1', [queryUser]);
        if (!users.length) {
        // Fallback: intentar por campo alterno 'correo_electronico' igual al alias directamente si existe en BD
        if (!correo_electronico.includes('@')) {
            const [alt] = await pool.execute('SELECT * FROM usuarios WHERE correo_electronico=? LIMIT 1', [correo_electronico]);
            if (alt.length) {
                users.push(alt[0]);
            }
        }
    }
    if (!users.length) {
            if (process.env.AUTH_VERBOSE === '1') console.warn('[AUTH][login] Falla: usuario no existe', { correo: correo_electronico });
            return res.status(401).json({ success:false, message:'Credenciales inválidas' });
        }
    let user = users[0];
    const { verifyPassword, hashPassword, isHashedPassword, signAccessToken, generateAndStoreRefresh, setRefreshCookie } = require('../utils/auth');
    const ok = await verifyPassword(pass, user.pass);
        if (!ok) {
            if (process.env.AUTH_VERBOSE === '1') console.warn('[AUTH][login] Falla: password incorrecto', { correo: correo_electronico });
            return res.status(401).json({ success:false, message:'Credenciales inválidas' });
        }
    // Upgrade si era texto plano
    if (!isHashedPassword(user.pass)) {
      try {
        const newHash = await hashPassword(pass);
        await pool.execute('UPDATE usuarios SET pass=? WHERE id_usuario=?', [newHash, user.id_usuario]);
        user.pass = newHash;
      } catch(e) { console.warn('No se pudo actualizar a hash:', e.message); }
    }
    const accessToken = signAccessToken(user);
    const refreshToken = await generateAndStoreRefresh(user);
    setRefreshCookie(res, refreshToken);
    const { pass: _, ...userWithoutPassword } = user;
        if (process.env.AUTH_VERBOSE === '1') console.log('[AUTH][login] Éxito', { id_usuario: user.id_usuario, tipo: user.tipo_de_usuario });
        res.json({ success:true, message:'Login exitoso', data:userWithoutPassword, access_token: accessToken, expires_in_min: parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '15',10) });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success:false, message:'Error en el servidor', error:error.message });
  }
});

module.exports = router;