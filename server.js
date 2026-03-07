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
app.use(express.json()); // Permite recibir JSON (Importante para contraseñas de 12 caracteres)

// Servidor de archivos estáticos (HTML, CSS, JS Nativo de tus 5 compañeros)
app.use(express.static(path.join(__dirname, 'public')));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS ---
const usuariosRoutes = require('./rutas/usuarios.routes.js');
const seguridadRoutes = require('./rutas/seguridad.routes.js');
const adminRoutes = require('./rutas/admin.routes.js'); // [NUEVO] Ruta de Administración

// --- 🔗 USO DE RUTAS ---
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/seguridad', seguridadRoutes);
app.use('/api/admin', adminRoutes); // [NUEVO] Activa el poder de gestión del sistema

// --- 📡 RUTAS DE ESTADO Y PRUEBA ---
app.get('/api/estado', (req, res) => {
    res.json({ 
        mensaje: "Servidor de Facebook Local funcionando 🚀",
        arquitecto: "Diego Abril",
        estado_db: "Conectada a facebook_local",
        modulos: ["Seguridad", "Usuarios", "Admin"]
    });
});

// --- 🚀 ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    =============================================
    📡 SERVIDOR INICIADO CORRECTAMENTE (MODO ADMIN)
    🔗 URL: http://localhost:${PORT}
    🏠 Directorio Público: /public
    🗄️ Base de Datos: MySQL (Local)
    =============================================
    `);
});