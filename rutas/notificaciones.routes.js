// rutas/notificaciones.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // [AJUSTE] Verificamos que el JOIN use las tablas correctas de tu esquema
        const query = `
            SELECT n.*, p.nombre, p.apellido 
            FROM notificaciones n
            JOIN perfiles p ON n.emisor_id = p.usuario_id
            WHERE n.usuario_id = ?
            ORDER BY n.fecha DESC`;
            
        const [alertas] = await db.query(query, [id]);
        res.json(alertas);
    } catch (err) {
        // Esto imprimirá el error REAL en tu terminal para que lo veas
        console.error("❌ ERROR EN DB:", err); 
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ... resto de rutas (leer, etc)
module.exports = router;