// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE TESOROS SPA - DINÁMICO)
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

            // 🧠 MOTOR DE IDENTIDAD DINÁMICA (CONEXIÓN GLOBAL)
            const nombreCompleto = `${post.nombre || ''} ${post.apellido || ''}`.trim();
            const iniciales = nombreCompleto.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2) || '?';
            
            // 🛡️ ESCUDO ANTI-404: Si es "default", "null" o vacío, forzamos iniciales.
            const tieneFotoReal = post.foto_url && 
                                 post.foto_url !== 'default.png' && 
                                 post.foto_url !== 'null' && 
                                 post.foto_url !== '' && 
                                 !post.foto_url.includes('default');

            // Renderizado inteligente con plan de rescate
            const avatarUI = tieneFotoReal
                ? `<img src="/img/${post.foto_url}" class="tesoro-avatar" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\"avatar-dinamico-nav tesoro-avatar\" style=\"width: 45px; height: 45px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid #ffc107; flex-shrink: 0;\"><span class=\"iniciales-text\" style=\"color: white; font-weight: 800; font-size: 1.1rem;\">${iniciales}</span></div>';">`
                : `<div class="avatar-dinamico-nav tesoro-avatar" style="width: 45px; height: 45px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid #ffc107; flex-shrink: 0;">
                       <span class="iniciales-text" style="font-size: 1.1rem; color: white; font-weight: 800;">${iniciales}</span>
                   </div>`;

            div.innerHTML = `
                <div class="tesoro-header">
                    <div class="avatar-wrapper-baul">${avatarUI}</div>
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
    }
}

async function quitarDeBaul(postId) {
    if(!confirm("¿Deseas quitar este tesoro de tu baúl?")) return;
    try {
        const res = await fetch(`/api/publicaciones/baul/${postId}?usuario_id=${miId}`, { method: 'DELETE' });
        if (res.ok) cargarTesoros();
    } catch (err) { console.error("🚨 Error al quitar tesoro:", err); }
}

document.addEventListener('DOMContentLoaded', cargarTesoros);