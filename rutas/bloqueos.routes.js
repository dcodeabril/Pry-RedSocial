// rutas/bloqueos.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// Bloquear a un usuario
router.post('/', async (req, res) => {
    const { usuario_id, usuario_bloqueado_id } = req.body;
    try {
        await db.query(
            'INSERT INTO bloqueos (usuario_id, usuario_bloqueado_id) VALUES (?, ?)',
            [usuario_id, usuario_bloqueado_id]
        );
        // Opcional: Eliminar amistad si existía al bloquear
        await db.query(
            'DELETE FROM amistades WHERE (usuario_id = ? AND amigo_id = ?) OR (usuario_id = ? AND amigo_id = ?)',
            [usuario_id, usuario_bloqueado_id, usuario_bloqueado_id, usuario_id]
        );
        res.json({ mensaje: "Usuario bloqueado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al procesar el bloqueo" });
    }
});

module.exports = router;