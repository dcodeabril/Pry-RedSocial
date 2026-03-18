// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTA (GESTIÓN ESTRATÉGICA DE POSTS Y TESOROS)
// ARCHIVO: rutas/publicaciones.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- [1] OBTENER EL MURO CON FILTRO DE AMISTAD ---
router.get('/muro/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const query = `
            SELECT 
                p.*, 
                perf.nombre, perf.apellido, perf.foto_url,
                p_orig.contenido AS contenido_original,
                perf_orig.nombre AS nombre_original,
                perf_orig.apellido AS apellido_original
            FROM publicaciones p
            JOIN perfiles perf ON p.usuario_id = perf.usuario_id
            LEFT JOIN publicaciones p_orig ON p.original_post_id = p_orig.id
            LEFT JOIN perfiles perf_orig ON p_orig.usuario_id = perf_orig.usuario_id
            WHERE 
                p.usuario_id = ? 
                OR (
                    p.privacidad = 'publica' 
                    AND p.usuario_id IN ( 
                        SELECT usuario_envia_id FROM amistades WHERE usuario_recibe_id = ? AND estado = 'aceptada'
                        UNION
                        SELECT usuario_recibe_id FROM amistades WHERE usuario_envia_id = ? AND estado = 'aceptada'
                    )
                )
            ORDER BY p.fecha DESC`;

        const [posts] = await db.query(query, [usuarioId, usuarioId, usuarioId]);
        res.json(posts);
    } catch (err) {
        console.error("🚨 Error en muro restrictivo:", err);
        res.status(500).json({ error: "No se pudo cargar el muro privado." });
    }
});

// --- [2] OBTENER POSTS EN EL PERFIL (FILTRO DINÁMICO) ---
router.get('/usuario/:perfilId', async (req, res) => {
    const { perfilId } = req.params; 
    const visitanteId = req.query.visitanteId; 

    try {
        let query;
        let params;

        if (perfilId == visitanteId) {
            query = `SELECT p.* FROM publicaciones p WHERE p.usuario_id = ? ORDER BY p.id DESC`;
            params = [perfilId];
        } else {
            query = `
                SELECT p.* FROM publicaciones p 
                WHERE p.usuario_id = ? 
                AND (
                    (p.privacidad = 'publica' OR p.privacidad = 'amigos')
                    AND ? IN ( 
                        SELECT usuario_envia_id FROM amistades WHERE usuario_recibe_id = ? AND estado = 'aceptada'
                        UNION
                        SELECT usuario_recibe_id FROM amistades WHERE usuario_envia_id = ? AND estado = 'aceptada'
                    )
                )
                ORDER BY p.id DESC`;
            params = [perfilId, visitanteId, perfilId, perfilId];
        }

        const [posts] = await db.query(query, params);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "Error al cargar publicaciones del perfil." });
    }
});

// --- [3] COMPARTIR PUBLICACIÓN ---
router.post('/compartir', async (req, res) => {
    const { usuario_id, publicacion_id, comentario } = req.body;
    try {
        const query = `INSERT INTO publicaciones (usuario_id, contenido, tipo, original_post_id, privacidad) VALUES (?, ?, 'compartido', ?, 'publica')`;
        await db.query(query, [usuario_id, comentario, publicacion_id]);
        res.json({ mensaje: "¡Compartido con éxito! 🚀" });
    } catch (err) { res.status(500).json({ error: "Error al compartir." }); }
});

// --- [4] CREAR NUEVA PUBLICACIÓN ---
router.post('/crear', async (req, res) => {
    const { usuario_id, contenido, privacidad } = req.body;
    try {
        await db.query('INSERT INTO publicaciones (usuario_id, contenido, privacidad, tipo) VALUES (?, ?, ?, "original")', 
        [usuario_id, contenido, privacidad || 'publica']);
        res.status(201).json({ mensaje: "Publicación creada ✅" });
    } catch (err) { res.status(500).json({ error: "Error al guardar." }); }
});

// --- [5] REACCIONAR ---
router.post('/reaccionar', async (req, res) => {
    const { publicacion_id, usuario_id, tipo } = req.body;
    try {
        await db.query(`INSERT INTO reacciones (publicacion_id, usuario_id, tipo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE tipo = ?`, 
        [publicacion_id, usuario_id, tipo, tipo]);
        res.json({ mensaje: "Reacción guardada ✅" });
    } catch (err) { res.status(500).json({ error: "Error en reacción." }); }
});

// --- [6] ELIMINAR PUBLICACIÓN ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.query; 

    try {
        let queryBorrado;
        let params;
        const esAdmin = (parseInt(usuario_id) === 1 || parseInt(usuario_id) === 2);

        if (esAdmin) {
            queryBorrado = 'DELETE FROM publicaciones WHERE id = ?';
            params = [id];
        } else {
            queryBorrado = 'DELETE FROM publicaciones WHERE id = ? AND usuario_id = ?';
            params = [id, usuario_id];
        }

        const [resultado] = await db.query(queryBorrado, params);
        if (resultado.affectedRows > 0) res.json({ mensaje: "Post eliminado 🗑️" });
        else res.status(403).json({ error: "No tienes permiso para borrar esto." });
    } catch (err) { res.status(500).json({ error: "Error al eliminar." }); }
});

// --- [7] VER TESOROS DEL BAÚL (SINCRONIZADO ASYNC) ---
router.get('/baul/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const query = `
            SELECT 
                p.*, 
                pr.nombre, pr.apellido, pr.foto_url,
                b.fecha_guardado 
            FROM baul b
            JOIN publicaciones p ON b.publicacion_id = p.id
            LEFT JOIN perfiles pr ON p.usuario_id = pr.usuario_id
            WHERE b.usuario_id = ?
            ORDER BY b.fecha_guardado DESC
        `;
        const [tesoros] = await db.query(query, [usuarioId]);
        res.json(tesoros); 
    } catch (err) {
        console.error("🚨 Error en DB al leer baúl:", err);
        res.status(500).json({ error: "Error al consultar el baúl" });
    }
});

// --- [8] GUARDAR NUEVO TESORO (SINCRONIZADO ASYNC) ---
router.post('/baul/guardar', async (req, res) => {
    const { usuario_id, publicacion_id } = req.body;
    try {
        await db.query("INSERT IGNORE INTO baul (usuario_id, publicacion_id) VALUES (?, ?)", [usuario_id, publicacion_id]);
        res.json({ success: true, mensaje: "¡Tesoro guardado! 💾" });
    } catch (err) {
        console.error("🚨 Error al guardar tesoro:", err);
        res.status(500).json({ error: "No se pudo guardar" });
    }
});

// --- [9] QUITAR DEL BAÚL (SINCRONIZADO ASYNC) ---
router.delete('/baul/:postId', async (req, res) => {
    const { postId } = req.params;
    const { usuario_id } = req.query;
    try {
        await db.query("DELETE FROM baul WHERE publicacion_id = ? AND usuario_id = ?", [postId, usuario_id]);
        res.json({ mensaje: "Tesoro eliminado con éxito" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

// --- [10] OBTENER COMENTARIOS ---
router.get('/:id/comentarios', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`SELECT c.*, p.nombre, p.apellido FROM comentarios c JOIN perfiles p ON c.usuario_id = p.usuario_id WHERE c.publicacion_id = ? ORDER BY c.id ASC`, [id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: "Error en comentarios." }); }
});

// --- [11] COMENTAR ---
router.post('/comentar', async (req, res) => {
    const { publicacion_id, usuario_id, contenido } = req.body;
    try {
        await db.query('INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES (?, ?, ?)', [publicacion_id, usuario_id, contenido]);
        res.json({ mensaje: "Comentario publicado ✅" });
    } catch (err) { res.status(500).json({ error: "Error al comentar." }); }
});

module.exports = router;