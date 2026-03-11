// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (INTEGRACIÓN TOTAL P1 + P5 + SEGURIDAD P4)
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
            [email, password, 'usuario'] 
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

// --- 2. LOGIN DE USUARIOS (Con Filtro de Suspensión) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const query = `
            SELECT u.id, u.email, u.password, u.rol, u.estado, p.nombre 
            FROM usuarios u
            JOIN perfiles p ON u.id = p.usuario_id
            WHERE u.email = ?`;
            
        const [usuarios] = await db.query(query, [email]);

        if (usuarios.length === 0) {
            return res.status(401).json({ error: "El correo no está registrado." });
        }

        const usuario = usuarios[0];

        // 🛡️ FILTRO DE SEGURIDAD: Verificamos si la cuenta está suspendida
        if (usuario.estado === 'suspendido') {
            return res.status(403).json({ 
                error: "Acceso denegado. Tu cuenta se encuentra suspendida por el Administrador. 🚫" 
            });
        }

        if (usuario.password !== password) {
            return res.status(401).json({ error: "Contraseña incorrecta." });
        }

        res.json({ 
            mensaje: "¡Bienvenido de nuevo!", 
            usuarioId: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol, 
            email: usuario.email 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor al intentar entrar." });
    }
});

// --- 3. OBTENER AJUSTES Y PERFIL ---
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

// --- 5. BUSCADOR DE USUARIOS (Radar P5) ---
router.get('/buscar', async (req, res) => {
    const { q, miId } = req.query;

    if (!q) return res.json([]);

    try {
        const query = `
            SELECT usuario_id, nombre, apellido, foto_url 
            FROM perfiles 
            WHERE (nombre LIKE ? OR apellido LIKE ? OR CONCAT(nombre, ' ', apellido) LIKE ?)
            AND usuario_id != ?
            LIMIT 10`;
        
        const busqueda = `%${q}%`;
        const [usuarios] = await db.query(query, [busqueda, busqueda, busqueda, miId]);
        
        res.json(usuarios);
    } catch (err) {
        console.error("🚨 Error en el buscador SQL:", err);
        res.status(500).json({ error: "No se pudo realizar la búsqueda." });
    }
});

// --- 🚫 6. SUSPENDER USUARIO (Solo Admin ID: 1 - Punto #20) ---
router.patch('/suspendido/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.body; 

    // Verificamos autoridad del Arquitecto
    if (parseInt(adminId) !== 1) {
        return res.status(403).json({ error: "No tienes permisos de administrador." });
    }

    try {
        await db.query('UPDATE usuarios SET estado = "suspendido" WHERE id = ?', [id]);
        res.json({ mensaje: "La cuenta ha sido suspendida correctamente. 🚫" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al actualizar el estado del usuario." });
    }
});

module.exports = router;