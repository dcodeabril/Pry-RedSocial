// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (VISUALIZACIÓN, VÍNCULOS Y PRIVACIDAD P3, P4 + P5)
// ARCHIVO: perfil.js
// =============================================

// 🛡️ Identidad: Recuperamos el ID de la sesión y el ID del perfil que visitamos
const miId = localStorage.getItem('usuarioId');
const params = new URLSearchParams(window.location.search);
const perfilId = params.get('id') || miId; // Si no hay ID en la URL, es MI perfil

// Elementos de la interfaz
const nombreTxt = document.getElementById('perf-nombre-completo');
const bioTxt = document.getElementById('perf-bio');
const fotoImg = document.getElementById('perf-foto');
const contenedorPosts = document.getElementById('mis-posts');
const zonaAcciones = document.getElementById('zona-acciones-perfil'); 

// --- 1. CARGAR DATOS DE IDENTIDAD (Persona 1 y 5) ---
async function cargarDatosPerfil() {
    if (!perfilId) return;

    try {
        const response = await fetch(`/api/usuarios/ajustes/${perfilId}`);
        const datos = await response.json();

        if (response.ok) {
            nombreTxt.innerText = `${datos.nombre} ${datos.apellido}`;
            bioTxt.innerText = datos.bio || "¡Hola! Estoy usando Facebook Local.";
            
            if (datos.foto_url) {
                fotoImg.src = datos.foto_url;
            }

            // 🛡️ Lógica de Botones Dinámicos (Solo si visitamos a OTRO usuario)
            if (perfilId !== miId && zonaAcciones) {
                // 🔍 Consultamos el estado de amistad antes de dibujar la interfaz
                const resAmistad = await fetch(`/api/amistades/estado/${miId}/${perfilId}`);
                const relacion = await resAmistad.json();

                let botonAmistad = '';

                if (!relacion || relacion.vacio) {
                    // Caso A: No hay ningún vínculo previo
                    botonAmistad = `<button onclick="enviarSolicitudAmistad(${perfilId})" class="btn-primario">Agregar Amigo ➕</button>`;
                } else if (relacion.estado === 'pendiente') {
                    // Caso B: Ya se envió la solicitud pero no ha sido aceptada
                    botonAmistad = `<button class="btn-secundario" style="background: #ccc; cursor: not-allowed;" disabled>Solicitud Enviada ⏳</button>`;
                } else if (relacion.estado === 'aceptada') {
                    // Caso C: Ya son amigos confirmados
                    botonAmistad = `<button class="btn-secundario" style="background: #28a745; color: white;" disabled>Amigos ✅</button>`;
                }

                zonaAcciones.innerHTML = `
                    ${botonAmistad}
                    <button class="btn-primario" style="background: #e4e6eb; color: black;">Enviar Mensaje 💬</button>
                    <button onclick="bloquearEsteUsuario(${perfilId})" class="btn-secundario" 
                            style="color: #dc3545; border-color: #dc3545; margin-left: auto;">
                        Bloquear 🚫
                    </button>
                `;
            }
        }
        
        cargarMisPosts();

    } catch (error) {
        console.error("Error al cargar el perfil maestro:", error);
    }
}

// --- 2. CARGAR PUBLICACIONES (Persona 2) ---
async function cargarMisPosts() {
    try {
        const res = await fetch(`/api/publicaciones/usuario/${perfilId}`);
        const posts = await res.json();

        if (posts.length === 0) {
            contenedorPosts.innerHTML = `
                <div class="card" style="text-align: center; padding: 20px;">
                    <p>No hay publicaciones disponibles en este muro.</p>
                </div>`;
            return;
        }

        contenedorPosts.innerHTML = posts.map(p => `
            <div class="card" style="margin-bottom: 15px;">
                <div style="border-bottom: 1px solid #eee; margin-bottom: 10px; padding-bottom: 5px;">
                    <small>Publicado el: ${new Date(p.fecha_creacion).toLocaleString()}</small>
                </div>
                <p style="font-size: 1.1rem;">${p.contenido}</p>
                <div style="margin-top: 10px; color: var(--primary); font-size: 0.9rem;">
                    <span>🛡️ Privacidad: ${p.privacidad}</span>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Error al cargar posts:", err);
        contenedorPosts.innerHTML = '<p>Error al conectar con el servidor.</p>';
    }
}

// --- 3. FUNCIÓN PARA ENVIAR SOLICITUD DE AMISTAD (Persona 3) ---
window.enviarSolicitudAmistad = async function(idDestino) {
    try {
        const res = await fetch('/api/amistades/solicitar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_envia_id: miId,
                usuario_recibe_id: idDestino
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert("✅ " + data.mensaje);
            location.reload(); // Recargamos para que el botón pase a "Solicitud Enviada"
        } else {
            alert("❌ " + data.error);
        }
        
    } catch (err) {
        console.error("Error al enviar solicitud:", err);
    }
};

// --- 4. FUNCIÓN PARA BLOQUEAR USUARIO (Persona 4) ---
window.bloquearEsteUsuario = async function(idABloquear) {
    if (!confirm("¿Deseas bloquear a esta persona? No podrán ver sus publicaciones mutuamente.")) return;

    try {
        const res = await fetch('/api/bloqueos/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: miId,
                usuario_bloqueado_id: idABloquear
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("🚫 " + data.mensaje);
            window.location.href = 'index.html'; 
        } else {
            alert("❌ " + data.error);
        }
    } catch (err) {
        console.error("Error al bloquear:", err);
    }
};

// --- 🚀 INICIO DE CARGA ---
cargarDatosPerfil();