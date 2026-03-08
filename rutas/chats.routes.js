// rutas/chats.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// 1. OBTENER CONVERSACIÓN ENTRE DOS PERSONAS
router.get('/:remitente/:receptor', async (req, res) => {
    const { remitente, receptor } = req.params;
    try {
        const query = `
            SELECT * FROM mensajes 
            WHERE (emisor_id = ? AND receptor_id = ?) 
               OR (emisor_id = ? AND receptor_id = ?)
            ORDER BY fecha ASC`;
        const [mensajes] = await db.query(query, [remitente, receptor, receptor, remitente]);
        res.json(mensajes);
    } catch (err) {
        res.status(500).json({ error: "Error al cargar mensajes" });
    }
});

// 2. ENVIAR MENSAJE
router.post('/enviar', async (req, res) => {
    const { emisor_id, receptor_id, contenido } = req.body;
    try {
        await db.query(
            'INSERT INTO mensajes (emisor_id, receptor_id, contenido) VALUES (?, ?, ?)',
            [emisor_id, receptor_id, contenido]
        );
        res.json({ mensaje: "Mensaje enviado" });
    } catch (err) {
        res.status(500).json({ error: "Error al enviar mensaje" });
    }
});

module.exports = router;