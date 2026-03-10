// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE PRIVACIDAD P4)
// ARCHIVO: rutas/bloqueos.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. EJECUTAR UN BLOQUEO (POST) ---
// Acción: Crea el bloqueo y elimina la solicitud/amistad de la Tabla 7
router.post('/crear', async (req, res) => {
    const { usuario_id, usuario_bloqueado_id } = req.body;

    // 🛡️ Validación de seguridad básica
    if (usuario_id == usuario_bloqueado_id) {
        return res.status(400).json({ error: "Operación no válida: No puedes bloquearte a ti mismo." });
    }

    try {
        // A. Insertamos el bloqueo en la Tabla 8
        await db.query(
            'INSERT INTO bloqueos (usuario_id, usuario_bloqueado_id) VALUES (?, ?)',
            [usuario_id, usuario_bloqueado_id]
        );

        // B. 🧹 LIMPIEZA AUTOMÁTICA (Persona 3): Eliminamos rastro en la tabla amistades
        // Usamos los nombres reales: usuario_envia_id y usuario_recibe_id
        const queryLimpieza = `
            DELETE FROM amistades 
            WHERE (usuario_envia_id = ? AND usuario_recibe_id = ?) 
               OR (usuario_envia_id = ? AND usuario_recibe_id = ?)`;
        
        await db.query(queryLimpieza, [usuario_id, usuario_bloqueado_id, usuario_bloqueado_id, usuario_id]);

        res.status(201).json({ mensaje: "Usuario bloqueado y relación eliminada con éxito. 🚫" });
    } catch (err) {
        console.error("🚨 Error en proceso de bloqueo:", err);
        res.status(500).json({ error: "Ya has bloqueado a este usuario o hubo un fallo en el servidor." });
    }
});

// --- 2. LISTAR MIS BLOQUEADOS (GET) ---
router.get('/lista/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT b.id as bloqueo_id, p.nombre, p.apellido, p.usuario_id 
            FROM bloqueos b
            JOIN perfiles p ON b.usuario_bloqueado_id = p.usuario_id
            WHERE b.usuario_id = ?
            ORDER BY p.nombre ASC`;
            
        const [rows] = await db.query(query, [id]);
        res.json(rows);
    } catch (err) {
        console.error("🚨 Error al listar bloqueos:", err);
        res.status(500).json({ error: "No se pudo obtener la lista de usuarios bloqueados." });
    }
});

// --- 3. DESBLOQUEAR (DELETE) ---
router.delete('/eliminar/:bloqueoId', async (req, res) => {
    const { bloqueoId } = req.params;
    try {
        await db.query('DELETE FROM bloqueos WHERE id = ?', [bloqueoId]);
        res.json({ mensaje: "Usuario desbloqueado correctamente. ✅" });
    } catch (err) {
        console.error("🚨 Error al desbloquear:", err);
        res.status(500).json({ error: "No se pudo completar el desbloqueo." });
    }
});

module.exports = router;