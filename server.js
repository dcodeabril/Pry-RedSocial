// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ADMINISTRACIÓN (TORRE DE CONTROL + ESTADO REAL-TIME)
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

// --- 🚦 RASTREADOR DE MOVIMIENTOS (LOGS) ---
app.use((req, res, next) => {
    const hora = new Date().toLocaleTimeString();
    console.log(`👤 [${hora}] MOVIMIENTO: ${req.method} en ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// --- 🗄️ CONEXIÓN A LA BASE DE DATOS ---
const db = require('./db/base_datos');

// --- 🛣️ IMPORTACIÓN DE RUTAS MODULARES ---
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

// Registro automático de rutas
Object.keys(rutas).forEach(ruta => app.use(`/api/${ruta}`, rutas[ruta]));

// --- 🟢 GESTIÓN DE ESTADOS ONLINE ---
const socketsActivos = {}; 

io.on('connection', (socket) => {
    socket.on('join-room', (usuarioId) => {
        const uidStr = usuarioId.toString();
        socket.join(uidStr);
        socketsActivos[socket.id] = uidStr;
        console.log(`📡 [SOCKET] Usuario ${uidStr} conectado.`);
        enviarListaOnline();
    });

    socket.on('iniciar-llamada', async ({ emisorId, receptorId, oferta }) => {
        try {
            const queryAmistad = `
                SELECT id FROM amistades 
                WHERE ((usuario_envia_id = ? AND usuario_recibe_id = ?) 
                   OR (usuario_envia_id = ? AND usuario_recibe_id = ?)) 
                AND estado = 'aceptada'`;
            const [amistad] = await db.query(queryAmistad, [emisorId, receptorId, receptorId, emisorId]);
            if (amistad.length > 0) {
                io.to(receptorId.toString()).emit('llamada-entrante', { emisorId, oferta });
            } else {
                socket.emit('error-llamada', { mensaje: "Vínculo de amistad requerido. 🔒" });
            }
        } catch (error) {
            console.error("🚨 [SOCKET ERROR]:", error.message);
        }
    });

    socket.on('contestar-llamada', ({ receptorId, emisorId, respuesta }) => {
        io.to(emisorId.toString()).emit('llamada-aceptada', { receptorId, respuesta });
    });

    socket.on('ice-candidate', ({ targetId, candidate }) => {
        io.to(targetId.toString()).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
        delete socketsActivos[socket.id];
        enviarListaOnline();
    });

    function enviarListaOnline() {
        const listaIds = Object.values(socketsActivos);
        const idsUnicos = [...new Set(listaIds)];
        io.emit('usuarios-online', idsUnicos);
    }
});

// --- 🚪 ACCESO ESTÁTICO ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'auth.html')));

app.get('/api/estado', (req, res) => {
    res.json({ 
        proyecto: "Proyecto Red Social 🚀",
        seguridad: "BCrypt + Real-Time Tracking 🟢",
        monitoreo: `${Object.keys(socketsActivos).length} sockets activos`
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
        🟢 STATUS: RASTREADOR DE ESTADO ACTIVO
        =================================================
        `);
    } catch (error) {
        console.error("❌ ERROR CRÍTICO AL INICIAR:", error.message);
    }
});