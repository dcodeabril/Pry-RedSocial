// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (IDENTIDAD: LIZBETH RÍOS 👑)
// ARCHIVO: rutas/usuarios.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// --- 🏗️ CONFIGURACIÓN LOCAL DE MULTER (Subida de Avatares) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/perfiles/'); 
    },
    filename: function (req, file, cb) {
        const userId = req.params.id;
        const extension = path.extname(file.originalname);
        cb(null, `avatar_${userId}_${Date.now()}${extension}`);
    }
});
const upload = multer({ storage: storage });

// --- 1. REGISTRO MAESTRO ---
router.post('/registro', async (req, res) => {
    const { email, password } = req.body;
    if (password.length !== 12) {
        return res.status(400).json({ error: "La contraseña debe tener exactamente 12 caracteres." });
    }
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [resultado] = await db.query(
            'INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)',
            [email, hashedPassword, 'usuario'] 
        );
        const nuevoId = resultado.insertId;
        await db.query(
            'INSERT INTO perfiles (usuario_id, nombre, apellido) VALUES (?, ?, ?)',
            [nuevoId, 'Nuevo', 'Usuario']
        );
        const saludo = `¡Hola! Soy Lizbeth Ríos, la Arquitecta de esta red social. ¡Bienvenida/o a bordo!`;
        await db.query(
            'INSERT INTO mensajes (emisor_id, receptor_id, contenido) VALUES (?, ?, ?)',
            [1, nuevoId, saludo]
        );
        res.status(201).json({ mensaje: "¡Cuenta creada con éxito!", id: nuevoId });
    } catch (err) {
        res.status(500).json({ error: "Error al registrar usuario." });
    }
});

// --- 2. LOGIN DE USUARIOS ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const query = `
            SELECT u.id, u.email, u.password, u.rol, u.estado, p.nombre 
            FROM usuarios u
            JOIN perfiles p ON u.id = p.usuario_id
            WHERE u.email = ?`;
        const [usuarios] = await db.query(query, [email]);
        if (usuarios.length === 0) return res.status(401).json({ error: "No registrado." });
        const usuario = usuarios[0];
        if (usuario.estado === 'suspendido') return res.status(403).json({ error: "Cuenta suspendida. 🚫" });
        const coinciden = await bcrypt.compare(password, usuario.password);
        if (!coinciden) return res.status(401).json({ error: "Contraseña incorrecta." });
        res.json({ usuarioId: usuario.id, nombre: usuario.nombre, rol: usuario.rol, email: usuario.email });
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor." });
    }
});

// --- 3. OBTENER AJUSTES ---
router.get('/ajustes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT u.email, u.rol, u.preferencia_tema, p.nombre, p.apellido, p.bio, p.foto_url 
            FROM usuarios u 
            JOIN perfiles p ON u.id = p.usuario_id 
            WHERE u.id = ?`;
        const [rows] = await db.query(query, [id]);
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ error: "No encontrado" });
    } catch (err) { res.status(500).json({ error: "Error al obtener datos" }); }
});

// --- 4. ACTUALIZAR AJUSTES (Híbrido: Campos + Foto) ---
router.put('/actualizar-ajustes/:id', upload.single('foto_perfil'), async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, bio, tema, password } = req.body;
    let fotoUrl = req.file ? req.file.filename : null; 

    try {
        if (password && password.length === 12) {
            const hashedNewPassword = await bcrypt.hash(password, 10);
            await db.query('UPDATE usuarios SET password = ?, preferencia_tema = ? WHERE id = ?', [hashedNewPassword, tema, id]);
        } else {
            await db.query('UPDATE usuarios SET preferencia_tema = ? WHERE id = ?', [tema, id]);
        }

        let queryPerfil = "UPDATE perfiles SET nombre = ?, apellido = ?, bio = ?";
        let paramsPerfil = [nombre, apellido, bio];

        if (fotoUrl) {
            queryPerfil += ", foto_url = ?";
            paramsPerfil.push(fotoUrl);
        }

        queryPerfil += " WHERE usuario_id = ?";
        paramsPerfil.push(id);
        
        await db.query(queryPerfil, paramsPerfil);

        res.json({ mensaje: "¡Perfil actualizado correctamente! ✅", foto_url: fotoUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error crítico al guardar cambios." });
    }
});

// --- 🔍 5. BUSCADOR PREDICTIVO ---
router.get('/buscar', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    try {
        const query = `SELECT usuario_id, nombre, apellido, foto_url, bio FROM perfiles WHERE nombre LIKE ? OR apellido LIKE ? LIMIT 5`;
        const termino = `${q}%`; 
        const [resultados] = await db.query(query, [termino, termino]);
        res.json(resultados);
    } catch (err) { res.status(500).json({ error: "Error en el buscador" }); }
});

// --- 👤 6. OBTENER PERFIL PÚBLICO (ACTUALIZADO: JOIN ROBUSTO) ---
router.get('/perfil/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Usamos LEFT JOIN para evitar el 404 si la tabla 'perfiles' tiene inconsistencias
        const query = `
            SELECT u.id, u.email, u.estado, p.nombre, p.apellido, p.bio, p.foto_url 
            FROM usuarios u 
            LEFT JOIN perfiles p ON u.id = p.usuario_id 
            WHERE u.id = ?`;
        const [rows] = await db.query(query, [id]);
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: "Usuario no encontrado en la base de datos central." });
        }
    } catch (err) { 
        console.error("🚨 Error en SQL Perfil:", err);
        res.status(500).json({ error: "Error interno del servidor." }); 
    }
});

// --- 🚫 7. SUSPENDER USUARIO ---
router.patch('/suspendido/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.body; 
    if (parseInt(adminId) !== 1) return res.status(403).json({ error: "No autorizado." });
    try {
        await db.query('UPDATE usuarios SET estado = "suspendido" WHERE id = ?', [id]);
        res.json({ mensaje: "Cuenta suspendida. 🚫" });
    } catch (err) { res.status(500).json({ error: "Error." }); }
});

// --- 🔑 8. PROMOVER USUARIO ---
router.patch('/promover', async (req, res) => {
    const { usuario_a_promover, codigo, admin_solicitante_id } = req.body;
    try {
        if (admin_solicitante_id != 1) return res.status(403).json({ error: "No autorizado. 🚫" });
        const [busqueda] = await db.query('SELECT * FROM codigos_admin WHERE codigo = ? AND estado = "disponible"', [codigo]);
        if (busqueda.length === 0) return res.status(403).json({ error: "Código inválido. ❌" });
        const codigoId = busqueda[0].id;
        await db.query('UPDATE usuarios SET rol = "admin" WHERE id = ?', [usuario_a_promover]);
        await db.query(`UPDATE codigos_admin SET estado = "usado", usuario_que_lo_uso = ?, fecha_uso = NOW() WHERE id = ?`, [usuario_a_promover, codigoId]);
        res.json({ mensaje: "¡Usuario ascendido! ⭐" });
    } catch (err) { res.status(500).json({ error: "Error." }); }
});

module.exports = router;