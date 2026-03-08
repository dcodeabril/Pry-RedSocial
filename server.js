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
app.use(express.json()); 
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

// Persona 3: Comunicación Personal
const amistadesRoutes = require('./rutas/amistades.routes.js');
const chatsRoutes = require('./rutas/chats.routes.js');
const bloqueosRoutes = require('./rutas/bloqueos.routes.js');

// Persona 4: Utilidades y Mantenimiento
const notificacionesRoutes = require('./rutas/notificaciones.routes.js');
const eventosRoutes = require('./rutas/eventos.routes.js');
const reportesRoutes = require('./rutas/reportes.routes.js');

// --- 🔗 USO DE RUTAS ---

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/seguridad', seguridadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/api/amistades', amistadesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/bloqueos', bloqueosRoutes);

// Activación Módulos Persona 4
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/reportes', reportesRoutes);

// --- 📡 RUTAS DE ESTADO Y PRUEBA ---
app.get('/api/estado', (req, res) => {
    res.json({ 
        mensaje: "Servidor de Facebook Local funcionando 🚀",
        arquitecto: "Diego Abril",
        estado_db: "Conectada a facebook_local",
        modulos_activos: [
            "Seguridad (P1)", 
            "Usuarios (P1)", 
            "Admin (P1)", 
            "Publicaciones (P2)", 
            "Amistades (P3)", 
            "Chats (P3)",
            "Bloqueos (P3)",
            "Notificaciones (P4)",
            "Eventos (P4)",
            "Reportes (P4)"
        ]
    });
});

// --- 🚀 ARRANQUE DEL SERVIDOR CON VERIFICACIÓN ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    try {
        // Intento de consulta real para verificar credenciales
        await db.query('SELECT 1'); 
        
        console.log(`
        =============================================
        📡 SERVIDOR INICIADO - ROL ARQUITECTO
        🔗 URL: http://localhost:${PORT}
        🏠 Directorio Público: /public
        🗄️ Base de Datos: MySQL (CONEXIÓN VERIFICADA ✅)
        ✅ Módulos: P1, P2, P3 y P4 (100% Operativos)
        =============================================
        `);
    } catch (error) {
        console.error(`
        =============================================
        ❌ ERROR CRÍTICO: FALLO DE CONEXIÓN A MYSQL
        Detalle: ${error.message}
        ---------------------------------------------
        Revisa tu archivo .env y asegúrate de que 
        el usuario y la contraseña sean correctos.
        =============================================
        `);
    }
});