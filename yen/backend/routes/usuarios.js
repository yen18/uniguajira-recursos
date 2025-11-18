const express = require('express');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
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

// POST - Crear nuevo usuario
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, correo_electronico, pass, tipo_de_usuario } = req.body;

        console.log('=== CREATING NEW USER ===');
        console.log('Received data:', { nombre, apellido, correo_electronico, pass, tipo_de_usuario });

        // Validaciones básicas
        if (!nombre || !apellido || !correo_electronico || !pass || !tipo_de_usuario) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el correo ya existe
        const [existingUser] = await pool.execute(
            'SELECT id_usuario FROM usuarios WHERE correo_electronico = ?',
            [correo_electronico]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado'
            });
        }

        // IMPORTANTE: NO encriptar contraseña - usar texto plano
        console.log('Password to save (plain text):', pass);

        const [result] = await pool.execute(
            'INSERT INTO usuarios (nombre, apellido, correo_electronico, pass, tipo_de_usuario) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido, correo_electronico, pass, tipo_de_usuario]
        );

        console.log('User created successfully with ID:', result.insertId);
        console.log('Password saved as:', pass);
        console.log('========================\n');

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                id_usuario: result.insertId,
                nombre,
                apellido,
                correo_electronico,
                tipo_de_usuario
            }
        });
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando usuario',
            error: error.message
        });
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

// POST - Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { correo_electronico, pass } = req.body;

        if (!correo_electronico || !pass) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son requeridos'
            });
        }

        const [users] = await pool.execute(
            'SELECT * FROM usuarios WHERE correo_electronico = ?',
            [correo_electronico]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];
        
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', correo_electronico);
        console.log('Input password:', pass);
        console.log('Stored password:', user.pass);
        console.log('Password lengths:', { input: pass.length, stored: user.pass.length });
        
        // Validar contraseña con comparación directa (todas las contraseñas son texto plano)
        const validPassword = pass === user.pass;
        
        console.log('Password match:', validPassword);
        console.log('=====================\n');

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // No enviar la contraseña en la respuesta
        const { pass: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login exitoso',
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
});

module.exports = router;