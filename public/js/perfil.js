// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (VISUALIZACIÓN DE PERFIL P5)
// ARCHIVO: perfil.js
// =============================================

// 🛡️ Identidad dinámica: Recuperamos el ID de la sesión activa
const miId = localStorage.getItem('usuarioId');

// Elementos de la interfaz (IDs actualizados del perfil.html)
const nombreTxt = document.getElementById('perf-nombre-completo');
const bioTxt = document.getElementById('perf-bio');
const fotoImg = document.getElementById('perf-foto');
const contenedorPosts = document.getElementById('mis-posts');

// --- 1. CARGAR DATOS DE IDENTIDAD (Persona 1 y 5) ---
async function cargarDatosPerfil() {
    if (!miId) return;

    try {
        // Consultamos la API de ajustes/perfil que ya tenemos funcionando
        const response = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await response.json();

        if (response.ok) {
            // Actualizamos la Portada y el Avatar
            nombreTxt.innerText = `${datos.nombre} ${datos.apellido}`;
            bioTxt.innerText = datos.bio || "¡Hola! Estoy usando Facebook Local.";
            
            if (datos.foto_url) {
                fotoImg.src = datos.foto_url;
            }
        }
        
        // Una vez cargada la identidad, buscamos sus publicaciones
        cargarMisPosts();

    } catch (error) {
        console.error("Error al cargar el perfil maestro:", error);
    }
}

// --- 2. CARGAR PUBLICACIONES PERSONALES (Persona 2) ---
async function cargarMisPosts() {
    try {
        // Este endpoint filtrará en la Tabla 3 solo los posts de este ID
        const res = await fetch(`/api/publicaciones/usuario/${miId}`);
        const posts = await res.json();

        if (posts.length === 0) {
            contenedorPosts.innerHTML = `
                <div class="card" style="text-align: center; padding: 20px;">
                    <p>Aún no has compartido nada en tu muro.</p>
                </div>`;
            return;
        }

        // Renderizamos solo los posts del dueño del perfil
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
        console.error("Error al cargar posts personales:", err);
        contenedorPosts.innerHTML = '<p>Error al conectar con el servidor de contenidos.</p>';
    }
}

// --- 🚀 INICIO DE CARGA ---
cargarDatosPerfil();