// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (VÍNCULOS SOCIALES P3)
// ARCHIVO: rutas/amistades.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. ENVIAR SOLICITUD DE AMISTAD ---
router.post('/solicitar', async (req, res) => {
    const { usuario_envia_id, usuario_recibe_id } = req.body;
    try {
        await db.query(
            'INSERT INTO amistades (usuario_envia_id, usuario_recibe_id, estado) VALUES (?, ?, "pendiente")',
            [usuario_envia_id, usuario_recibe_id]
        );
        res.json({ mensaje: "Solicitud enviada ✅" });
    } catch (err) {
        res.status(500).json({ error: "Ya existe una solicitud o vínculo entre estos usuarios." });
    }
});

// --- 2. ACEPTAR SOLICITUD ---
router.patch('/aceptar', async (req, res) => {
    const { usuario_envia_id, usuario_recibe_id } = req.body;
    try {
        await db.query(
            `UPDATE amistades 
             SET estado = "aceptada" 
             WHERE (usuario_envia_id = ? AND usuario_recibe_id = ?) 
                OR (usuario_envia_id = ? AND usuario_recibe_id = ?)`,
            [usuario_envia_id, usuario_recibe_id, usuario_recibe_id, usuario_envia_id]
        );
        res.json({ mensaje: "¡Ahora son amigos! 🤝" });
    } catch (err) {
        res.status(500).json({ error: "Error al aceptar la solicitud." });
    }
});

// --- 3. [NUEVO] LISTAR AMIGOS ACEPTADOS (Para el Chat) ---
// Esta es la ruta que corregirá el error 404 en mensajes.js
router.get('/lista/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Query maestra: Busca quién es el amigo (sea que envió o recibió) y trae su perfil
        const query = `
            SELECT 
                CASE 
                    WHEN a.usuario_envia_id = ? THEN a.usuario_recibe_id 
                    ELSE a.usuario_envia_id 
                END AS usuario_id,
                p.nombre, p.apellido, p.foto_url
            FROM amistades a
            JOIN perfiles p ON p.usuario_id = (
                CASE 
                    WHEN a.usuario_envia_id = ? THEN a.usuario_recibe_id 
                    ELSE a.usuario_envia_id 
                END
            )
            WHERE (a.usuario_envia_id = ? OR a.usuario_recibe_id = ?) 
            AND a.estado = 'aceptada'`;

        const [amigos] = await db.query(query, [id, id, id, id]);
        res.json(amigos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener la lista de contactos." });
    }
});

module.exports = router;