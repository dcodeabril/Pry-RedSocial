// public/js/mensajes.js
const listaAmigos = document.getElementById('lista-amigos');
const mensajesBody = document.getElementById('mensajes-body');
const inputMsj = document.getElementById('input-msj');
const btnEnviar = document.getElementById('btn-enviar');
const chatHeader = document.getElementById('chat-header');

let amigoSeleccionadoId = null;
const miId = 1; // ID temporal de Diego (Arquitecto)

// 1. Cargar lista de amigos
async function cargarListaAmigos() {
    const res = await fetch(`/api/amistades/${miId}`);
    const amigos = await res.json();
    listaAmigos.innerHTML = amigos.map(a => `
        <li onclick="seleccionarAmigo(${a.usuario_id}, '${a.nombre} ${a.apellido}')" style="cursor:pointer; padding:10px; border-bottom:1px solid #eee;">
            ${a.nombre} ${a.apellido}
        </li>
    `).join('');
}

// 2. Seleccionar amigo y cargar chat
async function seleccionarAmigo(id, nombre) {
    amigoSeleccionadoId = id;
    chatHeader.innerText = `Chat con ${nombre}`;
    cargarMensajes();
}

// 3. Obtener mensajes de la DB
async function cargarMensajes() {
    if (!amigoSeleccionadoId) return;
    const res = await fetch(`/api/chats/${miId}/${amigoSeleccionadoId}`);
    const mensajes = await res.json();
    mensajesBody.innerHTML = mensajes.map(m => `
        <div class="${m.emisor_id === miId ? 'msg-emisor' : 'msg-receptor'}">
            <p>${m.contenido}</p>
        </div>
    `).join('');
    mensajesBody.scrollTop = mensajesBody.scrollHeight;
}

// 4. Enviar mensaje
btnEnviar.addEventListener('click', async () => {
    const contenido = inputMsj.value;
    if (!contenido || !amigoSeleccionadoId) return;

    await fetch('/api/chats/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emisor_id: miId, receptor_id: amigoSeleccionadoId, contenido })
    });

    inputMsj.value = '';
    cargarMensajes();
});

cargarListaAmigos();