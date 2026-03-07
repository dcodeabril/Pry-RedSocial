// rutas/seguridad.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// Función de LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? AND password = ?',
            [email, password]
        );

        if (usuarios.length > 0) {
            res.json({ mensaje: "Inicio de sesión correcto", usuario: usuarios[0] });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor de seguridad" });
    }
});

module.exports = router;