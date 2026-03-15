// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (MOTOR DE NOTAS EFÍMERAS #15)
// ARCHIVO: rutas/notas.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos'); 

// --- ✅ 1. PUBLICAR O ACTUALIZAR NOTA (POST) ---
// Mantenemos solo una nota activa por usuario para el pasillo superior
router.post('/crear', async (req, res) => {
    const { usuario_id, texto } = req.body; // 'texto' mapea a 'contenido' en la DB

    if (!usuario_id || !texto) {
        return res.status(400).json({ error: "Faltan datos (ID o contenido) para la nota." });
    }

    try {
        // 🛡️ PASO A: Limpiar nota anterior (Política: 1 nota por usuario)
        await db.query(
            "DELETE FROM guardados_y_notas WHERE usuario_id = ? AND tipo_entrada = 'nota'", 
            [usuario_id]
        );
        
        // 📝 PASO B: Insertar la nueva nota efímera
        const query = `
            INSERT INTO guardados_y_notas (usuario_id, contenido, tipo_entrada, fecha) 
            VALUES (?, ?, 'nota', NOW())
        `;
        await db.query(query, [usuario_id, texto]);
        
        res.json({ mensaje: "¡Nota actualizada con éxito! ✨" });
    } catch (err) {
        console.error("❌ Error al procesar nota:", err);
        res.status(500).json({ error: "Error interno al guardar en la base de datos." });
    }
});

// --- ✅ 2. OBTENER NOTAS DEL PASILLO (GET) ---
// Trae notas propias y de amigos con estado 'aceptada'
router.get('/activas/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;

    try {
        const query = `
            SELECT gn.id, gn.contenido, gn.fecha, p.nombre, p.apellido, p.foto_url, p.usuario_id
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
            LIMIT 15;
        `;

        const [results] = await db.query(query, [usuario_id, usuario_id, usuario_id, usuario_id]);
        res.json(results);
    } catch (err) {
        console.error("❌ Error al obtener notas activas:", err);
        res.status(500).json({ error: "No se pudieron cargar las notas del pasillo." });
    }
});

module.exports = router;