// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTA (GESTIÓN ESTRATÉGICA DE POSTS Y TESOROS)
// ARCHIVO: rutas/publicaciones.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- [1] OBTENER EL MURO / FEED (SEGURIDAD DE JERAQUÍA TOTAL) ---
router.get('/muro/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        // Consultamos el rol para saber si aplicamos restricciones o acceso total
        const [u] = await db.query('SELECT rol FROM usuarios WHERE id = ?', [usuarioId]);
        const esAdmin = u.length > 0 && u[0].rol === 'admin';

        let query;
        let params;

        if (esAdmin) {
            // ⭐ ADMIN: Ve todas las publicaciones de la red en su muro
            query = `
                SELECT p.*, perf.nombre, perf.apellido, perf.foto_url,
                       p_orig.contenido AS contenido_original,
                       perf_orig.nombre AS nombre_original, perf_orig.apellido AS apellido_original,
                       (SELECT COUNT(*) FROM reacciones WHERE publicacion_id = p.id AND tipo = 'like') AS total_likes,
                       (SELECT COUNT(*) FROM comentarios WHERE publicacion_id = p.id) AS total_comentarios,
                       (SELECT COUNT(*) FROM reacciones WHERE publicacion_id = p.id AND usuario_id = ? AND tipo = 'like') AS reaccionado,
                       'aceptada' AS estado_relacion
                FROM publicaciones p
                JOIN perfiles perf ON p.usuario_id = perf.usuario_id
                LEFT JOIN publicaciones p_orig ON p.original_post_id = p_orig.id
                LEFT JOIN perfiles perf_orig ON p_orig.usuario_id = perf_orig.usuario_id
                ORDER BY p.fecha DESC`;
            params = [usuarioId];
        } else {
            // 🛡️ USUARIO: Solo ve sus posts + posts PÚBLICOS de sus AMIGOS aceptados
            query = `
                SELECT p.*, perf.nombre, perf.apellido, perf.foto_url,
                       p_orig.contenido AS contenido_original,
                       perf_orig.nombre AS nombre_original, perf_orig.apellido AS apellido_original,
                       (SELECT COUNT(*) FROM reacciones WHERE publicacion_id = p.id AND tipo = 'like') AS total_likes,
                       (SELECT COUNT(*) FROM comentarios WHERE publicacion_id = p.id) AS total_comentarios,
                       (SELECT COUNT(*) FROM reacciones WHERE publicacion_id = p.id AND usuario_id = ? AND tipo = 'like') AS reaccionado,
                       'aceptada' AS estado_relacion
                FROM publicaciones p
                JOIN perfiles perf ON p.usuario_id = perf.usuario_id
                LEFT JOIN publicaciones p_orig ON p.original_post_id = p_orig.id
                LEFT JOIN perfiles perf_orig ON p_orig.usuario_id = perf_orig.usuario_id
                WHERE p.usuario_id = ? 
                   OR (p.privacidad = 'publica' AND p.usuario_id IN (
                       SELECT usuario_envia_id FROM amistades WHERE usuario_recibe_id = ? AND estado = 'aceptada'
                       UNION
                       SELECT usuario_recibe_id FROM amistades WHERE usuario_envia_id = ? AND estado = 'aceptada'
                   ))
                ORDER BY p.fecha DESC`;
            params = [usuarioId, usuarioId, usuarioId, usuarioId];
        }

        const [posts] = await db.query(query, params);
        res.json(posts);
    } catch (err) {
        console.error("🚨 Error en muro:", err);
        res.status(500).json({ error: "No se pudo cargar el muro." });
    }
});

