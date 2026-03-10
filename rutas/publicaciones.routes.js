// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE CONTENIDOS Y PRIVACIDAD P2)
// ARCHIVO: rutas/publicaciones.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- [1] OBTENER EL MURO FILTRADO POR PRIVACIDAD ---
// Sustituye al GET / anterior para que Lucero no vea lo que no debe
router.get('/:visorId', async (req, res) => {
    const { visorId } = req.params; 

    try {
        const query = `
            SELECT p.*, perf.nombre, perf.apellido 
            FROM publicaciones p
            JOIN perfiles perf ON p.usuario_id = perf.usuario_id
            WHERE 
                p.usuario_id = ? -- 1. Mis propias publicaciones (Siempre las veo)
                OR p.privacidad = 'publica' -- 2. Publicaciones de otros marcadas como públicas
                OR (p.privacidad = 'amigos' AND p.usuario_id IN ( -- 3. Solo de amigos aceptados
                    SELECT CASE 
                        WHEN usuario_envia_id = ? THEN usuario_recibe_id 
                        ELSE usuario_envia_id 
                    END
                    FROM amistades 
                    WHERE (usuario_envia_id = ? OR usuario_recibe_id = ?) 
                    AND estado = 'aceptada'
                ))
            ORDER BY p.id DESC`;

        const [posts] = await db.query(query, [visorId, visorId, visorId, visorId]);
        res.json(posts);
    } catch (err) {
        console.error("🚨 Error SQL en Muro Filtrado:", err);
        res.status(500).json({ error: "Error al cargar el muro personalizado." });
    }
});

// --- [2] OBTENER POSTS DE UN USUARIO (Para el Perfil Personal) ---
router.get('/usuario/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT * FROM publicaciones 
            WHERE usuario_id = ? 
            ORDER BY id DESC`;
        const [posts] = await db.query(query, [id]);
        res.json(posts);
    } catch (err) {
        console.error("🚨 Error SQL en Perfil:", err);
        res.status(500).json({ error: "Error al cargar las publicaciones del perfil." });
    }
});

// --- [3] CREAR NUEVA PUBLICACIÓN ---
router.post('/crear', async (req, res) => {
    const { usuario_id, contenido, privacidad } = req.body;
    try {
        await db.query(
            'INSERT INTO publicaciones (usuario_id, contenido, privacidad) VALUES (?, ?, ?)',
            [usuario_id, contenido, privacidad || 'publica']
        );
        res.status(201).json({ mensaje: "Publicación creada con éxito ✅" });
    } catch (err) {
        console.error("🚨 Error SQL al crear post:", err);
        res.status(500).json({ error: "No se pudo guardar la publicación." });
    }
});

// --- [4] REACCIONAR A UN POST (Me gusta) ---
router.post('/reaccionar', async (req, res) => {
    const { publicacion_id, usuario_id, tipo } = req.body;
    try {
        await db.query(
            `INSERT INTO reacciones (publicacion_id, usuario_id, tipo) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE tipo = ?`,
            [publicacion_id, usuario_id, tipo, tipo]
        );
        res.json({ mensaje: "Reacción procesada" });
    } catch (err) {
        res.status(500).json({ error: "Error al procesar la reacción." });
    }
});

// --- [5] OBTENER COMENTARIOS DE UN POST ---
router.get('/:id/comentarios', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT c.*, p.nombre 
            FROM comentarios c 
            JOIN perfiles p ON c.usuario_id = p.usuario_id 
            WHERE c.publicacion_id = ?
            ORDER BY c.id ASC`;
        const [comentarios] = await db.query(query, [id]);
        res.json(comentarios);
    } catch (err) { 
        res.status(500).json({ error: "Error al obtener comentarios." }); 
    }
});

// --- [6] CREAR NUEVO COMENTARIO ---
router.post('/comentar', async (req, res) => {
    const { publicacion_id, usuario_id, contenido } = req.body;
    try {
        await db.query(
            'INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES (?, ?, ?)', 
            [publicacion_id, usuario_id, contenido]
        );
        res.json({ mensaje: "Comentario publicado" });
    } catch (err) { 
        res.status(500).json({ error: "Error al guardar el comentario." }); 
    }
});

module.exports = router;