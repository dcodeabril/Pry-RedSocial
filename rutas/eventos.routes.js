const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// Crear un evento
router.post('/crear', async (req, res) => {
    const { creador_id, titulo, descripcion, fecha_evento } = req.body;
    try {
        await db.query(
            'INSERT INTO eventos (creador_id, titulo, descripcion, fecha_evento) VALUES (?, ?, ?, ?)',
            [creador_id, titulo, descripcion, fecha_evento]
        );
        res.status(201).json({ mensaje: "Evento organizado con éxito" });
    } catch (err) {
        res.status(500).json({ error: "Error al crear el evento" });
    }
});

// Listar eventos futuros
router.get('/', async (req, res) => {
    try {
        const [eventos] = await db.query('SELECT * FROM eventos WHERE fecha_evento >= CURDATE() ORDER BY fecha_evento ASC');
        res.json(eventos);
    } catch (err) {
        res.status(500).json({ error: "Error al listar eventos" });
    }
});

module.exports = router;