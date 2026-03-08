const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// Enviar una denuncia de contenido
router.post('/', async (req, res) => {
    const { denunciante_id, publicacion_id, motivo } = req.body;
    try {
        await db.query(
            'INSERT INTO reportes (denunciante_id, publicacion_id, motivo, estado) VALUES (?, ?, ?, "pendiente")',
            [denunciante_id, publicacion_id, motivo]
        );
        res.json({ mensaje: "Reporte enviado a moderación" });
    } catch (err) {
        res.status(500).json({ error: "No se pudo procesar el reporte" });
    }
});

module.exports = router;