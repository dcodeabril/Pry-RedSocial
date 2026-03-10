// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (INTEGRACIÓN TOTAL P1 + P5)
// ARCHIVO: rutas/usuarios.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. REGISTRO MAESTRO (Persona 1 y 5) ---
// Crea Usuario, Perfil y envía Mensaje de Bienvenida
router.post('/registro', async (req, res) => {
    const { email, password } = req.body;

    // 🛡️ Regla de Oro: Contraseña de exactamente 12 caracteres
    if (password.length !== 12) {
        return res.status(400).json({ error: "La contraseña debe tener exactamente 12 caracteres." });
    }

    try {
        // A. Insertamos en la Tabla 1: usuarios
        const [resultado] = await db.query(
            'INSERT INTO usuarios (email, password) VALUES (?, ?)',
            [email, password]
        );
        
        const nuevoId = resultado.insertId;

        // B. [NUEVO] Insertamos automáticamente en la Tabla 2: perfiles
        // Esto evita errores cuando el usuario nuevo intente ver su muro o perfil
        await db.query(
            'INSERT INTO perfiles (usuario_id, nombre, apellido) VALUES (?, ?, ?)',
            [nuevoId, 'Nuevo', 'Usuario']
        );

        // C. [NUEVO] Mensaje de Bienvenida Automático del Arquitecto (ID 1)
        const saludo = `¡Hola! Soy Israel Díaz, el Arquitecto de esta red social. ¡Bienvenida a bordo!`;
        await db.query(
            'INSERT INTO mensajes (emisor_id, receptor_id, contenido) VALUES (?, ?, ?)',
            [1, nuevoId, saludo]
        );

        res.status(201).json({ 
            mensaje: "¡Cuenta creada con éxito! Ya puedes iniciar sesión.", 
            id: nuevoId 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al registrar: el email ya existe o hay un fallo en la base de datos." });
    }
});

// --- 2. LOGIN DE USUARIOS (Persona 1: Seguridad) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (usuarios.length === 0) {
            return res.status(401).json({ error: "El correo no está registrado." });
        }

        const usuario = usuarios[0];

        if (usuario.password !== password) {
            return res.status(401).json({ error: "Contraseña incorrecta." });
        }

        res.json({ 
            mensaje: "¡Bienvenido de nuevo!", 
            usuarioId: usuario.id,
            email: usuario.email 
        });

    } catch (err) {
        res.status(500).json({ error: "Error en el servidor al intentar entrar." });
    }
});

// --- 3. OBTENER AJUSTES Y PERFIL (Persona 1 y 5) ---
router.get('/ajustes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT u.email, u.preferencia_tema, p.nombre, p.apellido, p.bio, p.foto_url 
            FROM usuarios u 
            JOIN perfiles p ON u.id = p.usuario_id 
            WHERE u.id = ?`;
        
        const [rows] = await db.query(query, [id]);
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: "Usuario no encontrado" });
        }
    } catch (err) {
        res.status(500).json({ error: "Error al obtener los datos del servidor" });
    }
});

// --- 4. SUPER-UPDATE: PERFIL Y AJUSTES (Persona 1 y 5) ---
router.put('/actualizar-ajustes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, bio, foto_url, tema, password } = req.body;

    try {
        if (password) {
            if (password.length !== 12) {
                return res.status(400).json({ error: "La contraseña debe ser de 12 caracteres." });
            }
            await db.query('UPDATE usuarios SET password = ?, preferencia_tema = ? WHERE id = ?', [password, tema, id]);
        } else {
            await db.query('UPDATE usuarios SET preferencia_tema = ? WHERE id = ?', [tema, id]);
        }

        await db.query(
            `UPDATE perfiles 
             SET nombre = ?, apellido = ?, bio = ?, foto_url = ? 
             WHERE usuario_id = ?`,
            [nombre, apellido, bio, foto_url, id]
        );

        res.json({ mensaje: "¡Perfil y ajustes actualizados correctamente! ✅" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error crítico al guardar en la base de datos." });
    }
});

module.exports = router;