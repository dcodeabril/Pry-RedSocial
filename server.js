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

/// --- 🛠️ MIDDLEWARES (CORREGIDO) ---
app.use(cors());
app.use(express.json()); 

// Le decimos a Express que NO sirva index.html automáticamente
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS ---

// Persona 1: Seguridad y Gestión
const usuariosRoutes = require('./rutas/usuarios.routes.js');
const seguridadRoutes = require('./rutas/seguridad.routes.js');
const adminRoutes = require('./rutas/admin.routes.js'); 

// Persona 2: El Muro Social
const publicacionesRoutes = require('./rutas/publicaciones.routes.js'); 

// Persona 3: Comunicación Personal
const amistadesRoutes = require('./rutas/amistades.routes.js');
const chatsRoutes = require('./rutas/chats.routes.js');
const bloqueosRoutes = require('./rutas/bloqueos.routes.js');

// Persona 4: Utilidades y Mantenimiento
const notificacionesRoutes = require('./rutas/notificaciones.routes.js');
const eventosRoutes = require('./rutas/eventos.routes.js');
const reportesRoutes = require('./rutas/reportes.routes.js');

// --- 🔗 USO DE RUTAS API ---

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/seguridad', seguridadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/api/amistades', amistadesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/bloqueos', bloqueosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/reportes', reportesRoutes);

// --- 🚪 RUTA DE ENTRADA PRINCIPAL (NUEVA) ---
// Cuando entres a http://localhost:3000/ verás el Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// --- 📡 RUTA DE ESTADO Y PRUEBA ---
app.get('/api/estado', (req, res) => {
    res.json({ 
        mensaje: "Servidor de Facebook Local funcionando 🚀",
        arquitecto: "Israel Díaz", // Nombre actualizado
        estado_db: "Conectada a facebook_local",
        modulos_activos: [
            "Seguridad (P1)", "Admin (P1)", "Publicaciones (P2)", 
            "Amistades (P3)", "Chats (P3)", "Bloqueos (P3)",
            "Notificaciones (P4)", "Eventos (P4)", "Reportes (P4)",
            "Estética y UX (P5)"
        ]
    });
});

// --- 🚀 ARRANQUE DEL SERVIDOR CON VERIFICACIÓN ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    try {
        await db.query('SELECT 1'); 
        console.log(`
        =============================================
        📡 SERVIDOR INICIADO - ARQUITECTO ISRAEL DÍAZ
        🔗 URL: http://localhost:${PORT}
        🏠 Acceso: Redireccionado a /auth.html
        🗄️ Base de Datos: MySQL (CONEXIÓN VERIFICADA ✅)
        ✅ Sistema: P1, P2, P3, P4 y P5 Operativos
        =============================================
        `);
    } catch (error) {
        console.error(`
        =============================================
        ❌ ERROR CRÍTICO: FALLO DE CONEXIÓN A MYSQL
        Detalle: ${error.message}
        =============================================
        `);
    }
});