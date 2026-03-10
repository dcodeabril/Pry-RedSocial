// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE CONTENIDOS Y SEGURIDAD P2 + P4)
// ARCHIVO: rutas/publicaciones.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- [1] OBTENER EL MURO FILTRADO (PRIVACIDAD + BLOQUEOS) ---
router.get('/:visorId', async (req, res) => {
    const { visorId } = req.params; 
    try {
        const query = `
            SELECT p.*, perf.nombre, perf.apellido 
            FROM publicaciones p
            JOIN perfiles perf ON p.usuario_id = perf.usuario_id
            WHERE (
                p.usuario_id = ? 
                OR p.privacidad = 'publica' 
                OR (p.privacidad = 'amigos' AND p.usuario_id IN ( 
                    SELECT CASE 
                        WHEN usuario_envia_id = ? THEN usuario_recibe_id 
                        ELSE usuario_envia_id 
                    END
                    FROM amistades 
                    WHERE (usuario_envia_id = ? OR usuario_recibe_id = ?) 
                    AND estado = 'aceptada'
                ))
            )
            -- 🛡️ FILTRO DE BLOQUEOS (Persona 4)
            AND p.usuario_id NOT IN (
                SELECT usuario_bloqueado_id FROM bloqueos WHERE usuario_id = ?
            )
            AND p.usuario_id NOT IN (
                SELECT usuario_id FROM bloqueos WHERE usuario_bloqueado_id = ?
            )
            ORDER BY p.id DESC`;

        const [posts] = await db.query(query, [visorId, visorId, visorId, visorId, visorId, visorId]);
        res.json(posts);
    } catch (err) {
        console.error("🚨 Error SQL en Muro Filtrado:", err);
        res.status(500).json({ error: "Error al cargar el muro personalizado." });
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

// --- [4] REACCIONAR Y NOTIFICAR (CON ESCUDO P4) ---
router.post('/reaccionar', async (req, res) => {
    const { publicacion_id, usuario_id, tipo } = req.body;
    try {
        // A. Buscamos quién es el dueño del post
        const [post] = await db.query('SELECT usuario_id FROM publicaciones WHERE id = ?', [publicacion_id]);
        if (post.length === 0) return res.status(404).json({ error: "Post no encontrado." });
        
        const receptorId = post[0].usuario_id;

        // 🛡️ ESCUDO DE BLOQUEO: Verificar si hay un bloqueo entre ambos
        const [bloqueo] = await db.query(
            `SELECT * FROM bloqueos 
             WHERE (usuario_id = ? AND usuario_bloqueado_id = ?) 
                OR (usuario_id = ? AND usuario_bloqueado_id = ?)`,
            [usuario_id, receptorId, receptorId, usuario_id]
        );

        if (bloqueo.length > 0) {
            return res.status(403).json({ error: "Interacción bloqueada por privacidad. 🚫" });
        }

        // B. Si no hay bloqueo, guardamos la reacción
        await db.query(
            `INSERT INTO reacciones (publicacion_id, usuario_id, tipo) 
             VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE tipo = ?`,
            [publicacion_id, usuario_id, tipo, tipo]
        );

        // C. Enviamos notificación solo si no es nuestro propio post
        if (receptorId != usuario_id) {
            await db.query(
                `INSERT INTO notificaciones (usuario_id, emisor_id, tipo, referencia_id) 
                 VALUES (?, ?, 'reaccion', ?)`,
                [receptorId, usuario_id, publicacion_id]
            );
        }
        res.json({ mensaje: "Reacción y notificación enviadas ✅" });
    } catch (err) {
        console.error("Error en reacción:", err);
        res.status(500).json({ error: "Error al procesar interacción." });
    }
});

// --- [5] OBTENER COMENTARIOS DE UN POST ---
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

// --- [6] COMENTAR Y NOTIFICAR (CON ESCUDO P4) ---
router.post('/comentar', async (req, res) => {
    const { publicacion_id, usuario_id, contenido } = req.body;
    try {
        // A. Buscamos quién es el dueño del post
        const [post] = await db.query('SELECT usuario_id FROM publicaciones WHERE id = ?', [publicacion_id]);
        if (post.length === 0) return res.status(404).json({ error: "Post no encontrado." });
        
        const receptorId = post[0].usuario_id;

        // 🛡️ ESCUDO DE BLOQUEO: Verificar si hay un bloqueo entre ambos
        const [bloqueo] = await db.query(
            `SELECT * FROM bloqueos 
             WHERE (usuario_id = ? AND usuario_bloqueado_id = ?) 
                OR (usuario_id = ? AND usuario_bloqueado_id = ?)`,
            [usuario_id, receptorId, receptorId, usuario_id]
        );

        if (bloqueo.length > 0) {
            return res.status(403).json({ error: "No puedes comentar en este post debido a un bloqueo. 🚫" });
        }

        // B. Guardamos el comentario si el camino está libre
        await db.query(
            'INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES (?, ?, ?)', 
            [publicacion_id, usuario_id, contenido]
        );

        // C. Notificamos al dueño del post
        if (receptorId != usuario_id) {
            await db.query(
                `INSERT INTO notificaciones (usuario_id, emisor_id, tipo, referencia_id) 
                 VALUES (?, ?, 'comentario', ?)`,
                [receptorId, usuario_id, publicacion_id]
            );
        }
        res.json({ mensaje: "Comentario publicado y notificación enviada ✅" });
    } catch (err) { 
        console.error("Error en comentario:", err);
        res.status(500).json({ error: "Error al guardar el comentario." }); 
    }
});

// --- [7] ELIMINAR PUBLICACIÓN ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.query;

    try {
        const [resultado] = await db.query(
            'DELETE FROM publicaciones WHERE id = ? AND usuario_id = ?', 
            [id, usuario_id]
        );

        if (resultado.affectedRows > 0) {
            res.json({ mensaje: "Publicación eliminada correctamente 🗑️" });
        } else {
            res.status(403).json({ error: "No tienes permiso para eliminar esta publicación." });
        }
    } catch (err) {
        console.error("🚨 Error al borrar publicación:", err);
        res.status(500).json({ error: "Error interno al intentar eliminar el post." });
    }
});

module.exports = router;