// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE TESOROS SPA)
// ARCHIVO: js/baul.js
// =============================================

const baulFeed = document.getElementById('baul-feed');
const miId = localStorage.getItem('usuarioId');

async function cargarTesoros() {
    if (!miId) return;

    try {
        console.log("🗝️ Accediendo a los tesoros privados...");
        const res = await fetch(`/api/publicaciones/baul/${miId}`);
        const tesoros = await res.json();

        if (!Array.isArray(tesoros) || tesoros.length === 0) {
            baulFeed.innerHTML = `
                <div class="card baul-empty">
                    <i class="fa-solid fa-box-open" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p class="baul-empty-title">Tu baúl está vacío. 📭</p>
                    <small>Guarda publicaciones del muro para verlas en esta sección privada.</small>
                </div>`;
            return;
        }

        baulFeed.innerHTML = '';

        tesoros.forEach(post => {
            const div = document.createElement('div');
            div.className = 'post-card card tesoro-card';

            div.innerHTML = `
                <div class="tesoro-header">
                    <img src="${post.foto_url || 'img/default.png'}" class="tesoro-avatar">
                    <div class="tesoro-user-info">
                        <strong>${post.nombre} ${post.apellido}</strong>
                        <small class="tesoro-info-small">
                            <i class="fa-solid fa-calendar-day"></i> Guardado el: ${new Date(post.fecha_guardado || post.fecha).toLocaleDateString()}
                        </small>
                    </div>
                </div>
                <div class="tesoro-body">
                    ${post.contenido}
                </div>
                <div class="tesoro-footer">
                    <div class="tesoro-status">
                        <i class="fa-solid fa-lock"></i> Contenido Protegido
                    </div>
                    <button onclick="quitarDeBaul(${post.id})" class="btn-remove-tesoro" title="Quitar del baúl">
                        <i class="fa-solid fa-bookmark-slash"></i> Quitar
                    </button>
                </div>
            `;
            baulFeed.appendChild(div);
        });

    } catch (err) {
        console.error("🚨 Error al cargar el baúl:", err);
        baulFeed.innerHTML = `
            <div class="card error-card">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>No pudimos abrir el baúl. Verifica tu conexión.</p>
            </div>`;
    }
}

// 🗑️ Función para quitar una publicación del baúl
async function quitarDeBaul(postId) {
    if(!confirm("¿Deseas quitar este tesoro de tu baúl?")) return;

    try {
        const res = await fetch(`/api/publicaciones/baul/${postId}?usuario_id=${miId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            cargarTesoros(); // Recargar la lista
        }
    } catch (err) {
        console.error("🚨 Error al quitar tesoro:", err);
    }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', cargarTesoros);