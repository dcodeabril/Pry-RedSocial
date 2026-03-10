// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (SISTEMA DE MODERACIÓN P4)
// ARCHIVO: rutas/reportes.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. ENVIAR UNA DENUNCIA (POST) ---
// Se activa desde el muro cuando Lucero reporta un post ajeno
router.post('/crear', async (req, res) => {
    const { denunciante_id, publicacion_id, motivo } = req.body;

    if (!denunciante_id || !publicacion_id || !motivo) {
        return res.status(400).json({ error: "Datos insuficientes para procesar el reporte." });
    }

    try {
        const query = `
            INSERT INTO reportes (denunciante_id, publicacion_id, motivo, estado) 
            VALUES (?, ?, ?, 'pendiente')`;
        
        await db.query(query, [denunciante_id, publicacion_id, motivo]);
        
        res.status(201).json({ mensaje: "Reporte enviado a moderación con éxito ✅" });
    } catch (err) {
        console.error("🚨 Error al insertar reporte:", err);
        res.status(500).json({ error: "No se pudo procesar el reporte en la base de datos." });
    }
});

// --- 2. [ADMIN] LISTAR REPORTES PENDIENTES (GET) ---
// Alimenta el nuevo Panel de Administración
router.get('/lista', async (req, res) => {
    try {
        const query = `
            SELECT r.*, p.contenido as post_contenido, perf.nombre as denunciante_nombre 
            FROM reportes r
            JOIN publicaciones p ON r.publicacion_id = p.id
            JOIN perfiles perf ON r.denunciante_id = perf.usuario_id
            WHERE r.estado = 'pendiente'
            ORDER BY r.fecha_reporte DESC`; // Ordenamos por la fecha que acabamos de crear
            
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error("🚨 Error al cargar lista de reportes:", err);
        res.status(500).json({ error: "Error al cargar la lista de moderación." });
    }
});

// --- 3. [ADMIN] MARCAR REPORTE COMO REVISADO (PUT) ---
// Se activa desde el Panel Admin al "Archivar" o "Ignorar" un reporte
router.put('/revisar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE reportes SET estado = "revisado" WHERE id = ?', [id]);
        res.json({ mensaje: "Reporte archivado correctamente ✅" });
    } catch (err) {
        console.error("🚨 Error al archivar reporte:", err);
        res.status(500).json({ error: "No se pudo actualizar el reporte." });
    }
});

module.exports = router;