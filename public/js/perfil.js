// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (MOTOR DE PERFIL DINÁMICO #13 + VIDEOLLAMADA #11)
// ARCHIVO: public/js/perfil.js
// =============================================

(function() {
    // 🛡️ Variables Privadas: Extraemos los IDs de la sesión y de la URL
    const idSesionActual = localStorage.getItem('usuarioId');
    const paramsUrl = new URLSearchParams(window.location.search);
    
    // Si no hay ID en la URL, por defecto es el mío. Esto evita perfiles cruzados.
    const idPerfilDestino = paramsUrl.get('id') || idSesionActual;

    // Elementos de la Interfaz
    const nombreTxt = document.getElementById('perf-nombre-completo');
    const bioTxt = document.getElementById('perf-bio');
    const fotoImg = document.getElementById('perf-foto');
    const contenedorPosts = document.getElementById('mis-posts');
    const zonaAcciones = document.getElementById('zona-acciones-perfil');

    /**
     * 1. Carga la identidad del perfil (Nombre, Bio, Foto)
     */
    async function cargarDatosPerfil() {
        if (!idPerfilDestino) return;

        try {
            console.log("👤 Solicitando perfil para el ID:", idPerfilDestino);
            const response = await fetch(`/api/usuarios/perfil/${idPerfilDestino}`);
            const datos = await response.json();

            if (response.ok) {
                if (nombreTxt) nombreTxt.innerText = `${datos.nombre} ${datos.apellido}`;
                if (bioTxt) bioTxt.innerText = datos.bio || "¡Hola! Estoy usando Facebook Local.";
                
                if (fotoImg) {
                    fotoImg.src = datos.foto_url && datos.foto_url !== 'default.png' 
                                  ? `img/${datos.foto_url}` 
                                  : 'img/default.png';
                }

                // Generamos los botones dinámicos
                gestionarBotonesSociales();
                // Cargamos solo los posts de este usuario
                cargarMuroUsuario();
            }
        } catch (error) {
            console.error("🚨 Error crítico al cargar el perfil:", error);
        }
    }

    /**
     * 2. Lógica de Botones: Videollamada y Mensajería Dinámica
     */
    async function gestionarBotonesSociales() {
        if (!zonaAcciones) return;

        // Comparamos IDs como Strings para evitar fallos de tipo
        if (String(idPerfilDestino) === String(idSesionActual)) {
            // Caso: Es mi perfil. Solo muestro ajustes.
            zonaAcciones.innerHTML = `
                <button onclick="window.location.href='ajustes.html'" class="btn-secundario">
                    ⚙️ Editar Perfil
                </button>
            `;
        } else {
            // Caso: Visitante. Mostramos herramientas de comunicación.
            try {
                const resAmistad = await fetch(`/api/amistades/estado/${idSesionActual}/${idPerfilDestino}`);
                const relacion = await resAmistad.json();

                let botonAmistad = '';
                if (!relacion || relacion.vacio) {
                    botonAmistad = `<button onclick="enviarSolicitudAmistad(${idPerfilDestino})" class="btn-primario">Agregar Amigo ➕</button>`;
                } else if (relacion.estado === 'pendiente') {
                    botonAmistad = `<button class="btn-secundario" style="background: #ccc; cursor: not-allowed;" disabled>Solicitud Enviada ⏳</button>`;
                } else if (relacion.estado === 'aceptada') {
                    botonAmistad = `<button class="btn-secundario" style="background: #28a745; color: white; cursor: default;" disabled>Amigos ✅</button>`;
                }

                // ✅ RENDERIZADO FINAL: Todos los botones usan idPerfilDestino
                zonaAcciones.innerHTML = `
                    ${botonAmistad}
                    
                    <button class="btn-primario" 
                            onclick="window.location.href='mensajes.html?id=${idPerfilDestino}'" 
                            style="background: #e4e6eb; color: black; margin-left: 10px;">
                        Enviar Mensaje 💬
                    </button>
                    
                    <button class="btn-primario" 
                            onclick="abrirInterfazLlamada(${idPerfilDestino})" 
                            style="background: var(--primary); color: white; margin-left: 10px;">
                        📞 Videollamada
                    </button>

                    <button onclick="bloquearEsteUsuario(${idPerfilDestino})" class="btn-secundario" 
                            style="color: #dc3545; border-color: #dc3545; margin-left: auto;">
                        Bloquear 🚫
                    </button>
                `;
            } catch (err) {
                console.error("Error en lógica de botones sociales:", err);
            }
        }
    }

    /**
     * 3. Muro de usuario filtrado
     */
    async function cargarMuroUsuario() {
        if (!contenedorPosts) return;

        try {
            const res = await fetch(`/api/publicaciones/usuario/${idPerfilDestino}`);
            const posts = await res.json();

            if (posts.length === 0) {
                contenedorPosts.innerHTML = `<div class="card" style="text-align: center; padding: 20px; opacity: 0.6;"><p>No hay historias para mostrar.</p></div>`;
                return;
            }

            contenedorPosts.innerHTML = posts.map(p => `
                <div class="card post-card" style="margin-bottom: 15px;">
                    <div style="border-bottom: 1px solid var(--border-color); margin-bottom: 10px; padding-bottom: 5px; display: flex; justify-content: space-between;">
                        <small style="color: var(--text-muted);">${new Date(p.fecha).toLocaleString()}</small>
                        <small style="font-weight: bold; color: var(--primary);">${p.privacidad.toUpperCase()}</small>
                    </div>
                    <p style="font-size: 1.1rem; margin: 10px 0;">${p.contenido}</p>
                </div>
            `).join('');
        } catch (err) {
            console.error("Error al cargar posts del perfil:", err);
        }
    }

    // --- 🌍 FUNCIONES GLOBALES ---
    window.enviarSolicitudAmistad = async function(idDestino) {
        try {
            const res = await fetch('/api/amistades/solicitar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_envia_id: idSesionActual, usuario_recibe_id: idDestino })
            });
            if (res.ok) { alert("Solicitud enviada ✅"); location.reload(); }
        } catch (err) { console.error(err); }
    };

    window.bloquearEsteUsuario = async function(idABloquear) {
        if (!confirm("¿Bloquear a este usuario? 🚫")) return;
        try {
            const res = await fetch('/api/bloqueos/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: idSesionActual, usuario_bloqueado_id: idABloquear })
            });
            if (res.ok) { window.location.href = 'index.html'; }
        } catch (err) { console.error(err); }
    };

    // Lanzar carga inicial al abrir el archivo
    document.addEventListener('DOMContentLoaded', cargarDatosPerfil);
})();