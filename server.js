// =============================================
// PROYECTO: RED SOCIAL
// ROL: ADMINISTRACIÓN (VERSIÓN LIMPIA + LOGS DE TRÁFICO)
// ARCHIVO: server.js
// =============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// --- 📡 CONFIGURACIÓN DE SOCKET.IO ---
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- 🛠️ MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- 🚦 RASTREADOR DE MOVIMIENTOS (LOGS DE USUARIO) ---
app.use((req, res, next) => {
    const hora = new Date().toLocaleTimeString();
    console.log(`👤 [${hora}] MOVIMIENTO: ${req.method} en ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS ---
const rutas = {
    usuarios: require('./rutas/usuarios.routes.js'),
    seguridad: require('./rutas/seguridad.routes.js'),
    admin: require('./rutas/admin.routes.js'),
    publicaciones: require('./rutas/publicaciones.routes.js'),
    amistades: require('./rutas/amistades.routes.js'),
    chats: require('./rutas/chats.routes.js'),
    bloqueos: require('./rutas/bloqueos.routes.js'),
    notificaciones: require('./rutas/notificaciones.routes.js'),
    eventos: require('./rutas/eventos.routes.js'),
    reportes: require('./rutas/reportes.routes.js'),
    notas: require('./rutas/notas.routes')
};

// --- 🔗 CONEXIÓN DE RUTAS ---
Object.keys(rutas).forEach(ruta => app.use(`/api/${ruta}`, rutas[ruta]));

// --- 🔌 LÓGICA DE SEÑALIZACIÓN (MONITOREO WEBRTC 🎥) ---
io.on('connection', (socket) => {
    
    socket.on('join-room', (usuarioId) => {
        socket.join(usuarioId.toString());
        console.log(`📡 [SOCKET] Canal privado abierto para Usuario ID: ${usuarioId}`);
    });

    socket.on('iniciar-llamada', async ({ emisorId, receptorId, oferta }) => {
        try {
            console.log(`📞 [LLAMADA] Intento de: ${emisorId} hacia: ${receptorId}`);
            
            const queryAmistad = `
                SELECT id FROM amistades 
                WHERE ((usuario_envia_id = ? AND usuario_recibe_id = ?) 
                   OR (usuario_envia_id = ? AND usuario_recibe_id = ?)) 
                AND estado = 'aceptada'`;

            const [amistad] = await db.query(queryAmistad, [emisorId, receptorId, receptorId, emisorId]);

            if (amistad.length > 0) {
                console.log(`✅ [LLAMADA] Autorizada. Enviando señal a ${receptorId}`);
                io.to(receptorId.toString()).emit('llamada-entrante', { emisorId, oferta });
            } else {
                console.log(`🚫 [LLAMADA] Bloqueada. Motivo: No son amigos.`);
                socket.emit('error-llamada', { mensaje: "Vínculo de amistad requerido. 🔒" });
            }
        } catch (error) {
            console.error("🚨 [SOCKET ERROR]:", error.message);
        }
    });

    socket.on('contestar-llamada', ({ receptorId, emisorId, respuesta }) => {
        console.log(`✅ [LLAMADA] Usuario ${receptorId} aceptó la videollamada de ${emisorId}`);
        io.to(emisorId.toString()).emit('llamada-aceptada', { receptorId, respuesta });
    });

    socket.on('ice-candidate', ({ targetId, candidate }) => {
        io.to(targetId.toString()).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('🔌 [SOCKET] Dispositivo desconectado.');
    });
});

// --- 🚪 ACCESO ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'auth.html')));

app.get('/api/estado', (req, res) => {
    res.json({ 
        proyecto: "Proyecto Red Social 🚀",
        seguridad: "BCrypt + Friendship Shield 🔒",
        logs: "Verbose Mode - Active 🟢"
    });
});

// --- 🚀 ARRANQUE ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    try {
        await db.query('SELECT 1'); 
        console.log(`
        =================================================
        📡 CENTRAL DE CONTROL - PROYECTO RED SOCIAL
        🔗 URL: http://localhost:${PORT}
        🗄️ DB: MySQL CONECTADO ✅
        🕵️ MONITOR: LOGS DE DEPURACIÓN ACTIVOS 🔍
        =================================================
        `);
    } catch (error) {
        console.error("❌ ERROR CRÍTICO AL INICIAR:", error.message);
    }
});