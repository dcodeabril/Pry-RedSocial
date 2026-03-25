// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE MURO DINÁMICO - VERSIÓN INDUSTRIAL SINCRONIZADA)
// ARCHIVO: public/js/publicaciones.js
// =============================================

(function() { 
    
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
                feed.innerHTML = `<p class="muro-status-msg card">⚠️ No se pudo cargar el muro personalizado.</p>`;
                return;
            }

            if (posts.length === 0) {
                feed.innerHTML = `<p class="muro-status-msg card">Tu muro está vacío. ¡Sigue a más personas! 🌐</p>`;
                return;
            }

            feed.innerHTML = '';
            
            posts.forEach(post => {
                const div = document.createElement('div');
                div.className = 'post-card card'; 
                div.id = `post-${post.id}`; 
                
                // 🛠️ ATRIBUTO CLAVE: Guardamos el ID del autor para la lógica de borrado de comentarios
                div.setAttribute('data-autor-id', post.usuario_id);

                // --- 🛡️ LÓGICA DE PERMISOS (CONDICIÓN DE AMISTAD) ---
                const puedeInteractuar = post.usuario_id == miId || post.estado_relacion === 'aceptada';

                // --- 🧠 MOTOR DE IDENTIDAD HÍBRIDA ---
                const iniciales = (post.nombre.charAt(0) + (post.apellido ? post.apellido.charAt(0) : "")).toUpperCase();
                const tieneFoto = post.foto_url && post.foto_url !== 'default.png' && post.foto_url !== 'null' && post.foto_url !== '';
                
                let avatarUI = tieneFoto 
                    ? `<img src="/uploads/perfiles/${post.foto_url}" class="post-avatar" onerror="this.src='/img/default.png';">`
                    : `<div class="post-avatar post-avatar-initial" style="background-color: ${typeof generarColorPorNombre === 'function' ? generarColorPorNombre(post.nombre) : '#3B82F6'}">
                        <span class="iniciales-text">${iniciales}</span>
                      </div>`;

                const esCompartido = post.tipo === 'compartido';
                
                const contenidoHtml = esCompartido ? `
                    <div class="post-shared-comment">${post.contenido || ''}</div>
                    <div class="shared-box">
                        <header class="shared-box-header">
                            <small class="shared-box-author">
                                <i class="fa-solid fa-retweet"></i> Publicación original de <strong>${post.nombre_original} ${post.apellido_original}</strong>
                            </small>
                        </header>
                        <div class="shared-box-content">${post.contenido_original || 'Contenido no disponible.'}</div>
                    </div>
                ` : `<div class="post-body">${post.contenido}</div>`;

                // Botones Administrativos
                const btnBorrarPost = (post.usuario_id == miId || miId == '1' || miId == '2') 
                    ? `<button onclick="eliminarPublicacion(${post.id})" class="btn-secundario btn-delete-alt"><i class="fa-solid fa-trash"></i> Eliminar</button>` : '';

                const btnReportar = (post.usuario_id != miId) 
                    ? `<button onclick="abrirReporte(${post.id})" class="btn-secundario btn-report-alt"><i class="fa-solid fa-flag"></i> Reportar</button>` : '';

                div.innerHTML = `
                    <div class="post-header-container">
                        ${avatarUI}
                        <div class="post-user-meta">
                            <strong>${post.nombre} ${post.apellido}</strong>
                            ${esCompartido ? '<span class="post-share-tag"><i class="fa-solid fa-share-nodes"></i> compartió</span>' : ''}
                            <small class="post-timestamp">${new Date(post.fecha).toLocaleString()}</small>
                        </div>
                        <div class="post-privacy-icon">
                            ${post.privacidad === 'amigos' ? '👥' : post.privacidad === 'publica' ? '🌎' : '🔒'}
                        </div>
                    </div>
                    
                    ${contenidoHtml}

                    <div class="post-stats">
                        <span><i class="fa-solid fa-heart"></i> ${post.total_likes || 0}</span>
                        <span><i class="fa-solid fa-comment"></i> ${post.total_comentarios || 0}</span>
                    </div>

                    <div class="post-footer-container">
                        <div class="post-btn-group">
                            <button class="btn-interact ${post.reaccionado ? 'active-like' : ''}" 
                                    onclick="reaccionar(${post.id}, 'like')" 
                                    ${!puedeInteractuar ? 'disabled' : ''} title="Me gusta">
                                <i class="fa-${post.reaccionado ? 'solid' : 'regular'} fa-thumbs-up"></i> Me gusta
                            </button>
                            <button class="btn-interact" 
                                    onclick="toggleComentarios(${post.id})" 
                                    ${!puedeInteractuar ? 'disabled' : ''} title="Comentar">
                                <i class="fa-regular fa-comment"></i> Comentar
                            </button>
                            <button class="btn-secundario btn-share-alt" onclick="prepararCompartir(${post.id})" title="Compartir">
                                <i class="fa-solid fa-share"></i>
                            </button>
                            <button class="btn-secundario btn-save-alt" onclick="guardarPost(${post.id})" title="Guardar en Baúl">
                                <i class="fa-solid fa-bookmark"></i>
                            </button>
                        </div>
                        <div class="post-btn-group">
                            ${btnReportar} 
                            ${btnBorrarPost}
                        </div>
                    </div>

                    <div id="comentarios-box-${post.id}" class="comments-section" style="display: none;">
                        <div id="lista-comentarios-${post.id}" class="comments-list"></div>
                        <div class="comment-input-area">
                            <input type="text" id="input-comment-${post.id}" placeholder="Escribe un comentario...">
                            <button onclick="enviarComentario(${post.id})"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                `;
                feed.appendChild(div);
            });
        } catch (err) { console.error("🚨 Error técnico:", err); }
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

    // --- 3. FUNCIONES DE INTERACCIÓN ---

    window.reaccionar = async function(postId, tipo) {
        if (!miId) return;
        try {
            await fetch('/api/publicaciones/reaccionar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicacion_id: postId, usuario_id: miId, tipo })
            });
            cargarMuro(); 
        } catch (err) { console.error(err); }
    };

    window.toggleComentarios = function(postId) {
        const box = document.getElementById(`comentarios-box-${postId}`);
        if (box.style.display === 'none') {
            box.style.display = 'block';
            cargarComentarios(postId);
        } else {
            box.style.display = 'none';
        }
    };

    // --- 💬 GESTIÓN DE COMENTARIOS (CORREGIDO CON BOTÓN DE BORRAR) ---
    async function cargarComentarios(postId) {
        const lista = document.getElementById(`lista-comentarios-${postId}`);
        if (!lista) return;

        try {
            const res = await fetch(`/api/publicaciones/comentarios/${postId}`);
            if (!res.ok) return;

            const comentarios = await res.json();
            
            // Obtenemos el ID del dueño del post desde el dataset del contenedor
            const postCard = document.getElementById(`post-${postId}`);
            const postAutorId = postCard.getAttribute('data-autor-id');

            lista.innerHTML = comentarios.length > 0 ? comentarios.map(c => {
                // Lógica visual: ¿Mostrar botón de borrar?
                const esMio = (c.usuario_id == miId);
                const soyDueñoPost = (miId == postAutorId);
                const esAdmin = (miId == '1' || miId == '2');

                const btnBorrar = (esMio || soyDueñoPost || esAdmin) 
                    ? `<button onclick="borrarComentario(${c.id}, ${postId})" class="btn-delete-comment">×</button>` 
                    : '';

                return `
                    <div class="comment-item">
                        <div class="comment-content">
                            <strong>${c.nombre}:</strong> <span>${c.contenido}</span>
                        </div>
                        ${btnBorrar}
                    </div>
                `;
            }).join('') : '<p class="muro-status-msg" style="font-size: 0.8rem; padding: 10px;">Sin comentarios aún.</p>';
        } catch (err) { console.error(err); }
    }

    window.borrarComentario = async function(commentId, postId) {
        if (!confirm("¿Eliminar este comentario?")) return;
        try {
            const res = await fetch(`/api/publicaciones/comentario/${commentId}?usuario_id=${miId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                cargarComentarios(postId); 
                cargarMuro(); // Para actualizar el contador total_comentarios
            }
        } catch (err) { console.error(err); }
    };

    window.enviarComentario = async function(postId) {
        const input = document.getElementById(`input-comment-${postId}`);
        const contenido = input.value.trim();
        if (!contenido) return;

        try {
            const res = await fetch('/api/publicaciones/comentar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicacion_id: postId, usuario_id: miId, contenido })
            });
            if (res.ok) {
                input.value = '';
                cargarComentarios(postId);
                cargarMuro();
            }
        } catch (err) { console.error(err); }
    };

    // --- 🌍 FUNCIONES GLOBALES MANTENIDAS ---

    window.guardarPost = async function(postId) {
        if (!miId) return alert("Inicia sesión para guardar tesoros.");
        try {
            const res = await fetch('/api/publicaciones/baul/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: miId, publicacion_id: postId })
            });
            if (res.ok) alert("¡Tesoro guardado en tu baúl! 💾");
        } catch (err) { console.error(err); }
    };

    window.prepararCompartir = async function(id) {
        const nota = prompt("¿Qué quieres decir sobre esta publicación? (Opcional)");
        if (nota === null) return;
        try {
            const res = await fetch('/api/publicaciones/compartir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: miId, publicacion_id: id, comentario: nota })
            });
            if (res.ok) { alert("¡Publicación compartida! 🚀"); cargarMuro(); }
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

    document.addEventListener('DOMContentLoaded', cargarMuro);

})();