// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE TESOROS #8)
// ARCHIVO: js/baul.js
// =============================================

const baulFeed = document.getElementById('baul-feed');
const miId = localStorage.getItem('usuarioId');

async function cargarTesoros() {
    if (!miId) return;

    try {
        const res = await fetch(`/api/publicaciones/baul/${miId}`);
        const tesoros = await res.json();

        if (tesoros.length === 0) {
            // Usamos clases para el estado vacío
            baulFeed.innerHTML = `
                <div class="card baul-empty">
                    <p class="baul-empty-title">Tu baúl está vacío. 📭</p>
                    <small>Guarda publicaciones del muro para verlas aquí.</small>
                </div>`;
            return;
        }

        baulFeed.innerHTML = '';

        tesoros.forEach(post => {
            const div = document.createElement('div');
            // Aplicamos las clases definidas en baul.css
            div.className = 'post-card card tesoro-card';

            div.innerHTML = `
                <div class="tesoro-header">
                    <img src="${post.foto_url || 'img/default.png'}" class="tesoro-avatar">
                    <div>
                        <strong>${post.nombre} ${post.apellido}</strong>
                        <small class="tesoro-info-small">Publicado el: ${new Date(post.fecha).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="tesoro-body">
                    ${post.contenido}
                </div>
                <div class="tesoro-footer">
                    🔒 Este post está guardado en tu baúl privado.
                </div>
            `;
            baulFeed.appendChild(div);
        });

    } catch (err) {
        console.error("Error al cargar el baúl:", err);
        baulFeed.innerHTML = '<p class="card">Error al conectar con tu baúl.</p>';
    }
}

// Inicializar
cargarTesoros();