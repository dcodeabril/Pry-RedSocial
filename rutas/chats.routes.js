// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (COMUNICACIÓN SEGURA P3 + P4)
// ARCHIVO: rutas/chats.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. OBTENER CONVERSACIÓN BILATERAL ---
router.get('/conversacion/:id1/:id2', async (req, res) => {
    const { id1, id2 } = req.params;
    try {
        const query = `
            SELECT * FROM mensajes 
            WHERE (emisor_id = ? AND receptor_id = ?) 
               OR (emisor_id = ? AND receptor_id = ?)
            ORDER BY fecha ASC`;
            
        const [mensajes] = await db.query(query, [id1, id2, id2, id1]);
        res.json(mensajes);
    } catch (err) {
        console.error("🚨 Error al cargar chat:", err);
        res.status(500).json({ error: "Error al cargar la conversación." });
    }
});

// --- 2. ENVIAR NUEVO MENSAJE (Con Escudo Anti-Bloqueos) ---
router.post('/enviar', async (req, res) => {
    const { emisor_id, receptor_id, contenido } = req.body;
    
    if (!contenido) {
        return res.status(400).json({ error: "El mensaje no puede estar vacío." });
    }

    try {
        // 🛡️ PASO DE SEGURIDAD: Verificar si existe un bloqueo entre ambos (Sentido A o B)
        const queryBloqueo = `
            SELECT * FROM bloqueos 
            WHERE (usuario_id = ? AND usuario_bloqueado_id = ?) 
               OR (usuario_id = ? AND usuario_bloqueado_id = ?)`;
        
        const [bloqueo] = await db.query(queryBloqueo, [emisor_id, receptor_id, receptor_id, emisor_id]);

        if (bloqueo.length > 0) {
            // Devolvemos 403 (Forbidden) para que el frontend sepa que es un bloqueo
            return res.status(403).json({ 
                error: "No puedes enviar mensajes debido a un bloqueo activo. 🚫" 
            });
        }

        // Si el camino está despejado, insertamos el mensaje
        await db.query(
            'INSERT INTO mensajes (emisor_id, receptor_id, contenido) VALUES (?, ?, ?)',
            [emisor_id, receptor_id, contenido]
        );

        res.status(201).json({ mensaje: "Mensaje enviado con éxito ✅" });

    } catch (err) {
        console.error("🚨 Error técnico en Chat:", err);
        res.status(500).json({ error: "No se pudo procesar el mensaje." });
    }
});

module.exports = router;