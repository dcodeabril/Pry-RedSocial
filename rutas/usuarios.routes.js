// rutas/usuarios.routes.js
const express = require('express');
const router = express.Router(); // <--- ¡ESTA ES LA LÍNEA QUE FALTABA!
const db = require('../db/base_datos');

// 1. REGISTRAR un nuevo usuario (Persona 1)
router.post('/registro', async (req, res) => {
    const { email, password } = req.body;

    // Validación: Contraseña de exactamente 12 caracteres
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

// 2. ACTUALIZAR perfil (Persona 1 - Continuación)
router.put('/perfil/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, bio, password } = req.body;

    if (password && password.length !== 12) {
        return res.status(400).json({ error: "La nueva contraseña debe tener exactamente 12 caracteres." });
    }

    try {
        if (password) {
            await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [password, id]);
        }
        // Nota: Asegúrate de que la tabla 'perfiles' exista en tu DB
        await db.query(
            'UPDATE perfiles SET nombre = ?, apellido = ?, bio = ? WHERE usuario_id = ?',
            [nombre, apellido, bio, id]
        );
        res.json({ mensaje: "Perfil actualizado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar el perfil" });
    }
});

// ¡No olvides exportarlo!
module.exports = router;