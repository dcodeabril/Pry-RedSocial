// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE EVENTOS P4 + NOTIFICACIONES P5)
// ARCHIVO: rutas/eventos.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. OBTENER EVENTOS FUTUROS (Cartelera Dinámica) ---
// Muestra solo los eventos que aún no han pasado
router.get('/todos', async (req, res) => {
    try {
        const query = `
            SELECT e.*, p.nombre, p.apellido 
            FROM eventos e
            JOIN perfiles p ON e.creador_id = p.usuario_id
            WHERE e.fecha_evento >= CURDATE()
            ORDER BY e.fecha_evento ASC
        `;
        const [eventos] = await db.query(query);
        res.json(eventos);
    } catch (err) {
        console.error("🚨 Error al listar eventos:", err);
        res.status(500).json({ error: "No se pudieron cargar los eventos del servidor." });
    }
});

// --- 2. 🚀 CREAR NUEVO EVENTO + NOTIFICAR AMIGOS ---
router.post('/crear', async (req, res) => {
    const { creador_id, titulo, descripcion, ubicacion, fecha_evento } = req.body;
    
    if (!creador_id || !titulo || !fecha_evento) {
        return res.status(400).json({ error: "Faltan datos obligatorios para el evento." });
    }

    try {
        // 1️⃣ Insertamos el evento en la tabla 'eventos'
        const queryEvento = `
            INSERT INTO eventos (creador_id, titulo, descripcion, ubicacion, fecha_evento) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(queryEvento, [creador_id, titulo, descripcion, ubicacion, fecha_evento]);
        const eventoId = result.insertId;

        // 2️⃣ Buscamos a todos los amigos con estado 'aceptada' para avisarles
        const queryAmigos = `
            SELECT 
                CASE 
                    WHEN usuario_envia_id = ? THEN usuario_recibe_id 
                    ELSE usuario_envia_id 
                END AS amigo_id
            FROM amistades 
            WHERE (usuario_envia_id = ? OR usuario_recibe_id = ?) 
            AND estado = 'aceptada'
        `;
        const [amigos] = await db.query(queryAmigos, [creador_id, creador_id, creador_id]);

        // 3️⃣ Si hay amigos, generamos las notificaciones en masa
        if (amigos.length > 0) {
            const promesasNotis = amigos.map(amigo => {
                return db.query(
                    `INSERT INTO notificaciones (usuario_id, emisor_id, tipo, referencia_id) VALUES (?, ?, 'nuevo_evento', ?)`,
                    [amigo.amigo_id, creador_id, eventoId]
                );
            });
            await Promise.all(promesasNotis);
            console.log(`📢 Agenda: Notificaciones enviadas a ${amigos.length} amigos.`);
        }
        
        res.status(201).json({ 
            mensaje: "✅ Evento organizado y amigos notificados 📅", 
            id: eventoId 
        });

    } catch (err) {
        console.error("🚨 Error crítico en eventos:", err);
        res.status(500).json({ error: "Error interno al procesar el evento." });
    }
});

// --- 3. ELIMINAR UN EVENTO (Seguridad: Solo el creador puede) ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.query; // Se pasa el ID de quien intenta borrar

    try {
        const [resultado] = await db.query(
            'DELETE FROM eventos WHERE id = ? AND creador_id = ?', 
            [id, usuario_id]
        );

        if (resultado.affectedRows > 0) {
            res.json({ mensaje: "Evento cancelado y eliminado correctamente 🗑️" });
        } else {
            res.status(403).json({ error: "No tienes permiso para borrar este evento o ya no existe." });
        }
    } catch (err) {
        console.error("🚨 Error al borrar evento:", err);
        res.status(500).json({ error: "Error interno al intentar eliminar." });
    }
});

module.exports = router;