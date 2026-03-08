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
app.use(express.json()); // Vital para procesar mensajes, publicaciones y bloqueos

// Servidor de archivos estáticos (HTML, CSS, JS Nativo de tus 5 compañeros)
app.use(express.static(path.join(__dirname, 'public')));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS ---
// Persona 1: Seguridad y Gestión
const usuariosRoutes = require('./rutas/usuarios.routes.js');
const seguridadRoutes = require('./rutas/seguridad.routes.js');
const adminRoutes = require('./rutas/admin.routes.js'); 

// Persona 2: El Muro Social
const publicacionesRoutes = require('./rutas/publicaciones.routes.js'); 

// Persona 3: Comunicación Personal y Seguridad [FINALIZADO]
const amistadesRoutes = require('./rutas/amistades.routes.js');
const chatsRoutes = require('./rutas/chats.routes.js');
const bloqueosRoutes = require('./rutas/bloqueos.routes.js'); // [NUEVO]

// --- 🔗 USO DE RUTAS ---
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/seguridad', seguridadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/publicaciones', publicacionesRoutes);

// Activación de módulos de la Persona 3
app.use('/api/amistades', amistadesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/bloqueos', bloqueosRoutes); // [NUEVO] Activa el escudo de privacidad

// --- 📡 RUTAS DE ESTADO Y PRUEBA ---
app.get('/api/estado', (req, res) => {
    res.json({ 
        mensaje: "Servidor de Facebook Local funcionando 🚀",
        arquitecto: "Diego Abril",
        estado_db: "Conectada a facebook_local",
        modulos_activos: [
            "Seguridad", 
            "Usuarios", 
            "Admin", 
            "Publicaciones", 
            "Amistades", 
            "Chats",
            "Bloqueos" // Confirmación de módulo 3 completo
        ]
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
    ✅ Módulos: Persona 1, Persona 2, Persona 3 (OK)
    =============================================
    `);
});