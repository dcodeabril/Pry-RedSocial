// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (MOTOR DE PERFIL DINÁMICO + LÓGICA SOCIAL)
// ARCHIVO: public/js/perfil.js
// =============================================

(function() {
    const idSesionActual = localStorage.getItem('usuarioId');
    const paramsUrl = new URLSearchParams(window.location.search);
    const idPerfilDestino = paramsUrl.get('id') || idSesionActual;

    const nombreTxt = document.getElementById('perf-nombre-completo');
    const bioTxt = document.getElementById('perf-bio');
    const contenedorPosts = document.getElementById('mis-posts');
    const zonaAcciones = document.getElementById('zona-acciones-perfil');

    /**
     * LÓGICA DE AVATAR HÍBRIDO (PERFIL PRINCIPAL)
     */
    function renderizarAvatarPerfil(datos) {
        const contenedorAvatar = document.querySelector('.profile-avatar-wrapper');
        if (!contenedorAvatar) return;

        contenedorAvatar.innerHTML = '';
        const wrapperHibrido = document.createElement('div');
        wrapperHibrido.className = 'avatar-hibrido';

        const fotoValida = datos.foto_url && 
                           datos.foto_url !== 'default.png' && 
                           datos.foto_url !== 'null' && 
                           datos.foto_url !== '';

        if (fotoValida) {
            const img = document.createElement('img');
            img.src = `/uploads/perfiles/${datos.foto_url}`;
            img.className = 'avatar-img-real';
            img.onerror = () => {
                datos.foto_url = ''; 
                renderizarAvatarPerfil(datos);
            };
            wrapperHibrido.appendChild(img);
        } else {
            const iniciales = (datos.nombre.charAt(0) + (datos.apellido ? datos.apellido.charAt(0) : "")).toUpperCase();
            const div = document.createElement('div');
            div.className = 'avatar-dinamico-ui';
            div.innerHTML = `<span>${iniciales}</span>`;
            
            if (typeof generarColorPorNombre === 'function') {
                div.style.backgroundColor = generarColorPorNombre(datos.nombre);
            } else {
                div.style.backgroundColor = '#3B82F6';
            }
            wrapperHibrido.appendChild(div);
        }
        contenedorAvatar.appendChild(wrapperHibrido);
    }

    async function cargarDatosPerfil() {
        if (!idPerfilDestino) return;
        try {
            const response = await fetch(`/api/usuarios/perfil/${idPerfilDestino}`);
            const datos = await response.json();

            if (response.ok) {
                if (nombreTxt) nombreTxt.innerText = `${datos.nombre} ${datos.apellido}`;
                if (bioTxt) bioTxt.innerText = datos.bio || "¡Hola! Estoy usando Facebook Local.";
                renderizarAvatarPerfil(datos);
                gestionarBotonesSociales();
            }
        } catch (error) {
            console.error("🚨 Error crítico al cargar el perfil:", error);
        }
    }

    async function gestionarBotonesSociales() {
        if (!zonaAcciones) return;
        const rolUsuario = (localStorage.getItem('rol') || '').toLowerCase();
        
        let htmlBotones = `
            <button onclick="window.location.href='ajustes.html'" class="btn-edit-profile">
                <i class="fa-solid fa-pen"></i> Editar Perfil
            </button>
            <button class="btn-vibrant" onclick="abrirInterfazLlamada(${idPerfilDestino})">
                <i class="fa-solid fa-video"></i> Videollamada
            </button>
        `;

        if (rolUsuario === 'admin') {
            htmlBotones += `
                <button onclick="window.location.href='admin.html'" class="btn-admin-report">
                    <i class="fa-solid fa-chart-line"></i> Reportes
                </button>
            `;
        }

        if (idPerfilDestino != idSesionActual) {
            try {
                const res = await fetch(`/api/amistades/estado/${idSesionActual}/${idPerfilDestino}`);
                const relacion = await res.json();
                let botonAmistad = '';

                if (!relacion || relacion.vacio) {
                    botonAmistad = `<button onclick="enviarSolicitudAmistad(${idPerfilDestino})" class="btn-edit-profile"><i class="fa-solid fa-user-plus"></i> Agregar Amigo</button>`;
                } else if (relacion.estado === 'pendiente') {
                    if (relacion.usuario_envia_id == idSesionActual) {
                        botonAmistad = `<button class="btn-edit-profile" disabled style="opacity: 0.7;"><i class="fa-solid fa-clock"></i> Solicitud Enviada</button>`;
                    } else {
                        botonAmistad = `
                            <div style="display: flex; gap: 8px;">
                                <button onclick="responderSolicitudPerfil(${relacion.id}, 'aceptada')" class="btn-vibrant">
                                    <i class="fa-solid fa-user-check"></i> Aceptar
                                </button>
                                <button onclick="responderSolicitudPerfil(${relacion.id}, 'rechazada')" class="btn-secundario">
                                    <i class="fa-solid fa-user-xmark"></i> Rechazar
                                </button>
                            </div>
                        `;
                    }
                } else if (relacion.estado === 'aceptada') {
                    botonAmistad = `
                        <button onclick="eliminarAmistad(${idPerfilDestino})" class="btn-secundario" style="color: #ff4757; border-color: #ff4757;">
                            <i class="fa-solid fa-user-minus"></i> Eliminar Amigo
                        </button>`;
                }
                htmlBotones = botonAmistad + htmlBotones;
            } catch (err) { console.error(err); }
        }

        zonaAcciones.innerHTML = htmlBotones;
        cargarMuroUsuario();
    }

    // --- 🔒 GESTIÓN DEL MURO CON FILTRO DE PRIVACIDAD ---
    async function cargarMuroUsuario() {
        if (!contenedorPosts) return;
        try {
            // 🎯 ACTUALIZACIÓN: Enviamos 'visitanteId' como parámetro en la URL
            const res = await fetch(`/api/publicaciones/usuario/${idPerfilDestino}?visitanteId=${idSesionActual}`);
            const posts = await res.json();
            
            if (!Array.isArray(posts) || posts.length === 0) {
                contenedorPosts.innerHTML = `<div class="muro-vacio"><p>No hay historias visibles para ti en este momento. 🔒</p></div>`;
                return;
            }
            
            contenedorPosts.innerHTML = posts.map(p => `
                <div class="post-card">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #f0f2f5; padding-bottom: 10px;">
                        <small style="color: #65676b; font-weight: 500;">${new Date(p.fecha).toLocaleString()}</small>
                        <small style="color: var(--primary); font-weight: bold;">${p.privacidad.toUpperCase()}</small>
                    </div>
                    <p style="font-size: 1.1rem; color: #1c1e21; line-height: 1.5; margin: 0;">${p.contenido}</p>
                </div>`).join('');
        } catch (err) { console.error(err); }
    }

    window.enviarSolicitudAmistad = async function(idDestino) {
        try {
            const res = await fetch('/api/amistades/solicitar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_envia_id: idSesionActual, usuario_recibe_id: idDestino })
            });
            if (res.ok) { location.reload(); }
        } catch (err) { console.error(err); }
    };

    window.responderSolicitudPerfil = async function(idSolicitud, estado) {
        try {
            const res = await fetch('/api/amistades/responder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ solicitud_id: idSolicitud, nuevo_estado: estado })
            });
            if (res.ok) { location.reload(); }
        } catch (err) { console.error("Error al responder desde perfil:", err); }
    };

    window.eliminarAmistad = async function(idDestino) {
        if (!confirm("¿Estás seguro de que deseas eliminar a esta persona de tus amigos?")) return;
        
        try {
            const res = await fetch(`/api/amistades/eliminar/${idSesionActual}/${idDestino}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                location.reload(); 
            }
        } catch (err) {
            console.error("Error al eliminar amistad:", err);
        }
    };

    document.addEventListener('DOMContentLoaded', cargarDatosPerfil);
})();