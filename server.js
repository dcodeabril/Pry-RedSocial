// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (INTEGRACIÓN TOTAL)
// ARCHIVO: server.js
// =============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- 🛠️ MIDDLEWARES ---
app.use(cors());
app.use(express.json()); // Permite recibir datos en formato JSON (como el email y password)

// Servidor de archivos estáticos (HTML, CSS, JS Nativo de tus 5 compañeros)
app.use(express.static(path.join(__dirname, 'public')));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS (Persona 1: Seguridad y Usuarios) ---
const usuariosRoutes = require('./rutas/usuarios.routes.js');
const seguridadRoutes = require('./rutas/seguridad.routes.js');

// --- 🔗 USO DE RUTAS ---
// Estas rutas permiten registrar y loguear usuarios en tus 13 tablas de MySQL
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/seguridad', seguridadRoutes);

// --- 📡 RUTAS DE ESTADO Y PRUEBA ---
app.get('/api/estado', (req, res) => {
    res.json({ 
        mensaje: "Servidor de Facebook Local funcionando 🚀",
        arquitecto: "Diego Abril",
        estado_db: "Conectada a facebook_local" 
    });
});

// --- 🚀 ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    =============================================
    📡 SERVIDOR INICIADO CORRECTAMENTE
    🔗 URL: http://localhost:${PORT}
    🏠 Directorio Público: /public
    🗄️ Base de Datos: MySQL (Local)
    =============================================
    `);
});