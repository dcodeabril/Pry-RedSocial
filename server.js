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
app.use(express.json()); // Necesario para procesar publicaciones y contraseñas

// Servidor de archivos estáticos (HTML, CSS, JS Nativo de tus 5 compañeros)
app.use(express.static(path.join(__dirname, 'public')));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS ---
const usuariosRoutes = require('./rutas/usuarios.routes.js');
const seguridadRoutes = require('./rutas/seguridad.routes.js');
const adminRoutes = require('./rutas/admin.routes.js'); 
const publicacionesRoutes = require('./rutas/publicaciones.routes.js'); // [NUEVO] Módulo Persona 2

// --- 🔗 USO DE RUTAS ---
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/seguridad', seguridadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/publicaciones', publicacionesRoutes); // [NUEVO] Activa el motor del muro

// --- 📡 RUTAS DE ESTADO Y PRUEBA ---
app.get('/api/estado', (req, res) => {
    res.json({ 
        mensaje: "Servidor de Facebook Local funcionando 🚀",
        arquitecto: "Diego Abril",
        estado_db: "Conectada a facebook_local",
        modulos_activos: ["Seguridad", "Usuarios", "Admin", "Publicaciones"]
    });
});

// --- 🚀 ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    =============================================
    📡 SERVIDOR INICIADO - ROL ARQUITECTO
    🔗 URL: http://localhost:${PORT}
    🏠 Directorio Público: /public
    🗄️ Base de Datos: MySQL (Local)
    ✅ Módulos: Seguridad, Admin, Muro (Persona 2)
    =============================================
    `);
});