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
            div.id = `post-${post.id}`; 
            div.style.marginBottom = "20px";
            div.style.transition = "background-color 1s ease";

            // ✅ LÓGICA DE RENDERIZADO PARA COMPARTIDOS (#7)
            const esCompartido = post.tipo === 'compartido';
            
            const contenidoHtml = esCompartido ? `
                <div class="post-comentario-compartido" style="margin-bottom: 10px; font-weight: 500; font-size: 1.1rem;">
                    ${post.contenido || ''}
                </div>
                <div class="shared-box" style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; background: rgba(0,0,0,0.03); margin-top: 5px; border-left: 4px solid var(--primary);">
                    <header style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 5px;">
                        <small style="opacity: 0.8;">Publicación original de <strong>${post.nombre_original} ${post.apellido_original}</strong></small>
                    </header>
                    <div style="font-size: 1rem; line-height: 1.4; opacity: 0.9;">
                        ${post.contenido_original || 'Contenido no disponible.'}
                    </div>
                </div>
            ` : `
                <div class="post-body" style="font-size: 1.1rem; margin-bottom: 15px; line-height: 1.4;">
                    ${post.contenido}
                </div>
            `;

            // ✅ DETERMINACIÓN DE BOTONES (Lógica de Dueño/Admin)
            // Permitimos borrar si es dueño o si el usuario logueado es el Admin (ID 1)
            const btnBorrarPost = (post.usuario_id == miId || miId == '1') 
                ? `<button onclick="eliminarPublicacion(${post.id})" class="btn-secundario" style="color: #dc3545; border-color: #dc3545; font-size: 0.8rem;">Eliminar 🗑️</button>` 
                : '';

            const btnReportar = (post.usuario_id != miId) 
                ? `<button onclick="abrirReporte(${post.id})" class="btn-secundario" style="color: #ffa500; border-color: #ffa500; font-size: 0.8rem;">Reportar 🚩</button>` 
                : '';

            div.innerHTML = `
                <div class="post-header" style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <img src="img/${post.foto_url || 'default.png'}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                    <div style="flex-grow: 1;">
                        <strong>${post.nombre} ${post.apellido}</strong>
                        ${esCompartido ? '<span style="color:var(--primary); font-size:0.8rem; font-weight:bold; margin-left:5px;">🔄 compartió</span>' : ''}
                        <small style="display: block; opacity: 0.6;">${new Date(post.fecha).toLocaleString()}</small>
                    </div>
                    <small title="Privacidad" style="opacity: 0.5;">${post.privacidad === 'amigos' ? '👥' : post.privacidad === 'publica' ? '🌎' : '🔒'}</small>
                </div>
                
                ${contenidoHtml}

                <div class="post-footer" style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 10px;">
                    
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-secundario" onclick="reaccionar(${post.id}, 'like')" title="Me gusta">👍</button>
                        <button class="btn-secundario" onclick="abrirComentarios(${post.id})" title="Comentar">💬</button>
                        <button class="btn-secundario" onclick="prepararCompartir(${post.id})" style="color: var(--primary); border-color: var(--primary);" title="Compartir">🔄</button>
                        <button class="btn-secundario" onclick="guardarPost(${post.id})" style="color: #ffc107; border-color: #ffc107;" title="Guardar">💾</button>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        ${btnReportar} 
                        ${btnBorrarPost}
                    </div>
                </div>
            `;
            feed.appendChild(div);
        });

        // Lógica de resaltado por ancla
        if (window.location.hash) {
            const idAncla = window.location.hash.substring(1);
            const elemento = document.getElementById(idAncla);
            if (elemento) {
                setTimeout(() => {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    elemento.style.backgroundColor = "#fff9c4";
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
                body: JSON.stringify({ usuario_id: miId, contenido, privacidad })
            });

            if (res.ok) {
                inputContenido.value = '';
                cargarMuro(); 
            }
        } catch (err) { console.error(err); }
    });
}

// --- 3. 🔄 FUNCIÓN MAESTRA: COMPARTIR (#7) ---
window.prepararCompartir = async function(id) {
    const nota = prompt("¿Qué quieres decir sobre esta publicación? (Opcional)");
    if (nota === null) return;

    try {
        const res = await fetch('/api/publicaciones/compartir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: miId,
                publicacion_id: id,
                comentario: nota
            })
        });

        if (res.ok) {
            alert("¡Publicación compartida en tu muro! 🚀");
            cargarMuro();
        } else {
            alert("❌ No se pudo compartir la publicación.");
        }
    } catch (err) {
        console.error("Error al compartir:", err);
    }
};

// --- RESTO DE FUNCIONES ---
window.reaccionar = async function(postId, tipo) {
    if (!miId) return;
    try {
        const res = await fetch('/api/publicaciones/reaccionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicacion_id: postId, usuario_id: miId, tipo })
        });
        if (res.status === 403) alert("🚫 Bloqueo de privacidad.");
        else cargarMuro(); 
    } catch (err) { console.error(err); }
};

window.eliminarPublicacion = async function(id) {
    if (!confirm("¿Deseas eliminar esta publicación?")) return;
    try {
        const res = await fetch(`/api/publicaciones/${id}?usuario_id=${miId}`, { method: 'DELETE' });
        if (res.ok) cargarMuro(); 
    } catch (err) { console.error(err); }
};

window.abrirReporte = async function(postId) {
    const motivo = prompt("¿Motivo del reporte?");
    if (!motivo) return; 
    try {
        const res = await fetch('/api/reportes/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ denunciante_id: miId, publicacion_id: postId, motivo })
        });
        if (res.ok) alert("✅ Reporte enviado al Administrador.");
    } catch (err) { console.error(err); }
};

window.guardarPost = async function(postId) {
    if (!miId) return;
    try {
        const res = await fetch('/api/publicaciones/guardar-tesoro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: miId, publicacion_id: postId })
        });
        if (res.ok) alert("¡Tesoro guardado! 💾");
    } catch (err) { console.error(err); }
};

document.addEventListener('DOMContentLoaded', cargarMuro);