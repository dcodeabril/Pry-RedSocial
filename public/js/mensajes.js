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

// --- 👥 1. CARGAR LISTA DE CONTACTOS (Amigos Aceptados) ---
async function cargarListaAmigos() {
    if (!miId) return;
    try {
        const res = await fetch(`/api/amistades/lista/${miId}`);
        const amigos = await res.json();
        
        if (amigos.length === 0) {
            listaAmigos.innerHTML = '<li class="text-muted" style="padding:15px;">Aún no tienes amigos aceptados. 🌐</li>';
            return;
        }

        listaAmigos.innerHTML = amigos.map(a => `
            <li class="amigo-item card" 
                id="item-amigo-${a.usuario_id}"
                style="cursor:pointer; margin-bottom:10px; padding:10px; transition: 0.3s;"
                onclick="seleccionarAmigo(${a.usuario_id}, '${a.nombre} ${a.apellido}')">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${a.foto_url || 'img/default.png'}" style="width:35px; height:35px; border-radius:50%; object-fit:cover;">
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

    // ✅ ACTUALIZACIÓN: Cabecera dinámica con botón de Videollamada (#11)
    chatHeader.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding-right: 10px;">
            <span>Chat con <strong>${nombreCompleto}</strong></span>
            <div class="chat-header-actions">
                <span onclick="abrirInterfazLlamada(${id})" 
                      style="cursor:pointer; font-size:1.5rem; transition: transform 0.2s;" 
                      title="Iniciar Videollamada"
                      onmouseover="this.style.transform='scale(1.2)'" 
                      onmouseout="this.style.transform='scale(1)'">📹</span>
            </div>
        </div>
    `;
    
    // Resaltar visualmente en la lista
    document.querySelectorAll('.amigo-item').forEach(el => el.style.background = 'white');
    const itemActivo = document.getElementById(`item-amigo-${id}`);
    if (itemActivo) itemActivo.style.background = '#e7f3ff';

    cargarMensajes();
};

// --- 💬 3. OBTENER CONVERSACIÓN ---
async function cargarMensajes() {
    if (!amigoSeleccionadoId) return;

    try {
        const res = await fetch(`/api/chats/conversacion/${miId}/${amigoSeleccionadoId}`);
        const mensajes = await res.json();

        if (mensajes.length === 0) {
            mensajesBody.innerHTML = '<p class="text-muted text-center" style="margin-top:20px;">No hay mensajes. ¡Di hola! 👋</p>';
            return;
        }

        mensajesBody.innerHTML = mensajes.map(m => `
            <div class="msg ${m.emisor_id === miId ? 'msg-emisor' : 'msg-receptor'}" 
                 style="display: flex; flex-direction: column; margin-bottom: 15px;
                        align-items: ${m.emisor_id === miId ? 'flex-end' : 'flex-start'};">
                
                <div class="card" style="padding: 10px 15px; border-radius: 18px; max-width: 75%;
                                       background: ${m.emisor_id === miId ? 'var(--primary)' : '#f0f2f5'};
                                       color: ${m.emisor_id === miId ? 'white' : 'black'};
                                       border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <p style="margin:0;">${m.contenido}</p>
                </div>
                
                <small style="font-size: 0.65rem; opacity: 0.6; margin-top: 4px; padding: 0 5px;">
                    ${new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
            </div>
        `).join('');

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

// Iniciamos la carga de amigos
cargarListaAmigos();