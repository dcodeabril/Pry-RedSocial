// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: MOTOR DE NOTAS EFÍMERAS (#15) - VERSIÓN ASYNC
// ARCHIVO: rutas/notas.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos'); 

// --- 1. CREAR UNA NUEVA NOTA (POST) ---
router.post('/crear', async (req, res) => {
    const { usuario_id, contenido } = req.body;

    if (!usuario_id || !contenido) {
        return res.status(400).json({ error: "Faltan datos para crear la nota." });
    }

    try {
        const query = `
            INSERT INTO guardados_y_notas (usuario_id, contenido, tipo_entrada, fecha) 
            VALUES (?, ?, 'nota', NOW())
        `;
        // Usamos await porque tu configuración de DB devuelve promesas
        await db.query(query, [usuario_id, contenido]);
        
        res.json({ mensaje: "Nota compartida con éxito." });
    } catch (err) {
        console.error("❌ Error al insertar nota:", err);
        res.status(500).json({ error: "Error interno en la base de datos." });
    }
});

// --- 2. OBTENER NOTAS DEL MURO (GET) ---
router.get('/muro/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;

    try {
        // Consulta Maestra: Unimos la tabla de notas con la de perfiles
        const query = `
            SELECT gn.*, p.nombre, p.apellido, p.foto_url 
            FROM guardados_y_notas gn
            JOIN perfiles p ON gn.usuario_id = p.usuario_id
            WHERE gn.tipo_entrada = 'nota'
            AND (
                gn.usuario_id = ? 
                OR gn.usuario_id IN (
                    SELECT CASE 
                        WHEN usuario_envia_id = ? THEN usuario_recibe_id 
                        ELSE usuario_envia_id 
                    END
                    FROM amistades 
                    WHERE (usuario_envia_id = ? OR usuario_recibe_id = ?) 
                    AND estado = 'aceptada'
                )
            )
            ORDER BY gn.fecha DESC
            LIMIT 10;
        `;

        // Extraemos los resultados usando desestructuración de arreglos [results]
        const [results] = await db.query(query, [usuario_id, usuario_id, usuario_id, usuario_id]);
        res.json(results);
    } catch (err) {
        console.error("❌ Error al obtener notas del muro:", err);
        res.status(500).json({ error: "No se pudieron cargar las notas." });
    }
});

module.exports = router;