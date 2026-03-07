// rutas/usuarios.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db/base_datos'); // Conexión que creamos ayer

// Función para REGISTRAR un nuevo usuario
router.post('/registro', async (req, res) => {
    const { email, password } = req.body;

    // Validación de Arquitecto: Password debe ser de exactamente 12 caracteres
    if (password.length !== 12) {
        return res.status(400).json({ error: "La contraseña debe tener exactamente 12 caracteres." });
    }

    try {
        // Insertamos en la tabla 'usuarios' que creamos en MySQL
        const [resultado] = await db.query(
            'INSERT INTO usuarios (email, password) VALUES (?, ?)',
            [email, password]
        );
        res.status(201).json({ mensaje: "Usuario creado con éxito", id: resultado.insertId });
    } catch (err) {
        res.status(500).json({ error: "Error al registrar: el email ya podría existir." });
    }
});

module.exports = router;