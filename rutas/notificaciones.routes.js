// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (CENTRO DE NOTIFICACIONES P4)
// ARCHIVO: rutas/notificaciones.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. OBTENER TODAS LAS NOTIFICACIONES ---
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Unimos la Tabla 9 (notificaciones) con la Tabla 2 (perfiles)
        // para saber quién es el emisor y mostrar su foto y nombre
        const query = `
            SELECT n.*, p.nombre, p.apellido, p.foto_url 
            FROM notificaciones n
            JOIN perfiles p ON n.emisor_id = p.usuario_id
            WHERE n.usuario_id = ?
            ORDER BY n.fecha DESC LIMIT 20`;
            
        const [alertas] = await db.query(query, [id]);
        res.json(alertas);
    } catch (err) {
        // Imprime el error real en la terminal para depuración (Mantenimiento P4)
        console.error("❌ ERROR AL CARGAR NOTIFICACIONES:", err); 
        res.status(500).json({ error: "Error interno al obtener los avisos." });
    }
});

// --- 2. MARCAR NOTIFICACIONES COMO LEÍDAS ---
router.put('/leer-todas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Cambiamos el estado leido de 0 a 1 (TINYINT)
        await db.query(
            'UPDATE notificaciones SET leido = 1 WHERE usuario_id = ?', 
            [id]
        );
        res.json({ mensaje: "Todas las notificaciones marcadas como leídas ✅" });
    } catch (err) {
        console.error("❌ ERROR AL MARCAR COMO LEÍDAS:", err);
        res.status(500).json({ error: "No se pudo actualizar el estado de lectura." });
    }
});

// --- 3. [EXTRA] ELIMINAR UNA NOTIFICACIÓN ESPECÍFICA ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM notificaciones WHERE id = ?', [id]);
        res.json({ mensaje: "Notificación eliminada." });
    } catch (err) {
        res.status(500).json({ error: "Error al borrar." });
    }
});

module.exports = router;