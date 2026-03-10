// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE MURO DINÁMICO P2 + P4)
// ARCHIVO: publicaciones.js
// =============================================

const feed = document.getElementById('feed');
const btnPublicar = document.getElementById('btn-publicar');
// 🛡️ Identidad dinámica: Recuperamos el ID del usuario logueado
const miId = localStorage.getItem('usuarioId');

// --- 1. CARGAR POSTS DEL MURO (Con Privacidad, Borrado y Reportes) ---
async function cargarMuro() {
    if (!miId) return;

    try {
        const res = await fetch(`/api/publicaciones/${miId}`);
        const posts = await res.json();

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
            
            // 🛡️ Lógica de Control 1: Solo el dueño ve el botón de ELIMINAR
            const btnBorrarPost = (post.usuario_id == miId) 
                ? `<button onclick="eliminarPublicacion(${post.id})" class="btn-secundario" 
                    style="color: #dc3545; border-color: #dc3545; font-size: 0.8rem; margin-left: auto;">
                    Eliminar 🗑️
                   </button>` 
                : '';

            // 🛡️ Lógica de Control 2: Solo se reportan posts AJENOS
            const btnReportar = (post.usuario_id != miId) 
                ? `<button onclick="abrirReporte(${post.id})" class="btn-secundario" 
                    style="color: #ffa500; border-color: #ffa500; font-size: 0.8rem; margin-left: auto;">
                    Reportar 🚩
                   </button>` 
                : '';

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
                    
                    ${btnReportar} ${btnBorrarPost} <small style="margin-left: 10px; opacity: 0.5;">🔒 ${post.privacidad}</small>
                </div>
            `;
            feed.appendChild(div);
        });
    } catch (err) {
        console.error("🚨 Error técnico al conectar con el muro:", err);
        feed.innerHTML = '<p class="card text-center">Error de conexión con el servidor.</p>';
    }
}

// --- 2. CREAR NUEVA PUBLICACIÓN ---
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

// --- 3. REACCIONAR (Me gusta) ---
window.reaccionar = async function(postId, tipo) {
    if (!miId) return;
    try {
        await fetch('/api/publicaciones/reaccionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicacion_id: postId, usuario_id: miId, tipo: tipo })
        });
        cargarMuro(); 
    } catch (err) {
        console.error("Error al reaccionar:", err);
    }
};

// --- 4. ELIMINAR PUBLICACIÓN ---
window.eliminarPublicacion = async function(id) {
    if (!confirm("¿Deseas eliminar esta publicación permanentemente?")) return;

    try {
        const res = await fetch(`/api/publicaciones/${id}?usuario_id=${miId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            cargarMuro(); 
        } else {
            const err = await res.json();
            alert("❌ " + err.error);
        }
    } catch (err) {
        console.error("Error al conectar para borrar post:", err);
    }
};

// --- 5. [NUEVO] FUNCIÓN PARA ENVIAR REPORTE ---
window.abrirReporte = async function(postId) {
    const motivo = prompt("¿Por qué deseas reportar esta publicación?\n(Spam, Contenido Inapropiado, Acoso, etc.)");
    
    if (!motivo) return; 

    try {
        const res = await fetch('/api/reportes/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                denunciante_id: miId,
                publicacion_id: postId,
                motivo: motivo
            })
        });

        if (res.ok) {
            alert("✅ Publicación reportada con éxito. El equipo de moderación la revisará.");
        } else {
            alert("❌ No se pudo enviar el reporte.");
        }
    } catch (err) {
        console.error("Error al reportar post:", err);
    }
};

// --- 🚀 ARRANQUE INICIAL ---
cargarMuro();