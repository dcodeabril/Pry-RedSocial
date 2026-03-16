// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (INTEGRACIÓN TOTAL P1-P5 + SEÑALIZACIÓN WEBRTC)
// ARCHIVO: server.js
// =============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); // Requerido para Socket.io
const { Server } = require('socket.io'); // Motor de tiempo real
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Creamos el servidor HTTP envolviendo Express

// --- 📡 CONFIGURACIÓN DE SOCKET.IO (Signaling para Video #11) ---
const io = new Server(server, {
    cors: {
        origin: "*", // En desarrollo permitimos todo
        methods: ["GET", "POST"]
    }
});

// --- 🛠️ MIDDLEWARES ---
app.use(cors());
app.use(express.json()); 

// --- 🚦 RASTREADOR DE TRÁFICO (DEPURACIÓN) ---
app.use((req, res, next) => {
    console.log(`📡 Petición entrante: ${req.method} ${req.url}`);
    next();
});

// Evitar que sirva index.html por defecto para respetar el Login (P1)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS ---
const usuariosRoutes = require('./rutas/usuarios.routes.js');
const seguridadRoutes = require('./rutas/seguridad.routes.js');
const adminRoutes = require('./rutas/admin.routes.js'); 
const publicacionesRoutes = require('./rutas/publicaciones.routes.js'); 
const amistadesRoutes = require('./rutas/amistades.routes.js');
const chatsRoutes = require('./rutas/chats.routes.js');
const bloqueosRoutes = require('./rutas/bloqueos.routes.js');
const notificacionesRoutes = require('./rutas/notificaciones.routes.js');
const eventosRoutes = require('./rutas/eventos.routes.js');
const reportesRoutes = require('./rutas/reportes.routes.js');
const notasRoutes = require('./rutas/notas.routes');

// --- 🔗 CONEXIÓN DE RUTAS CON LA API ---
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
app.use('/api/notas', notasRoutes);

// --- 🔌 LÓGICA DE SEÑALIZACIÓN (SIGNALING WEBRTC) ---
io.on('connection', (socket) => {
    console.log(`📡 Dispositivo conectado al socket: ${socket.id}`);

    // Unirse a una "sala" personal basada en el ID de la base de datos
    socket.on('join-room', (usuarioId) => {
        socket.join(usuarioId.toString());
        console.log(`👥 Usuario ${usuarioId} entró a su canal de señales.`);
    });

    // Envío de oferta de video (Marcar)
    socket.on('iniciar-llamada', ({ emisorId, receptorId, oferta }) => {
        console.log(`📞 Llamada de ${emisorId} para ${receptorId}`);
        io.to(receptorId.toString()).emit('llamada-entrante', { emisorId, oferta });
    });

    // Envío de respuesta (Contestar)
    socket.on('contestar-llamada', ({ receptorId, emisorId, respuesta }) => {
        console.log(`✅ ${receptorId} contestó a ${emisorId}`);
        io.to(emisorId.toString()).emit('llamada-aceptada', { receptorId, respuesta });
    });

    // Intercambio de candidatos ICE (Conectividad técnica)
    socket.on('ice-candidate', ({ targetId, candidate }) => {
        io.to(targetId.toString()).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Dispositivo desconectado');
    });
});

// --- 🚪 RUTA DE ENTRADA PRINCIPAL ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// --- 📡 RUTA DE ESTADO ACTUALIZADA ---
app.get('/api/estado', (req, res) => {
    res.json({ 
        mensaje: "Servidor de Facebook Local funcionando 🚀",
        arquitecto: "Israel Díaz",
        modulos_activos: ["P1-P5", "Notas-#15", "WebRTC-Signaling-#11"]
    });
});

// --- 🚀 ARRANQUE DEL SERVIDOR (Usa 'server.listen') ---
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
    try {
        await db.query('SELECT 1'); 
        console.log(`
        =============================================
        📡 CENTRAL DE COMUNICACIONES - ARQUITECTO ISRAEL
        🔗 URL: http://localhost:${PORT}
        🗄️ MySQL: CONEXIÓN VERIFICADA ✅
        🎥 WEBRTC SIGNALING: OPERATIVO ⚡
        =============================================
        `);
    } catch (error) {
        console.error("❌ ERROR DE CONEXIÓN A MYSQL:", error.message);
    }
});