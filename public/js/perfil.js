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
    const fotoImg = document.getElementById('perf-foto');
    const contenedorPosts = document.getElementById('mis-posts');
    const zonaAcciones = document.getElementById('zona-acciones-perfil');

    async function cargarDatosPerfil() {
        if (!idPerfilDestino) return;

        try {
            const response = await fetch(`/api/usuarios/perfil/${idPerfilDestino}`);
            const datos = await response.json();

            if (response.ok) {
                if (nombreTxt) nombreTxt.innerText = `${datos.nombre} ${datos.apellido}`;
                if (bioTxt) bioTxt.innerText = datos.bio || "¡Hola! Estoy usando Facebook Local.";
                
                if (fotoImg) {
                    const rutaFoto = (datos.foto_url && datos.foto_url !== 'default.png') 
                                    ? `/img/${datos.foto_url}` 
                                    : '/img/default.png'; 
                    fotoImg.src = rutaFoto;
                    
                    fotoImg.onerror = () => { 
                        fotoImg.src = `https://ui-avatars.com/api/?name=${datos.nombre}&background=0D8ABC&color=fff`; 
                    };
                }

                // Iniciamos la construcción de la botonera
                gestionarBotonesSociales();
            }
        } catch (error) {
            console.error("🚨 Error crítico al cargar el perfil:", error);
        }
    }

    async function gestionarBotonesSociales() {
        if (!zonaAcciones) return;

        const rolUsuario = (localStorage.getItem('rol') || '').toLowerCase();
        
        // 1. 🧱 BOTONES BASE (Visibles para todos: Normales y Admins)
        let htmlBotones = `
            <button onclick="window.location.href='ajustes.html'" class="btn-edit-profile">
                <i class="fa-solid fa-pen"></i> Editar Perfil
            </button>
            <button class="btn-vibrant" onclick="abrirInterfazLlamada(${idPerfilDestino})">
                <i class="fa-solid fa-video"></i> Videollamada
            </button>
        `;

        // 2. 🛡️ BOTÓN ADMIN (Solo si el rol es administrador)
        if (rolUsuario === 'admin') {
            htmlBotones += `
                <button onclick="window.location.href='admin.html'" class="btn-admin-report">
                    <i class="fa-solid fa-chart-line"></i> Reportes
                </button>
            `;
        }

        // 3. 🤝 LÓGICA DE AMISTAD (Solo si no es mi propio perfil)
        if (idPerfilDestino != idSesionActual) {
            try {
                const res = await fetch(`/api/amistades/estado/${idSesionActual}/${idPerfilDestino}`);
                const relacion = await res.json();

                let botonAmistad = '';
                
                // Caso A: No hay relación previa
                if (!relacion || relacion.vacio) {
                    botonAmistad = `
                        <button onclick="enviarSolicitudAmistad(${idPerfilDestino})" class="btn-edit-profile">
                            <i class="fa-solid fa-user-plus"></i> Agregar Amigo
                        </button>
                    `;
                } 
                // Caso B: Solicitud en espera
                else if (relacion.estado === 'pendiente') {
                    botonAmistad = `
                        <button class="btn-edit-profile" disabled style="opacity: 0.7;">
                            <i class="fa-solid fa-clock"></i> Solicitud Enviada
                        </button>
                    `;
                } 
                // Caso C: Ya son amigos (Estilo verde)
                else if (relacion.estado === 'aceptada') {
                    botonAmistad = `
                        <button class="btn-edit-profile" style="background-color: #e4e6eb; color: #28a745;">
                            <i class="fa-solid fa-check-double"></i> Amigos
                        </button>
                    `;
                }

                // El botón de amistad se coloca primero en la fila
                htmlBotones = botonAmistad + htmlBotones;

            } catch (err) {
                console.error("Error al consultar estado de amistad:", err);
            }
        }

        // Inyectamos todo el bloque final
        zonaAcciones.innerHTML = htmlBotones;
        cargarMuroUsuario();
    }

    async function cargarMuroUsuario() {
        if (!contenedorPosts) return;

        try {
            const res = await fetch(`/api/publicaciones/usuario/${idPerfilDestino}`);
            const posts = await res.json();

            if (posts.length === 0) {
                contenedorPosts.innerHTML = `
                    <div class="muro-vacio">
                        <p>No hay historias para mostrar todavía.</p>
                    </div>`;
                return;
            }

            contenedorPosts.innerHTML = posts.map(p => `
                <div class="post-card">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #f0f2f5; padding-bottom: 10px;">
                        <small style="color: #65676b; font-weight: 500;">${new Date(p.fecha).toLocaleString()}</small>
                        <small style="color: var(--primary); font-weight: bold;">${p.privacidad.toUpperCase()}</small>
                    </div>
                    <p style="font-size: 1.1rem; color: #1c1e21; line-height: 1.5; margin: 0;">${p.contenido}</p>
                </div>
            `).join('');
        } catch (err) {
            console.error("Error al cargar posts:", err);
        }
    }

    // Funciones globales
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

    window.bloquearEsteUsuario = async function(idABloquear) {
        if (!confirm("¿Deseas bloquear a este usuario de forma permanente? 🚫")) return;
        try {
            const res = await fetch('/api/bloqueos/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: idSesionActual, usuario_bloqueado_id: idABloquear })
            });
            if (res.ok) { window.location.href = 'index.html'; }
        } catch (err) { console.error(err); }
    };

    document.addEventListener('DOMContentLoaded', cargarDatosPerfil);
})();