// --- [2] OBTENER POSTS EN EL PERFIL (PROTOCOLO DE PRIVACIDAD TOTAL) ---
router.get('/usuario/:perfilId', async (req, res) => {
    const { perfilId } = req.params; 
    const vId = req.query.visitanteId; 

    const visitanteId = parseInt(vId);
    const targetId = parseInt(perfilId);

    try {
        const [u] = await db.query('SELECT rol FROM usuarios WHERE id = ?', [visitanteId]);
        const esAdmin = u.length > 0 && u[0].rol === 'admin';
        const esDuenio = (visitanteId === targetId);

        console.log(`🛡️ SEGURIDAD: Visitante ${visitanteId} -> Perfil ${targetId} | Admin: ${esAdmin}`);

        if (esDuenio || esAdmin) {
            const [posts] = await db.query('SELECT * FROM publicaciones WHERE usuario_id = ? ORDER BY id DESC', [targetId]);
            return res.json(posts);
        }

        const [amistad] = await db.query(`
            SELECT estado FROM amistades 
            WHERE ((usuario_envia_id = ? AND usuario_recibe_id = ?) 
               OR (usuario_envia_id = ? AND usuario_recibe_id = ?))
            AND estado = 'aceptada' LIMIT 1`, 
            [visitanteId, targetId, targetId, visitanteId]
        );

        if (amistad.length === 0) {
            console.log("🚫 ACCESO DENEGADO: No son amigos aceptados.");
            return res.json([]); 
        }

        const [postsAmigos] = await db.query(`
            SELECT * FROM publicaciones 
            WHERE usuario_id = ? AND privacidad = 'publica' 
            ORDER BY id DESC`, [targetId]);

        res.json(postsAmigos);

    } catch (err) {
        console.error("🚨 Error crítico de seguridad:", err);
        res.status(500).json({ error: "Fallo en el protocolo de privacidad." });
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

// --- [5] REACCIONAR (LIKE/TOGGLE) ---
router.post('/reaccionar', async (req, res) => {
    const { publicacion_id, usuario_id, tipo } = req.body;
    try {
        await db.query(`
            INSERT INTO reacciones (publicacion_id, usuario_id, tipo) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE tipo = (CASE WHEN tipo = VALUES(tipo) THEN 'none' ELSE VALUES(tipo) END)`, 
        [publicacion_id, usuario_id, tipo]);
        res.json({ mensaje: "Reacción procesada ✅" });
    } catch (err) { res.status(500).json({ error: "Error en reacción." }); }
});

// --- [6] ELIMINAR PUBLICACIÓN ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.query; 
    try {
        const [u] = await db.query('SELECT rol FROM usuarios WHERE id = ?', [usuario_id]);
        const esAdmin = u.length > 0 && u[0].rol === 'admin';

        let queryBorrado;
        let params;
        if (esAdmin) {
            queryBorrado = 'DELETE FROM publicaciones WHERE id = ?';
            params = [id];
        } else {
            queryBorrado = 'DELETE FROM publicaciones WHERE id = ? AND usuario_id = ?';
            params = [id, usuario_id];
        }
        const [resultado] = await db.query(queryBorrado, params);
        if (resultado.affectedRows > 0) res.json({ mensaje: "Post eliminado 🗑️" });
        else res.status(403).json({ error: "No tienes permiso." });
    } catch (err) { res.status(500).json({ error: "Error al eliminar." }); }
});

// --- [7, 8, 9] BAÚL / TESOROS ---
router.get('/baul/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const query = `
            SELECT p.*, pr.nombre, pr.apellido, pr.foto_url, b.fecha_guardado 
            FROM baul b
            JOIN publicaciones p ON b.publicacion_id = p.id
            LEFT JOIN perfiles pr ON p.usuario_id = pr.usuario_id
            WHERE b.usuario_id = ?
            ORDER BY b.fecha_guardado DESC`;
        const [tesoros] = await db.query(query, [usuarioId]);
        res.json(tesoros); 
    } catch (err) { res.status(500).json({ error: "Error al consultar el baúl" }); }
});

router.post('/baul/guardar', async (req, res) => {
    const { usuario_id, publicacion_id } = req.body;
    try {
        await db.query("INSERT IGNORE INTO baul (usuario_id, publicacion_id) VALUES (?, ?)", [usuario_id, publicacion_id]);
        res.json({ success: true, mensaje: "¡Tesoro guardado! 💾" });
    } catch (err) { res.status(500).json({ error: "No se pudo guardar" }); }
});

router.delete('/baul/:postId', async (req, res) => {
    const { postId } = req.params;
    const { usuario_id } = req.query;
    try {
        await db.query("DELETE FROM baul WHERE publicacion_id = ? AND usuario_id = ?", [postId, usuario_id]);
        res.json({ mensaje: "Tesoro eliminado" });
    } catch (err) { res.status(500).json({ error: "Error al eliminar" }); }
});

// --- [10] OBTENER COMENTARIOS ---
router.get('/comentarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT c.*, p.nombre, p.apellido 
            FROM comentarios c 
            JOIN perfiles p ON c.usuario_id = p.usuario_id 
            WHERE c.publicacion_id = ? 
            ORDER BY c.id ASC`;
        const [rows] = await db.query(query, [id]);
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

// --- [12] ELIMINAR COMENTARIO ---
router.delete('/comentario/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.query; 
    try {
        const [comentario] = await db.query(`
            SELECT c.usuario_id AS comentario_autor_id, p.usuario_id AS post_autor_id 
            FROM comentarios c
            JOIN publicaciones p ON c.publicacion_id = p.id
            WHERE c.id = ?`, [id]);

        if (comentario.length === 0) return res.status(404).json({ error: "No encontrado." });

        const { comentario_autor_id, post_autor_id } = comentario[0];
        const [u] = await db.query('SELECT rol FROM usuarios WHERE id = ?', [usuario_id]);
        const esAdmin = u.length > 0 && u[0].rol === 'admin';

        if (usuario_id == comentario_autor_id || usuario_id == post_autor_id || esAdmin) {
            await db.query('DELETE FROM comentarios WHERE id = ?', [id]);
            res.json({ mensaje: "Comentario eliminado" });
        } else {
            res.status(403).json({ error: "Sin permiso." });
        }
    } catch (err) { res.status(500).json({ error: "Error al eliminar comentario." }); }
});

module.exports = router;