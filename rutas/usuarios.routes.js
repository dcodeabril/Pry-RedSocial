// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (INTEGRACIÓN TOTAL P1 + P5)
// ARCHIVO: rutas/usuarios.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// --- 1. REGISTRO DE USUARIOS (Persona 1: Seguridad) ---
router.post('/registro', async (req, res) => {
    const { email, password } = req.body;

    // 🛡️ Regla de Oro: Contraseña de exactamente 12 caracteres
    if (password.length !== 12) {
        return res.status(400).json({ error: "La contraseña debe tener exactamente 12 caracteres." });
    }

    try {
        const [resultado] = await db.query(
            'INSERT INTO usuarios (email, password) VALUES (?, ?)',
            [email, password]
        );
        res.status(201).json({ mensaje: "Usuario creado con éxito", id: resultado.insertId });
    } catch (err) {
        res.status(500).json({ error: "Error al registrar: el email ya podría existir." });
    }
});

// --- 2. OBTENER AJUSTES Y PERFIL (Persona 1 y 5) ---
// Recupera todos los datos para cargar el formulario de Ajustes
router.get('/ajustes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT u.email, u.preferencia_tema, p.nombre, p.apellido, p.bio, p.foto_url 
            FROM usuarios u 
            JOIN perfiles p ON u.id = p.usuario_id 
            WHERE u.id = ?`;
        
        const [rows] = await db.query(query, [id]);
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: "Usuario no encontrado" });
        }
    } catch (err) {
        res.status(500).json({ error: "Error al obtener los datos del servidor" });
    }
});

// --- 3. SUPER-UPDATE: PERFIL Y AJUSTES (Persona 1 y 5) ---
// Esta ruta unificada actualiza Seguridad, Estética y Datos Personales a la vez
router.put('/actualizar-ajustes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, bio, foto_url, tema, password } = req.body;

    try {
        // A. Actualización en Tabla Usuarios (Password y Tema)
        if (password) {
            if (password.length !== 12) {
                return res.status(400).json({ error: "La contraseña debe ser de 12 caracteres." });
            }
            await db.query('UPDATE usuarios SET password = ?, preferencia_tema = ? WHERE id = ?', [password, tema, id]);
        } else {
            await db.query('UPDATE usuarios SET preferencia_tema = ? WHERE id = ?', [tema, id]);
        }

        // B. Actualización en Tabla Perfiles (Datos Visuales)
        await db.query(
            `UPDATE perfiles 
             SET nombre = ?, apellido = ?, bio = ?, foto_url = ? 
             WHERE usuario_id = ?`,
            [nombre, apellido, bio, foto_url, id]
        );

        res.json({ mensaje: "¡Perfil y ajustes actualizados correctamente! ✅" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error crítico al guardar en la base de datos." });
    }
});

module.exports = router;