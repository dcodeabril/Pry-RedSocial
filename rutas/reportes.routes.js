// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (MODERACIÓN Y JUSTICIA P4)
// ARCHIVO: rutas/reportes.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. ENVIAR UNA DENUNCIA (POST) ---
router.post('/crear', async (req, res) => {
    const { denunciante_id, publicacion_id, motivo } = req.body;

    if (!denunciante_id || !publicacion_id || !motivo) {
        return res.status(400).json({ error: "Datos insuficientes para procesar el reporte." });
    }

    try {
        await db.query(
            'INSERT INTO reportes (denunciante_id, publicacion_id, motivo, estado) VALUES (?, ?, ?, "pendiente")',
            [denunciante_id, publicacion_id, motivo]
        );
        res.status(201).json({ mensaje: "Denuncia recibida. El Arquitecto la revisará. 🚩" });
    } catch (err) {
        console.error("🚨 Error al insertar reporte:", err);
        res.status(500).json({ error: "Error al registrar la denuncia." });
    }
});

// --- 2. [ADMIN] LISTAR REPORTES PENDIENTES (GET) ---
router.get('/admin/lista', async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id AS reporte_id, 
                r.motivo, 
                r.estado,
                p.contenido AS post_contenido,
                p.id AS post_id,
                perf_den.nombre AS denunciante_nombre,
                perf_den.apellido AS denunciante_apellido,
                perf_autor.nombre AS autor_nombre,
                perf_autor.apellido AS autor_apellido
            FROM reportes r
            JOIN publicaciones p ON r.publicacion_id = p.id
            JOIN perfiles perf_den ON r.denunciante_id = perf_den.usuario_id
            JOIN perfiles perf_autor ON p.usuario_id = perf_autor.usuario_id
            WHERE r.estado = 'pendiente'
            ORDER BY r.id DESC`; // ✅ CORREGIDO: Usamos r.id para evitar errores de columna de fecha

        const [reportes] = await db.query(query);
        res.json(reportes);
    } catch (err) {
        console.error("🚨 Error al cargar lista de justicia:", err);
        res.status(500).json({ error: "Error al cargar la lista de moderación." });
    }
});

// --- 3. [ADMIN] RESOLVER REPORTE (PATCH) ---
router.patch('/admin/resolver/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE reportes SET estado = "resuelto" WHERE id = ?', [id]);
        res.json({ mensaje: "Caso cerrado con éxito ✅" });
    } catch (err) {
        console.error("🚨 Error al resolver reporte:", err);
        res.status(500).json({ error: "No se pudo actualizar el reporte." });
    }
});

module.exports = router;