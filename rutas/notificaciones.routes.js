// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (CENTRO DE NOTIFICACIONES P4)
// ARCHIVO: rutas/notificaciones.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- ✅ 1. CONTEO DE NO LEÍDAS ---
// Importante: Esta ruta va antes de /:id para que Express no se confunda.
router.get('/conteo/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const query = `
            SELECT COUNT(*) as total 
            FROM notificaciones 
            WHERE usuario_id = ? AND leido = 0
            AND emisor_id NOT IN (
                SELECT usuario_bloqueado_id FROM bloqueos WHERE usuario_id = ?
            )
            AND emisor_id NOT IN (
                SELECT usuario_id FROM bloqueos WHERE usuario_bloqueado_id = ?
            )`;
            
        const [results] = await db.query(query, [usuario_id, usuario_id, usuario_id]);
        res.json(results[0] || { total: 0 }); 
    } catch (err) {
        console.error("❌ Error en el conteo:", err);
        res.status(500).json({ error: "Error en el conteo de notificaciones." });
    }
});

// --- ✅ 2. LISTADO HISTÓRICO ---
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT n.*, p.nombre, p.apellido, p.foto_url 
            FROM notificaciones n
            JOIN perfiles p ON n.emisor_id = p.usuario_id
            WHERE n.usuario_id = ?
            AND n.emisor_id NOT IN (
                SELECT usuario_bloqueado_id FROM bloqueos WHERE usuario_id = ?
            )
            AND n.emisor_id NOT IN (
                SELECT usuario_id FROM bloqueos WHERE usuario_bloqueado_id = ?
            )
            ORDER BY n.fecha DESC LIMIT 30`;
            
        const [alertas] = await db.query(query, [id, id, id]);
        res.json(alertas);
    } catch (err) {
        console.error("❌ ERROR AL CARGAR NOTIFICACIONES:", err); 
        res.status(500).json({ error: "Error interno al obtener los avisos." });
    }
});

// --- ✅ 3. MARCAR UNA COMO LEÍDA ---
// Sincronizado con irAContenido() en notificaciones.js
router.put('/leer/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE notificaciones SET leido = 1 WHERE id = ?', [id]);
        res.json({ mensaje: "Notificación marcada como leída ✅" });
    } catch (err) {
        console.error("❌ Error al marcar como leída:", err);
        res.status(500).json({ error: "No se pudo actualizar la notificación." });
    }
});

// --- ✅ 4. MARCAR TODAS COMO LEÍDAS ---
router.put('/leer-todas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE notificaciones SET leido = 1 WHERE usuario_id = ?', [id]);
        res.json({ mensaje: "Todas marcadas como leídas ✅" });
    } catch (err) {
        console.error("❌ Error al marcar todas:", err);
        res.status(500).json({ error: "No se pudo actualizar el historial." });
    }
});

// --- ✅ 5. ELIMINAR NOTIFICACIÓN ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM notificaciones WHERE id = ?', [id]);
        res.json({ mensaje: "Notificación eliminada 🗑️" });
    } catch (err) {
        console.error("❌ Error al borrar notificación:", err);
        res.status(500).json({ error: "Error al intentar borrar el aviso." });
    }
});

module.exports = router;