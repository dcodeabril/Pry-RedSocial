// rutas/admin.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// Listar todos los usuarios para el panel de administración
router.get('/usuarios', async (req, res) => {
    try {
        const [usuarios] = await db.query(
            'SELECT id, email, rol, estado, fecha_registro FROM usuarios'
        );
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener la lista de usuarios" });
    }
});

// Cambiar estado del usuario (Activar/Suspender)
router.patch('/usuarios/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { nuevo_estado } = req.body; // 'activo' o 'suspendido'

    try {
        await db.query('UPDATE usuarios SET estado = ? WHERE id = ?', [nuevo_estado, id]);
        res.json({ mensaje: `Usuario ${id} marcado como ${nuevo_estado}` });
    } catch (err) {
        res.status(500).json({ error: "No se pudo cambiar el estado del usuario" });
    }
});

module.exports = router;