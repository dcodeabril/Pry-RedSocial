// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE MURO DINÁMICO P2, P3 Y P4)
// ARCHIVO: public/js/publicaciones.js
// =============================================

const feed = document.getElementById('feed');
const btnPublicar = document.getElementById('btn-publicar');
const miId = localStorage.getItem('usuarioId');

// --- 1. CARGAR POSTS DEL MURO ---
async function cargarMuro() {
    if (!miId) return;

    try {
        const res = await fetch(`/api/publicaciones/muro/${miId}`);
        const posts = await res.json();

        if (!Array.isArray(posts)) {
            console.error("El servidor no devolvió una lista válida:", posts);
            feed.innerHTML = `<p class="card" style="text-align:center;">⚠️ No se pudo cargar el muro personalizado.</p>`;
            return;
        }

        if (posts.length === 0) {
            feed.innerHTML = `<p class="card" style="text-align:center; padding: 20px;">Tu muro está vacío. ¡Sigue a más personas para ver contenido! 🌐</p>`;
            return;
        }

        feed.innerHTML = '';
        
        posts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'post-card card';
            
            // ✅ MEJORA: ID Único para navegación desde notificaciones
            div.id = `post-${post.id}`; 
            
            div.style.marginBottom = "20px";
            div.style.transition = "background-color 1s ease"; // Para efecto de resaltado

            const btnBorrarPost = (post.usuario_id == miId) 
                ? `<button onclick="eliminarPublicacion(${post.id})" class="btn-secundario" 
                    style="color: #dc3545; border-color: #dc3545; font-size: 0.8rem; margin-left: auto;">
                    Eliminar 🗑️
                   </button>` 
                : '';

            const btnReportar = (post.usuario_id != miId) 
                ? `<button onclick="abrirReporte(${post.id})" class="btn-secundario" 
                    style="color: #ffa500; border-color: #ffa500; font-size: 0.8rem; margin-left: auto;">
                    Reportar 🚩
                   </button>` 
                : '';

            div.innerHTML = `
                <div class="post-header" style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <img src="img/${post.foto_url || 'default.png'}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                    <div style="flex-grow: 1;">
                        <strong>${post.nombre} ${post.apellido}</strong>
                        <small style="display: block; opacity: 0.6;">${new Date(post.fecha).toLocaleString()}</small>
                    </div>
                    <small title="Privacidad" style="opacity: 0.5;">${post.privacidad === 'amigos' ? '👥' : post.privacidad === 'publica' ? '🌎' : '🔒'}</small>
                </div>
                <div class="post-body" style="font-size: 1.1rem; margin-bottom: 15px; line-height: 1.4;">
                    ${post.contenido}
                </div>
                <div class="post-footer" style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 10px; align-items: center; flex-wrap: wrap;">
                    <button class="btn-secundario" onclick="reaccionar(${post.id}, 'like')">👍 Me gusta</button>
                    <button class="btn-secundario" onclick="abrirComentarios(${post.id})">💬 Comentar</button>
                    
                    <button class="btn-secundario" onclick="guardarPost(${post.id})" style="color: #ffc107; border-color: #ffc107;">
                        💾 Guardar
                    </button>
                    
                    ${btnReportar} ${btnBorrarPost}
                </div>
            `;
            feed.appendChild(div);
        });

        // ✅ REVISAR ANCLA: Si venimos de una notificación, resaltamos el post
        if (window.location.hash) {
            const idAncla = window.location.hash.substring(1);
            const elemento = document.getElementById(idAncla);
            if (elemento) {
                setTimeout(() => {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    elemento.style.backgroundColor = "var(--bg-highlight, #fff9c4)";
                    setTimeout(() => elemento.style.backgroundColor = "transparent", 2000);
                }, 500);
            }
        }

    } catch (err) {
        console.error("🚨 Error técnico al cargar el muro:", err);
    }
}

// --- 2. CREAR NUEVA PUBLICACIÓN ---
if (btnPublicar) {
    btnPublicar.addEventListener('click', async () => {
        const inputContenido = document.getElementById('post-contenido');
        const privacidad = document.getElementById('post-privacidad').value;
        const contenido = inputContenido.value.trim();
        
        if (!contenido || !miId) {
            alert("⚠️ Escribe algo antes de publicar.");
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
                cargarMuro(); 
            } else {
                alert("❌ Error al publicar.");
            }
        } catch (err) {
            console.error("Error al enviar post:", err);
        }
    });
}

// --- 3. REACCIONAR (Me gusta) ---
window.reaccionar = async function(postId, tipo) {
    if (!miId) return;
    try {
        const res = await fetch('/api/publicaciones/reaccionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicacion_id: postId, usuario_id: miId, tipo: tipo })
        });
        
        if (res.status === 403) {
            alert("🚫 No puedes reaccionar debido a un bloqueo de privacidad.");
        } else {
            cargarMuro(); 
        }
    } catch (err) { console.error("Error al reaccionar:", err); }
};

// --- 4. ELIMINAR PUBLICACIÓN ---
window.eliminarPublicacion = async function(id) {
    if (!confirm("¿Deseas eliminar esta publicación permanentemente?")) return;
    try {
        const res = await fetch(`/api/publicaciones/${id}?usuario_id=${miId}`, { method: 'DELETE' });
        if (res.ok) cargarMuro(); 
    } catch (err) { console.error("Error al borrar post:", err); }
};

// --- 5. REPORTAR CONTENIDO ---
window.abrirReporte = async function(postId) {
    const motivo = prompt("¿Por qué deseas reportar esta publicación?");
    if (!motivo) return; 

    try {
        const res = await fetch('/api/reportes/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ denunciante_id: miId, publicacion_id: postId, motivo: motivo })
        });
        if (res.ok) alert("✅ Reporte enviado al Arquitecto Israel Díaz.");
    } catch (err) { console.error("Error al reportar post:", err); }
};

// --- 💾 6. FUNCIÓN PARA GUARDAR EN EL BAÚL ---
window.guardarPost = async function(postId) {
    if (!miId) return;
    try {
        const res = await fetch('/api/publicaciones/guardar-tesoro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: miId, publicacion_id: postId })
        });
        if (res.ok) alert("¡Tesoro guardado! 💾");
    } catch (err) { console.error("Error al guardar tesoro:", err); }
};

// --- 🚀 ARRANQUE INICIAL ---
document.addEventListener('DOMContentLoaded', cargarMuro);