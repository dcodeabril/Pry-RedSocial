// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE MURO CON PRIVACIDAD P2)
// ARCHIVO: publicaciones.js
// =============================================

const feed = document.getElementById('feed');
const btnPublicar = document.getElementById('btn-publicar');
// 🛡️ Identidad dinámica: Recuperamos el ID del usuario logueado
const miId = localStorage.getItem('usuarioId');

// --- 1. CARGAR POSTS DEL MURO (Con filtro de Visor) ---
async function cargarMuro() {
    // Si no hay ID, el Guardia ya debería haber actuado, pero protegemos la función
    if (!miId) return;

    try {
        // 🛡️ Enviamos nuestro ID en la URL para que el servidor aplique las reglas de privacidad
        const res = await fetch(`/api/publicaciones/${miId}`);
        const posts = await res.json();

        // Blindaje: Verificamos que sea una lista antes de procesar
        if (!Array.isArray(posts)) {
            console.error("El servidor no devolvió una lista válida:", posts);
            feed.innerHTML = `<p class="card" style="text-align:center;">⚠️ No se pudo cargar el muro personalizado.</p>`;
            return;
        }

        feed.innerHTML = '';
        
        posts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'post-card card';
            div.style.marginBottom = "20px";
            
            div.innerHTML = `
                <div class="post-header" style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong>${post.nombre} ${post.apellido}</strong>
                    <span style="font-size: 0.8rem; opacity: 0.6; float: right;">
                        ${new Date(post.fecha_creacion || post.fecha).toLocaleString()}
                    </span>
                </div>
                <div class="post-body" style="font-size: 1.1rem; margin-bottom: 15px;">
                    ${post.contenido}
                </div>
                <div class="post-footer" style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 10px; align-items: center;">
                    <button class="btn-secundario" onclick="reaccionar(${post.id}, 'like')">👍 Me gusta</button>
                    <button class="btn-secundario">💬 Comentar</button>
                    <button class="btn-secundario">↪️ Compartir</button>
                    <small style="margin-left: auto; opacity: 0.5;">🔒 ${post.privacidad}</small>
                </div>
            `;
            feed.appendChild(div);
        });
    } catch (err) {
        console.error("🚨 Error técnico al conectar con el muro filtrado:", err);
        feed.innerHTML = '<p class="card text-center">Error de conexión con el servidor.</p>';
    }
}

// --- 2. CREAR NUEVA PUBLICACIÓN ---
btnPublicar.addEventListener('click', async () => {
    const inputContenido = document.getElementById('post-contenido');
    const privacidad = document.getElementById('post-privacidad').value;
    const contenido = inputContenido.value.trim();
    
    if (!contenido || !miId) {
        alert("⚠️ El Arquitecto sugiere escribir algo antes de publicar.");
        return;
    }

    try {
        const res = await fetch('/api/publicaciones/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: miId,
                contenido: contenido,
                privacidad: privacidad
            })
        });

        if (res.ok) {
            inputContenido.value = '';
            cargarMuro(); // Recarga el muro respetando el nuevo post
        } else {
            alert("❌ Error al publicar.");
        }
    } catch (err) {
        console.error("Error al enviar post:", err);
    }
});

// --- 3. REACCIONAR (Me gusta) ---
window.reaccionar = async function(postId, tipo) {
    if (!miId) return;
    try {
        await fetch('/api/publicaciones/reaccionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                publicacion_id: postId, 
                usuario_id: miId, 
                tipo: tipo 
            })
        });
        cargarMuro(); 
    } catch (err) {
        console.error("Error al reaccionar:", err);
    }
};

// --- 🚀 ARRANQUE INICIAL ---
cargarMuro();