// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE EVENTOS P4)
// ARCHIVO: rutas/eventos.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. OBTENER EVENTOS FUTUROS (Cartelera Dinámica) ---
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT e.*, p.nombre, p.apellido 
            FROM eventos e
            JOIN perfiles p ON e.creador_id = p.usuario_id
            WHERE e.fecha_evento >= CURDATE()
            ORDER BY e.fecha_evento ASC
        `;
        // Usamos desestructuración [eventos] porque tu DB usa Promesas
        const [eventos] = await db.query(query);
        res.json(eventos);
    } catch (err) {
        console.error("🚨 Error al listar eventos:", err);
        res.status(500).json({ error: "No se pudieron cargar los eventos del servidor." });
    }
});

// --- 2. CREAR UN NUEVO EVENTO (Incluye Ubicación) ---
router.post('/crear', async (req, res) => {
    const { creador_id, titulo, descripcion, ubicacion, fecha_evento } = req.body;
    
    if (!creador_id || !titulo || !fecha_evento) {
        return res.status(400).json({ error: "Faltan datos obligatorios para el evento." });
    }

    try {
        const query = `
            INSERT INTO eventos (creador_id, titulo, descripcion, ubicacion, fecha_evento) 
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(query, [creador_id, titulo, descripcion, ubicacion, fecha_evento]);
        
        res.status(201).json({ mensaje: "✅ Evento organizado con éxito 📅" });
    } catch (err) {
        console.error("🚨 Error al crear evento:", err);
        res.status(500).json({ error: "Error interno al procesar el evento." });
    }
});

// --- 3. ELIMINAR UN EVENTO (Con Validación de Autor) ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.query; // Recibimos quién quiere borrar para validar

    try {
        // Ejecutamos el borrado solo si el creador_id coincide con quien solicita
        const [resultado] = await db.query(
            'DELETE FROM eventos WHERE id = ? AND creador_id = ?', 
            [id, usuario_id]
        );

        if (resultado.affectedRows > 0) {
            res.json({ mensaje: "Evento eliminado correctamente 🗑️" });
        } else {
            // Si no se borró nada, es porque el ID no existe o el usuario no es el dueño
            res.status(403).json({ error: "No tienes permiso para borrar este evento o el evento no existe." });
        }
    } catch (err) {
        console.error("🚨 Error al borrar evento:", err);
        res.status(500).json({ error: "Error interno al intentar eliminar el evento." });
    }
});

module.exports = router;