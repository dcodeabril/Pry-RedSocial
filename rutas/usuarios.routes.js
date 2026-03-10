// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (INTEGRACIÓN TOTAL P1 + P5)
// ARCHIVO: rutas/usuarios.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. REGISTRO MAESTRO (Persona 1 y 5) ---
router.post('/registro', async (req, res) => {
    const { email, password } = req.body;

    if (password.length !== 12) {
        return res.status(400).json({ error: "La contraseña debe tener exactamente 12 caracteres." });
    }

    try {
        const [resultado] = await db.query(
            'INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)',
            [email, password, 'usuario'] // Por defecto todos son usuarios
        );
        
        const nuevoId = resultado.insertId;

        await db.query(
            'INSERT INTO perfiles (usuario_id, nombre, apellido) VALUES (?, ?, ?)',
            [nuevoId, 'Nuevo', 'Usuario']
        );

        const saludo = `¡Hola! Soy Israel Díaz, el Arquitecto de esta red social. ¡Bienvenido/a a bordo!`;
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
        res.status(500).json({ error: "Error al registrar usuario." });
    }
});

// --- 2. LOGIN DE USUARIOS (Corregido para enviar ROL y NOMBRE) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 🛡️ Buscamos al usuario y traemos su nombre de perfil al mismo tiempo
        const query = `
            SELECT u.id, u.email, u.password, u.rol, p.nombre 
            FROM usuarios u
            JOIN perfiles p ON u.id = p.usuario_id
            WHERE u.email = ?`;
            
        const [usuarios] = await db.query(query, [email]);

        if (usuarios.length === 0) {
            return res.status(401).json({ error: "El correo no está registrado." });
        }

        const usuario = usuarios[0];

        if (usuario.password !== password) {
            return res.status(401).json({ error: "Contraseña incorrecta." });
        }

        // ✅ RESPUESTA MAESTRA: Ahora enviamos el ROL y el NOMBRE
        res.json({ 
            mensaje: "¡Bienvenido de nuevo!", 
            usuarioId: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol, // 🔑 ¡Aquí está la llave del admin!
            email: usuario.email 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor al intentar entrar." });
    }
});

// --- 3. OBTENER AJUSTES Y PERFIL (Añadido el ROL para el Global) ---
router.get('/ajustes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT u.email, u.rol, u.preferencia_tema, p.nombre, p.apellido, p.bio, p.foto_url 
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
        res.status(500).json({ error: "Error al obtener los datos" });
    }
});

// --- 4. ACTUALIZAR AJUSTES ---
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
        res.status(500).json({ error: "Error crítico al guardar." });
    }
});

module.exports = router;