// rutas/amistades.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// 1. ENVIAR SOLICITUD DE AMISTAD
router.post('/solicitar', async (req, res) => {
    const { usuario_id, amigo_id } = req.body;
    try {
        await db.query(
            'INSERT INTO amistades (usuario_id, amigo_id, estado) VALUES (?, ?, "pendiente")',
            [usuario_id, amigo_id]
        );
        res.json({ mensaje: "Solicitud enviada" });
    } catch (err) {
        res.status(500).json({ error: "Ya existe una solicitud o vínculo" });
    }
});

// 2. ACEPTAR SOLICITUD
router.patch('/aceptar', async (req, res) => {
    const { usuario_id, amigo_id } = req.body;
    try {
        await db.query(
            'UPDATE amistades SET estado = "aceptada" WHERE (usuario_id = ? AND amigo_id = ?) OR (usuario_id = ? AND amigo_id = ?)',
            [usuario_id, amigo_id, amigo_id, usuario_id]
        );
        res.json({ mensaje: "Ahora son amigos" });
    } catch (err) {
        res.status(500).json({ error: "Error al aceptar solicitud" });
    }
});

// 3. LISTAR AMIGOS
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT p.nombre, p.apellido, p.usuario_id 
            FROM amistades a
            JOIN perfiles p ON (a.amigo_id = p.usuario_id OR a.usuario_id = p.usuario_id)
            WHERE (a.usuario_id = ? OR a.amigo_id = ?) AND a.estado = "aceptada" AND p.usuario_id != ?`;
        const [amigos] = await db.query(query, [id, id, id]);
        res.json(amigos);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener amigos" });
    }
});

module.exports = router;