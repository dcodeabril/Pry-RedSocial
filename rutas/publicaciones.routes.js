// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE CONTENIDOS Y SEGURIDAD P2 + P3 + P4)
// ARCHIVO: rutas/publicaciones.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- [1] OBTENER EL MURO PERSONALIZADO (GET) ---
router.get('/muro/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const query = `
            SELECT p.*, perf.nombre, perf.apellido, perf.foto_url 
            FROM publicaciones p
            JOIN perfiles perf ON p.usuario_id = perf.usuario_id
            WHERE 
                p.usuario_id = ? 
                OR 
                (p.privacidad = 'amigos' AND p.usuario_id IN (
                    SELECT CASE 
                        WHEN usuario_envia_id = ? THEN usuario_recibe_id 
                        ELSE usuario_envia_id 
                    END
                    FROM amistades 
                    WHERE (usuario_envia_id = ? OR usuario_recibe_id = ?) 
                    AND estado = 'aceptada'
                ))
                OR
                (p.privacidad = 'publica' AND p.usuario_id NOT IN (
                    SELECT usuario_bloqueado_id FROM bloqueos WHERE usuario_id = ?
                    UNION
                    SELECT usuario_id FROM bloqueos WHERE usuario_bloqueado_id = ?
                ))
            ORDER BY p.id DESC`;

        const [posts] = await db.query(query, [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId]);
        res.json(posts);
    } catch (err) {
        console.error("🚨 Error al cargar el muro:", err);
        res.status(500).json({ error: "No se pudo cargar el feed personalizado." });
    }
});

// --- [2] OBTENER POSTS DE UN USUARIO (Para el Perfil) ---
router.get('/usuario/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT * FROM publicaciones WHERE usuario_id = ? ORDER BY id DESC`;
        const [posts] = await db.query(query, [id]);
        res.json(posts);
    } catch (err) {
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
        res.status(500).json({ error: "No se pudo guardar la publicación." });
    }
});

// --- [4] REACCIONAR Y NOTIFICAR ---
router.post('/reaccionar', async (req, res) => {
    const { publicacion_id, usuario_id, tipo } = req.body;
    try {
        const [post] = await db.query('SELECT usuario_id FROM publicaciones WHERE id = ?', [publicacion_id]);
        if (post.length === 0) return res.status(404).json({ error: "Post no encontrado." });
        const receptorId = post[0].usuario_id;

        const [bloqueo] = await db.query(
            `SELECT * FROM bloqueos 
             WHERE (usuario_id = ? AND usuario_bloqueado_id = ?) 
                OR (usuario_id = ? AND usuario_bloqueado_id = ?)`,
            [usuario_id, receptorId, receptorId, usuario_id]
        );

        if (bloqueo.length > 0) return res.status(403).json({ error: "Interacción bloqueada por privacidad. 🚫" });

        await db.query(
            `INSERT INTO reacciones (publicacion_id, usuario_id, tipo) 
             VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE tipo = ?`,
            [publicacion_id, usuario_id, tipo, tipo]
        );

        if (receptorId != usuario_id) {
            await db.query(
                `INSERT INTO notificaciones (usuario_id, emisor_id, tipo, referencia_id) 
                 VALUES (?, ?, 'reaccion', ?)`,
                [receptorId, usuario_id, publicacion_id]
            );
        }
        res.json({ mensaje: "Reacción y notificación enviadas ✅" });
    } catch (err) {
        res.status(500).json({ error: "Error al procesar interacción." });
    }
});

// --- [5] OBTENER COMENTARIOS ---
router.get('/:id/comentarios', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT c.*, p.nombre, p.apellido 
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

// --- [6] COMENTAR Y NOTIFICAR ---
router.post('/comentar', async (req, res) => {
    const { publicacion_id, usuario_id, contenido } = req.body;
    try {
        const [post] = await db.query('SELECT usuario_id FROM publicaciones WHERE id = ?', [publicacion_id]);
        if (post.length === 0) return res.status(404).json({ error: "Post no encontrado." });
        const receptorId = post[0].usuario_id;

        const [bloqueo] = await db.query(
            `SELECT * FROM bloqueos 
             WHERE (usuario_id = ? AND usuario_bloqueado_id = ?) 
                OR (usuario_id = ? AND usuario_bloqueado_id = ?)`,
            [usuario_id, receptorId, receptorId, usuario_id]
        );

        if (bloqueo.length > 0) return res.status(403).json({ error: "No puedes comentar debido a un bloqueo. 🚫" });

        await db.query('INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES (?, ?, ?)', [publicacion_id, usuario_id, contenido]);

        if (receptorId != usuario_id) {
            await db.query(
                `INSERT INTO notificaciones (usuario_id, emisor_id, tipo, referencia_id) 
                 VALUES (?, ?, 'comentario', ?)`,
                [receptorId, usuario_id, publicacion_id]
            );
        }
        res.json({ mensaje: "Comentario publicado ✅" });
    } catch (err) { 
        res.status(500).json({ error: "Error al guardar el comentario." }); 
    }
});

// --- [7] ELIMINAR PUBLICACIÓN ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.query; 

    try {
        let queryBorrado;
        let params;

        if (parseInt(usuario_id) === 1) {
            queryBorrado = 'DELETE FROM publicaciones WHERE id = ?';
            params = [id];
        } else {
            queryBorrado = 'DELETE FROM publicaciones WHERE id = ? AND usuario_id = ?';
            params = [id, usuario_id];
        }

        const [resultado] = await db.query(queryBorrado, params);

        if (resultado.affectedRows > 0) {
            res.json({ mensaje: "Publicación eliminada correctamente por moderación 🗑️" });
        } else {
            res.status(403).json({ error: "No tienes permiso para eliminar este post o ya no existe." });
        }
    } catch (err) {
        console.error("🚨 Error al borrar publicación:", err);
        res.status(500).json({ error: "Error interno al intentar eliminar el post." });
    }
});

// --- [8] GUARDAR EN EL BAÚL (#8 - Usando tu tabla guardados_y_notas) ---
router.post('/guardar-tesoro', async (req, res) => {
    const { usuario_id, publicacion_id } = req.body;

    try {
        // 🎯 Insertamos en la tabla que ya existe en tu Dump
        await db.query(
            `INSERT INTO guardados_y_notas (usuario_id, referencia_id, tipo_entrada) 
             VALUES (?, ?, 'guardado')`,
            [usuario_id, publicacion_id]
        );
        res.json({ mensaje: "¡Publicación guardada en tu baúl de tesoros! 💾" });
    } catch (err) {
        // Manejo de duplicados por si ya está guardado
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Ya tienes este tesoro guardado en tu baúl." });
        }
        console.error(err);
        res.status(500).json({ error: "No se pudo guardar el tesoro." });
    }
});

// --- [8.1] OBTENER MI BAÚL DE TESOROS ---
router.get('/baul/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const query = `
            SELECT p.*, perf.nombre, perf.apellido, perf.foto_url 
            FROM publicaciones p
            JOIN guardados_y_notas gn ON p.id = gn.referencia_id
            JOIN perfiles perf ON p.usuario_id = perf.usuario_id
            WHERE gn.usuario_id = ? AND gn.tipo_entrada = 'guardado'
            ORDER BY gn.fecha DESC`;
            
        const [tesoros] = await db.query(query, [usuarioId]);
        res.json(tesoros);
    } catch (err) {
        console.error("🚨 Error al abrir el baúl:", err);
        res.status(500).json({ error: "No pudimos abrir tu baúl de tesoros." });
    }
});

module.exports = router;