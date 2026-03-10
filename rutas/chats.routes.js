// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (FLUJO DE MENSAJERÍA P3)
// ARCHIVO: rutas/chats.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. OBTENER CONVERSACIÓN BILATERAL ---
// Esta ruta es la que busca el frontend en mensajes.js
router.get('/conversacion/:id1/:id2', async (req, res) => {
    const { id1, id2 } = req.params;
    try {
        // Consultamos la Tabla 7 (mensajes) filtrando ambos sentidos del chat
        // Buscamos mensajes donde el emisor sea A y receptor B, O VICEVERSA
        const query = `
            SELECT * FROM mensajes 
            WHERE (emisor_id = ? AND receptor_id = ?) 
               OR (emisor_id = ? AND receptor_id = ?)
            ORDER BY fecha ASC`;
            
        const [mensajes] = await db.query(query, [id1, id2, id2, id1]);
        res.json(mensajes);
    } catch (err) {
        console.error("Error en DB:", err);
        res.status(500).json({ error: "Error al cargar la conversación desde MySQL." });
    }
});

// --- 2. ENVIAR NUEVO MENSAJE ---
router.post('/enviar', async (req, res) => {
    const { emisor_id, receptor_id, contenido } = req.body;
    
    if (!contenido) {
        return res.status(400).json({ error: "El mensaje no puede estar vacío." });
    }

    try {
        await db.query(
            'INSERT INTO mensajes (emisor_id, receptor_id, contenido) VALUES (?, ?, ?)',
            [emisor_id, receptor_id, contenido]
        );
        res.json({ mensaje: "Mensaje enviado ✅" });
    } catch (err) {
        console.error("Error en DB:", err);
        res.status(500).json({ error: "No se pudo guardar el mensaje en la base de datos." });
    }
});

module.exports = router;