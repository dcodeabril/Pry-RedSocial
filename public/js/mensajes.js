// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (COMUNICACIÓN DINÁMICA P3)
// ARCHIVO: mensajes.js
// =============================================

const listaAmigos = document.getElementById('lista-amigos');
const mensajesBody = document.getElementById('mensajes-body');
const inputMsj = document.getElementById('input-msj');
const btnEnviar = document.getElementById('btn-enviar');
const chatHeader = document.getElementById('chat-header');

// 🛡️ Identidad dinámica: Recuperamos el ID de quien inició sesión
const miId = parseInt(localStorage.getItem('usuarioId')); 
let amigoSeleccionadoId = null;

// --- 👥 1. CARGAR LISTA DE CONTACTOS ---
async function cargarListaAmigos() {
    try {
        // Esta ruta debe devolver los amigos aceptados de la Tabla 6 (amistades)
        const res = await fetch(`/api/amistades/lista/${miId}`);
        const amigos = await res.json();
        
        if (amigos.length === 0) {
            listaAmigos.innerHTML = '<li class="text-muted">Aún no tienes amigos.</li>';
            return;
        }

        listaAmigos.innerHTML = amigos.map(a => `
            <li class="amigo-item card" onclick="seleccionarAmigo(${a.usuario_id}, '${a.nombre} ${a.apellido}')">
                <strong>${a.nombre} ${a.apellido}</strong>
            </li>
        `).join('');
    } catch (err) {
        console.error("Error al cargar amigos:", err);
    }
}

// --- 🎯 2. SELECCIONAR AMIGO Y ABRIR CHAT ---
window.seleccionarAmigo = async function(id, nombreCompleto) {
    amigoSeleccionadoId = id;
    chatHeader.innerText = `Chat con ${nombreCompleto}`;
    
    // Limpiamos la ventana y cargamos la conversación
    mensajesBody.innerHTML = '<p class="text-center">Cargando mensajes...</p>';
    await cargarMensajes();
};

// --- 💬 3. OBTENER CONVERSACIÓN (PERSONA 3) ---
async function cargarMensajes() {
    if (!amigoSeleccionadoId) return;

    try {
        // Consultamos la Tabla 7 (mensajes) filtrando por emisor y receptor
        const res = await fetch(`/api/chats/conversacion/${miId}/${amigoSeleccionadoId}`);
        const mensajes = await res.json();

        if (mensajes.length === 0) {
            mensajesBody.innerHTML = '<p class="text-muted text-center">No hay mensajes. ¡Di hola!</p>';
            return;
        }

        mensajesBody.innerHTML = mensajes.map(m => `
            <div class="msg ${m.emisor_id === miId ? 'msg-emisor' : 'msg-receptor'} card">
                <p>${m.contenido}</p>
                <small style="font-size: 0.7rem; opacity: 0.7;">
                    ${new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
            </div>
        `).join('');

        // Auto-scroll al último mensaje
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
            await cargarMensajes(); // Refrescar chat
        }
    } catch (err) {
        alert("🚨 No se pudo enviar el mensaje.");
    }
}

// --- ⌨️ EVENTOS ---
btnEnviar.addEventListener('click', enviarMensaje);
inputMsj.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarMensaje();
});

// Iniciamos la carga de amigos al abrir la página
cargarListaAmigos();