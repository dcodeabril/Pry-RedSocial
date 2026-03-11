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
        // 📡 Llamamos a la ruta de "Baúl" que creamos en el backend
        const res = await fetch(`/api/publicaciones/baul/${miId}`);
        const tesoros = await res.json();

        if (tesoros.length === 0) {
            baulFeed.innerHTML = `
                <div class="card" style="text-align: center; padding: 50px;">
                    <p style="font-size: 1.2rem; opacity: 0.6;">Tu baúl está vacío. 📭</p>
                    <small>Guarda publicaciones del muro para verlas aquí.</small>
                </div>`;
            return;
        }

        baulFeed.innerHTML = '';

        tesoros.forEach(post => {
            const div = document.createElement('div');
            div.className = 'post-card card';
            div.style.marginBottom = "20px";
            div.style.borderLeft = "5px solid #ffc107"; // Un toque dorado para los "tesoros"

            div.innerHTML = `
                <div class="post-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <img src="${post.foto_url || 'img/default.png'}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <strong>${post.nombre} ${post.apellido}</strong>
                        <small style="display: block; opacity: 0.6;">Publicado el: ${new Date(post.fecha).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="post-body" style="font-size: 1.1rem; line-height: 1.4; margin-bottom: 15px;">
                    ${post.contenido}
                </div>
                <div class="post-footer" style="border-top: 1px solid #eee; padding-top: 10px; font-size: 0.8rem; opacity: 0.7;">
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