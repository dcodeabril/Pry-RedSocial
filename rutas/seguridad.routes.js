// rutas/seguridad.routes.js
const express = require('express');
const router = express.Router();
const iniciarSesion = require('../servicios/autenticacion');

// Conserva la ruta pública anterior con la misma validación BCrypt del acceso principal.
router.post('/login', iniciarSesion);

module.exports = router;
