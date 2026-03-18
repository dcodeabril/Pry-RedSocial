// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (COMUNICACIÓN DINÁMICA P3 + VIDEOLLAMADA #11)
// ARCHIVO: mensajes.js
// =============================================

const listaAmigos = document.getElementById('lista-amigos');
const mensajesBody = document.getElementById('mensajes-body');
const inputMsj = document.getElementById('input-msj');
const btnEnviar = document.getElementById('btn-enviar');
const chatHeader = document.getElementById('chat-header');

// 🛡️ Identidad dinámica
const miId = parseInt(localStorage.getItem('usuarioId')); 
let amigoSeleccionadoId = null;

// --- 👥 1. CARGAR LISTA DE CONTACTOS ---
async function cargarListaAmigos() {
    if (!miId) return;
    try {
        const res = await fetch(`/api/amistades/lista/${miId}`);
        const amigos = await res.json();
        
        if (amigos.length === 0) {
            listaAmigos.innerHTML = '<li class="amigos-vacio">Aún no tienes amigos aceptados. 🌐</li>';
            return;
        }

        listaAmigos.innerHTML = amigos.map(a => `
            <li class="amigo-item card" 
                id="item-amigo-${a.usuario_id}"
                onclick="seleccionarAmigo(${a.usuario_id}, '${a.nombre} ${a.apellido}')">
                <div class="amigo-item-content">
                    <img src="${a.foto_url || 'img/default.png'}" class="amigo-avatar">
                    <strong>${a.nombre} ${a.apellido}</strong>
                </div>
            </li>
        `).join('');
    } catch (err) {
        console.error("Error al cargar amigos:", err);
    }
}

// --- 🎯 2. SELECCIONAR AMIGO Y ABRIR CHAT ---
window.seleccionarAmigo = function(id, nombreCompleto) {
    amigoSeleccionadoId = id;

    chatHeader.innerHTML = `
        <div class="chat-header-flex">
            <span>Chat con <strong>${nombreCompleto}</strong></span>
            <div class="chat-header-actions">
                <span onclick="abrirInterfazLlamada(${id})" 
                      class="icon-video" 
                      title="Iniciar Videollamada">📹</span>
            </div>
        </div>
    `;
    
    // Resaltar visualmente usando clases
    document.querySelectorAll('.amigo-item').forEach(el => el.classList.remove('amigo-item-activo'));
    const itemActivo = document.getElementById(`item-amigo-${id}`);
    if (itemActivo) itemActivo.classList.add('amigo-item-activo');

    cargarMensajes();
};

// --- 💬 3. OBTENER CONVERSACIÓN ---
async function cargarMensajes() {
    if (!amigoSeleccionadoId) return;

    try {
        const res = await fetch(`/api/chats/conversacion/${miId}/${amigoSeleccionadoId}`);
        const mensajes = await res.json();

        if (mensajes.length === 0) {
            mensajesBody.innerHTML = '<p class="msg-vacio">No hay mensajes. ¡Di hola! 👋</p>';
            return;
        }

        mensajesBody.innerHTML = mensajes.map(m => {
            const esMio = m.emisor_id === miId;
            return `
                <div class="msg-container" style="align-items: ${esMio ? 'flex-end' : 'flex-start'};">
                    <div class="msg ${esMio ? 'msg-emisor' : 'msg-receptor'}">
                        <p class="msg-text">${m.contenido}</p>
                    </div>
                    <small class="msg-time">
                        ${new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                </div>
            `;
        }).join('');

        mensajesBody.scrollTop = mensajesBody.scrollHeight;

    } catch (err) {
        console.error("Error al cargar mensajes:", err);
    }
}

// --- 🚀 4. ENVIAR NUEVO MENSAJE ---
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
        console.error("Error al enviar:", err);
    }
}

// --- ⌨️ EVENTOS ---
btnEnviar.addEventListener('click', enviarMensaje);
inputMsj.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarMensaje();
});

// --- 🔄 SINCRONIZACIÓN AUTOMÁTICA ---
setInterval(() => {
    if (amigoSeleccionadoId) {
        cargarMensajes();
    }
}, 4000);

cargarListaAmigos();