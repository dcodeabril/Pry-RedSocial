// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (VÍNCULOS SOCIALES P3 + P4)
// ARCHIVO: rutas/amistades.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. CONSULTAR ESTADO DE AMISTAD (GET) ---
router.get('/estado/:id1/:id2', async (req, res) => {
    const { id1, id2 } = req.params;
    try {
        const query = `
            SELECT * FROM amistades 
            WHERE (usuario_envia_id = ? AND usuario_recibe_id = ?) 
               OR (usuario_envia_id = ? AND usuario_recibe_id = ?)`;
        
        const [rows] = await db.query(query, [id1, id2, id2, id1]);

        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json({ vacio: true });
        }
    } catch (err) {
        console.error("🚨 Error al consultar estado:", err);
        res.status(500).json({ error: "Error en la consulta de vínculos." });
    }
});

// --- 2. ENVIAR SOLICITUD DE AMISTAD (POST) ---
router.post('/solicitar', async (req, res) => {
    const { usuario_envia_id, usuario_recibe_id } = req.body;

    try {
        const [bloqueo] = await db.query(
            `SELECT * FROM bloqueos 
             WHERE (usuario_id = ? AND usuario_bloqueado_id = ?) 
                OR (usuario_id = ? AND usuario_bloqueado_id = ?)`,
            [usuario_envia_id, usuario_recibe_id, usuario_recibe_id, usuario_envia_id]
        );

        if (bloqueo.length > 0) {
            return res.status(403).json({ error: "No puedes interactuar debido a un bloqueo. 🚫" });
        }

        const [existente] = await db.query(
            `SELECT * FROM amistades 
             WHERE (usuario_envia_id = ? AND usuario_recibe_id = ?) 
                OR (usuario_envia_id = ? AND usuario_recibe_id = ?)`,
            [usuario_envia_id, usuario_recibe_id, usuario_recibe_id, usuario_envia_id]
        );

        if (existente.length > 0) {
            return res.status(400).json({ error: "Ya existe una solicitud o amistad activa." });
        }

        const [resultado] = await db.query(
            'INSERT INTO amistades (usuario_envia_id, usuario_recibe_id, estado) VALUES (?, ?, "pendiente")',
            [usuario_envia_id, usuario_recibe_id]
        );

        const idDeLaAmistad = resultado.insertId;

        await db.query(
            `INSERT INTO notificaciones (usuario_id, emisor_id, tipo, referencia_id) 
             VALUES (?, ?, 'amistad', ?)`,
            [usuario_recibe_id, usuario_envia_id, idDeLaAmistad]
        );

        res.json({ mensaje: "Solicitud enviada y notificada con éxito ⏳" });

    } catch (err) {
        console.error("🚨 Error al solicitar amistad:", err);
        res.status(500).json({ error: "Fallo técnico al procesar la solicitud." });
    }
});

// --- 3. LISTAR SOLICITUDES PENDIENTES ---
router.get('/pendientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT a.id as solicitud_id, p.nombre, p.apellido, p.foto_url, p.usuario_id as emisor_id
            FROM amistades a
            JOIN perfiles p ON a.usuario_envia_id = p.usuario_id
            WHERE a.usuario_recibe_id = ? AND a.estado = 'pendiente'`;
        
        const [solicitudes] = await db.query(query, [id]);
        res.json(solicitudes);
    } catch (err) {
        res.status(500).json({ error: "Error al cargar solicitudes pendientes." });
    }
});

// --- 4. RESPONDER A SOLICITUD (PATCH) [ACTUALIZADO] ---
router.patch('/responder', async (req, res) => {
    const { solicitud_id, nuevo_estado } = req.body; 

    try {
        if (nuevo_estado === 'aceptada') {
            // 1. Obtenemos datos para la notificación de retorno
            const [solicitud] = await db.query(
                'SELECT usuario_envia_id, usuario_recibe_id FROM amistades WHERE id = ?', 
                [solicitud_id]
            );

            if (solicitud.length === 0) return res.status(404).json({ error: "Solicitud no encontrada." });

            const emisorOriginal = solicitud[0].usuario_envia_id; 
            const receptorOriginal = solicitud[0].usuario_recibe_id; 

            // 2. Actualizamos el estado
            await db.query('UPDATE amistades SET estado = "aceptada" WHERE id = ?', [solicitud_id]);

            // 3. 🎯 Notificamos de vuelta al emisor original
            await db.query(
                `INSERT INTO notificaciones (usuario_id, emisor_id, tipo, referencia_id) 
                 VALUES (?, ?, 'confirmacion_amistad', ?)`,
                [emisorOriginal, receptorOriginal, solicitud_id]
            );

            res.json({ mensaje: "¡Ahora son amigos y hemos avisado al emisor! 🤝" });

        } else {
            await db.query('DELETE FROM amistades WHERE id = ?', [solicitud_id]);
            res.json({ mensaje: "Solicitud eliminada." });
        }
    } catch (err) {
        console.error("Error al responder:", err);
        res.status(500).json({ error: "No se pudo actualizar el vínculo." });
    }
});

// --- 5. LISTAR AMIGOS ACEPTADOS ---
router.get('/lista/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                CASE 
                    WHEN a.usuario_envia_id = ? THEN a.usuario_recibe_id 
                    ELSE a.usuario_envia_id 
                END AS usuario_id,
                p.nombre, p.apellido, p.foto_url
            FROM amistades a
            JOIN perfiles p ON p.usuario_id = (
                CASE 
                    WHEN a.usuario_envia_id = ? THEN a.usuario_recibe_id 
                    ELSE a.usuario_envia_id 
                END
            )
            WHERE (a.usuario_envia_id = ? OR a.usuario_recibe_id = ?) 
            AND a.estado = 'aceptada'`;

        const [amigos] = await db.query(query, [id, id, id, id]);
        res.json(amigos);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener la lista de contactos." });
    }
});

module.exports = router;