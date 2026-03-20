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

                // --- 🧠 LÓGICA DE AVATAR DINÁMICO (SRAEL UI) ---
                const iniciales = (post.nombre.charAt(0) + post.apellido.charAt(0)).toUpperCase();
                const avatarUI = (post.foto_url && post.foto_url !== 'default.png' && post.foto_url !== 'null')
                    ? `<img src="/img/${post.foto_url}" class="post-avatar" onerror="this.onerror=null; this.src='/img/default.png';">`
                    : `<div class="avatar-dinamico-nav post-avatar" style="width: 45px; height: 45px; margin-right: 15px; flex-shrink: 0; background: linear-gradient(135deg, var(--primary), var(--primary-dark));">
                           <span class="iniciales-text" style="font-size: 1.1rem; color: white; font-weight: 800;">${iniciales}</span>
                       </div>`;

                const esCompartido = post.tipo === 'compartido';
                
                // --- 🧱 CONSTRUCCIÓN DINÁMICA DEL CONTENIDO ---
                const contenidoHtml = esCompartido ? `
                    <div class="post-shared-comment">
                        ${post.contenido || ''}
                    </div>
                    <div class="shared-box">
                        <header class="shared-box-header">
                            <small class="shared-box-author">
                                <i class="fa-solid fa-retweet"></i> Publicación original de <strong>${post.nombre_original} ${post.apellido_original}</strong>
                            </small>
                        </header>
                        <div class="shared-box-content">
                            ${post.contenido_original || 'Contenido no disponible.'}
                        </div>
                    </div>
                ` : `
                    <div class="post-body">
                        ${post.contenido}
                    </div>
                `;

                // Botones Administrativos (Michelle ID 2 tiene poder total)
                const btnBorrarPost = (post.usuario_id == miId || miId == '1' || miId == '2') 
                    ? `<button onclick="eliminarPublicacion(${post.id})" class="btn-secundario btn-delete-alt"><i class="fa-solid fa-trash"></i> Eliminar</button>` 
                    : '';

                const btnReportar = (post.usuario_id != miId) 
                    ? `<button onclick="abrirReporte(${post.id})" class="btn-secundario btn-report-alt"><i class="fa-solid fa-flag"></i> Reportar</button>` 
                    : '';

                div.innerHTML = `
                    <div class="post-header-container">
                        ${avatarUI}
                        <div class="post-user-meta">
                            <strong>${post.nombre} ${post.apellido}</strong>
                            ${esCompartido ? '<span class="post-share-tag"><i class="fa-solid fa-share-nodes"></i> compartió</span>' : ''}
                            <small class="post-timestamp">${new Date(post.fecha).toLocaleString()}</small>
                        </div>
                        <div class="post-privacy-icon" title="Privacidad">
                            ${post.privacidad === 'amigos' ? '👥' : post.privacidad === 'publica' ? '🌎' : '🔒'}
                        </div>
                    </div>
                    
                    ${contenidoHtml}

                    <div class="post-footer-container">
                        <div class="post-btn-group">
                            <button class="btn-secundario" onclick="reaccionar(${post.id}, 'like')" title="Me gusta">
                                <i class="fa-solid fa-thumbs-up"></i>
                            </button>
                            <button class="btn-secundario" onclick="abrirComentarios(${post.id})" title="Comentar">
                                <i class="fa-solid fa-comment"></i>
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
                `;
                feed.appendChild(div);
            });

            // Lógica de resaltado (Notificaciones)
            if (window.location.hash) {
                const idAncla = window.location.hash.substring(1);
                const elemento = document.getElementById(idAncla);
                if (elemento) {
                    setTimeout(() => {
                        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        elemento.classList.add('post-highlight');
                        setTimeout(() => elemento.classList.remove('post-highlight'), 3000);
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

    // --- 3. 🌍 FUNCIONES GLOBALES ---

    window.guardarPost = async function(postId) {
        if (!miId) return alert("Inicia sesión para guardar tesoros.");
        
        try {
            const res = await fetch('/api/publicaciones/baul/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: miId, publicacion_id: postId })
            });

            if (res.ok) {
                alert("¡Tesoro guardado en tu baúl! 💾");
            } else {
                alert("❌ No se pudo guardar el tesoro.");
            }
        } catch (err) { 
            console.error("🚨 Error al guardar en baúl:", err); 
        }
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
            else { alert("❌ No se pudo compartir."); }
        } catch (err) { console.error(err); }
    };

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