// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (COMUNICACIÓN DINÁMICA + ESTADO REAL-TIME)
// ARCHIVO: public/js/mensajes.js
// =============================================

const listaAmigos = document.getElementById('lista-amigos');
const mensajesBody = document.getElementById('mensajes-body');
const inputMsj = document.getElementById('input-msj');
const btnEnviar = document.getElementById('btn-enviar');
const chatHeader = document.getElementById('chat-header');

// 🛡️ Identidad y Estado Real-time
const miId = parseInt(localStorage.getItem('usuarioId')); 
let amigoSeleccionadoId = null;
let usuariosOnline = []; // 🟢 Almacén de IDs conectados

// 🔌 1. CONEXIÓN AL SERVIDOR (SOCKET.IO)
const socket = io();

// Registrarse en el canal privado ni bien carga la página
if (miId) {
    socket.emit('join-room', miId);
}

// 📡 2. ESCUCHAR LISTA DE CONECTADOS
socket.on('usuarios-online', (ids) => {
    usuariosOnline = ids.map(id => id.toString());
    console.log("Usuarios en línea actualizados:", usuariosOnline);
    cargarListaAmigos(); 
});

// --- 👥 3. CARGAR LISTA DE CONTACTOS ---
async function cargarListaAmigos() {
    if (!miId) return;
    try {
        const res = await fetch(`/api/amistades/lista/${miId}`);
        const amigos = await res.json();
        
        if (amigos.length === 0) {
            listaAmigos.innerHTML = '<li class="amigos-vacio">Busca amigos para chatear 🌐</li>';
            return;
        }

        listaAmigos.innerHTML = amigos.map(a => {
            // 🧠 LÓGICA DE IDENTIDAD DINÁMICA (MC STYLE)
            const iniciales = (a.nombre + " " + (a.apellido || "")).trim().split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2);
            
            const avatarHtml = (a.foto_url && a.foto_url !== 'default.png' && a.foto_url !== 'null' && a.foto_url !== '')
                ? `<img src="/img/${a.foto_url}" class="amigo-avatar" onerror="this.onerror=null; this.src='/img/default.png';">`
                : `<div class="avatar-dinamico-nav amigo-avatar" style="width: 42px; height: 42px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                       <span class="iniciales-text" style="font-size: 1rem; color: white; font-weight: 800;">${iniciales}</span>
                   </div>`;

            // 🟢 VALIDACIÓN REAL-TIME
            const estaOnline = usuariosOnline.includes(a.usuario_id.toString());
            const statusClase = estaOnline ? 'status-online' : 'status-offline';
            const statusTexto = estaOnline ? 'En línea' : 'Desconectado';

            return `
                <li class="amigo-item ${amigoSeleccionadoId == a.usuario_id ? 'amigo-item-activo' : ''}" 
                    id="item-amigo-${a.usuario_id}" 
                    onclick="seleccionarAmigo(${a.usuario_id}, '${a.nombre} ${a.apellido}')">
                    <div class="amigo-item-content">
                        ${avatarHtml}
                        <div class="amigo-info-mini">
                            <strong>${a.nombre} ${a.apellido}</strong>
                            <small class="${statusClase}">
                                <i class="fa-solid fa-circle"></i> ${statusTexto}
                            </small>
                        </div>
                    </div>
                </li>`;
        }).join('');
    } catch (err) {
        console.error("🚨 Error al cargar contactos:", err);
    }
}

// --- 🎯 4. SELECCIONAR AMIGO Y ABRIR CHAT ---
window.seleccionarAmigo = function(id, nombreCompleto) {
    amigoSeleccionadoId = id;

    chatHeader.className = 'chat-header-active';
    chatHeader.innerHTML = `
        <div class="chat-header-flex">
            <div class="chat-user-info">
                <i class="fa-solid fa-circle-user"></i>
                <span>Chat con <strong>${nombreCompleto}</strong></span>
            </div>
            <div class="chat-header-actions">
                <button onclick="abrirInterfazLlamada(${id})" 
                        class="btn-call-trigger" 
                        title="Iniciar Videollamada">
                    <i class="fa-solid fa-video"></i>
                </button>
            </div>
        </div>
    `;
    
    document.querySelectorAll('.amigo-item').forEach(el => el.classList.remove('amigo-item-activo'));
    const itemActivo = document.getElementById(`item-amigo-${id}`);
    if (itemActivo) itemActivo.classList.add('amigo-item-activo');

    cargarMensajes();
};

// --- 💬 5. OBTENER CONVERSACIÓN ---
async function cargarMensajes() {
    if (!amigoSeleccionadoId) return;

    try {
        const res = await fetch(`/api/chats/conversacion/${miId}/${amigoSeleccionadoId}`);
        const mensajes = await res.json();

        if (mensajes.length === 0) {
            mensajesBody.innerHTML = `
                <div class="msg-vacio">
                    <i class="fa-solid fa-comments"></i>
                    <p>No hay mensajes aún. ¡Rompe el hielo!</p>
                </div>`;
            return;
        }

        mensajesBody.innerHTML = mensajes.map(m => {
            const esMio = parseInt(m.emisor_id) === miId;
            return `
                <div class="msg-row ${esMio ? 'msg-row-me' : 'msg-row-them'}">
                    <div class="msg-bubble">
                        <p class="msg-text">${m.contenido}</p>
                        <small class="msg-time">
                            ${new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </small>
                    </div>
                </div>
            `;
        }).join('');

        mensajesBody.scrollTop = mensajesBody.scrollHeight;
    } catch (err) {
        console.error("🚨 Error al cargar mensajes:", err);
    }
}

// --- 🚀 6. ENVIAR NUEVO MENSAJE ---
async function enviarMensaje() {
    const contenido = inputMsj.value.trim();
    if (!contenido || !amigoSeleccionadoId) return;

    try {
        const res = await fetch('/api/chats/enviar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                emisor_id: miId, 
                receptor_id: amigoSeleccionadoId, 
                contenido: contenido 
            })
        });

        if (res.ok) {
            inputMsj.value = '';
            cargarMensajes(); 
        }
    } catch (err) {
        console.error("🚨 Error al enviar:", err);
    }
}

// Eventos de interfaz
if (btnEnviar) btnEnviar.addEventListener('click', enviarMensaje);
if (inputMsj) {
    inputMsj.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensaje();
    });
}

// Sincronización automática de mensajes (Polling de seguridad)
setInterval(() => {
    if (amigoSeleccionadoId) {
        cargarMensajes();
    }
}, 4000);

// Carga inicial de contactos
cargarListaAmigos();