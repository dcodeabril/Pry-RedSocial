// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (INTEGRACIÓN TOTAL P1-P5)
// ARCHIVO: server.js
// =============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- 🛠️ MIDDLEWARES ---
app.use(cors());
app.use(express.json()); 

// Evitar que sirva index.html por defecto para respetar el Login (P1)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS (PERSONAS 1, 2, 3, 4) ---

// Persona 1: Seguridad y Gestión
const usuariosRoutes = require('./rutas/usuarios.routes.js');
const seguridadRoutes = require('./rutas/seguridad.routes.js');
const adminRoutes = require('./rutas/admin.routes.js'); 

// Persona 2: El Muro Social
const publicacionesRoutes = require('./rutas/publicaciones.routes.js'); 

// Persona 3: Comunicación Personal (¡CRÍTICO!)
const amistadesRoutes = require('./rutas/amistades.routes.js');
const chatsRoutes = require('./rutas/chats.routes.js');
const bloqueosRoutes = require('./rutas/bloqueos.routes.js');

// Persona 4: Utilidades y Mantenimiento
const notificacionesRoutes = require('./rutas/notificaciones.routes.js');
const eventosRoutes = require('./rutas/eventos.routes.js');
const reportesRoutes = require('./rutas/reportes.routes.js');

// --- 🔗 CONEXIÓN DE RUTAS CON LA API ---

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/seguridad', seguridadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/publicaciones', publicacionesRoutes);

// Aquí activamos los pasillos de comunicación de la Persona 3
app.use('/api/amistades', amistadesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/bloqueos', bloqueosRoutes);

app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/reportes', reportesRoutes);

// --- 🚪 RUTA DE ENTRADA PRINCIPAL ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// --- 📡 RUTA DE ESTADO (Para verificar en el navegador) ---
app.get('/api/estado', (req, res) => {
    res.json({ 
        mensaje: "Servidor de Facebook Local funcionando 🚀",
        arquitecto: "Israel Díaz",
        modulos_activos: ["P1-Seguridad", "P2-Muro", "P3-Chat", "P4-Utils", "P5-UX"]
    });
});

// --- 🚀 ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    try {
        await db.query('SELECT 1'); 
        console.log(`
        =============================================
        📡 SERVIDOR INICIADO - ARQUITECTO ISRAEL DÍAZ
        🔗 URL: http://localhost:${PORT}
        🗄️ MySQL: CONEXIÓN VERIFICADA ✅
        ✅ RUTAS P3 (CHATS Y AMIGOS): ACTIVAS 💬
        =============================================
        `);
    } catch (error) {
        console.error("❌ ERROR DE CONEXIÓN A MYSQL:", error.message);
    }
});