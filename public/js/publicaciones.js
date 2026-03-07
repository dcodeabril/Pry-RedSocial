// public/js/publicaciones.js
const feed = document.getElementById('feed');
const btnPublicar = document.getElementById('btn-publicar');

// Cargar posts al iniciar
async function cargarMuro() {
    const res = await fetch('/api/publicaciones');
    const posts = await res.json();
    
    feed.innerHTML = '';
    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post-card';
        div.innerHTML = `
            <div class="post-header">
                <strong>${post.nombre} ${post.apellido}</strong>
                <span>${new Date(post.fecha).toLocaleString()}</span>
            </div>
            <div class="post-body">${post.contenido}</div>
            <div class="post-footer">
                <button onclick="reaccionar(${post.id}, 'like')">👍 Me gusta</button>
                <button>💬 Comentar</button>
                <button>↪️ Compartir</button>
            </div>
        `;
        feed.appendChild(div);
    });
}

btnPublicar.addEventListener('click', async () => {
    const contenido = document.getElementById('post-contenido').value;
    const privacidad = document.getElementById('post-privacidad').value;
    
    await fetch('/api/publicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usuario_id: 1, // ID temporal del Arquitecto
            contenido,
            privacidad
        })
    });
    
    document.getElementById('post-contenido').value = '';
    cargarMuro();
});

cargarMuro();
// Función para REACCIONAR (Me gusta)
async function reaccionar(postId, tipo) {
    const usuarioId = 1; // ID temporal de Diego (Arquitecto)
    try {
        await fetch('/api/publicaciones/reaccionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicacion_id: postId, usuario_id: usuarioId, tipo })
        });
        cargarMuro(); // Refrescar para ver cambios
    } catch (err) {
        console.error("Error al reaccionar");
    }
}

// Función para COMENTAR
async function enviarComentario(postId) {
    const input = document.getElementById(`input-comentario-${postId}`);
    const contenido = input.value;
    const usuarioId = 1;

    if (!contenido) return;

    await fetch('/api/publicaciones/comentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicacion_id: postId, usuario_id: usuarioId, contenido })
    });

    input.value = '';
    cargarMuro();
}