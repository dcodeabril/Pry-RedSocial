// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (NAVEGACIÓN CONTEXTUAL #12)
// ARCHIVO: public/js/notificaciones.js
// =============================================

const miIdNoti = localStorage.getItem('usuarioId');

// --- 1. 🔴 LÓGICA DEL CONTADOR (NAV) ---
async function actualizarContadorNotificaciones() {
    if (!miIdNoti) return;
    try {
        const res = await fetch(`/api/notificaciones/conteo/${miIdNoti}`);
        const data = await res.json();
        const badge = document.getElementById('contador-notificaciones');
        
        if (badge) {
            if (data.total > 0) {
                badge.innerText = data.total > 9 ? '9+' : data.total;
                badge.classList.add('badge-visible');
                badge.classList.remove('badge-hidden');
            } else {
                badge.classList.add('badge-hidden');
                badge.classList.remove('badge-visible');
            }
        }
    } catch (err) { console.error("🚨 Error en contador:", err); }
}

// --- 2. 📥 CARGAR HISTORIAL (notificaciones.html) ---
async function cargarNotificaciones() {
    const lista = document.getElementById('lista-notificaciones');
    if (!miIdNoti || !lista) return; 

    try {
        console.log("📡 Cargando avisos con navegación contextual...");
        const res = await fetch(`/api/notificaciones/${miIdNoti}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            lista.innerHTML = '<p class="notif-empty">Sin novedades por ahora. ✨</p>';
            return;
        }

        lista.innerHTML = ''; 

        data.forEach(n => {
            const item = document.createElement('div');
            item.className = `notif-item ${n.leido ? '' : 'no-leido'}`;
            
            let botonesAmistad = '';
            if (n.tipo === 'amistad' && !n.leido) {
                const idVinculo = n.referencia_id || n.id; 
                botonesAmistad = `
                    <div class="notif-actions">
                        <button onclick="responderSolicitud(${idVinculo}, 'aceptada')" class="btn-primario">Aceptar</button>
                        <button onclick="responderSolicitud(${idVinculo}, 'rechazada')" class="btn-secundario">Rechazar</button>
                    </div>
                `;
            }

            const avatarRuta = (n.foto_url && n.foto_url !== 'default.png') ? `img/${n.foto_url}` : 'img/default.png';

            item.innerHTML = `
                <img src="${avatarRuta}" class="notif-avatar" alt="Avatar">
                <div class="notif-content">
                    <div class="notif-text">
                        <strong>${n.nombre} ${n.apellido}</strong> ${interpretarTipo(n.tipo)}
                    </div>
                    <div class="notif-time">${new Date(n.fecha).toLocaleString()}</div>
                    ${botonesAmistad}
                </div>
                ${n.leido ? '' : '<div class="status-dot"></div>'}
                <button onclick="borrarNotificacion(${n.id})" class="notif-btn-delete">🗑️</button>
            `;

            item.onclick = (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    irAContenido(n.id, n.tipo, n.referencia_id);
                }
            };
            
            lista.appendChild(item);
        });
    } catch (err) { console.error("🚨 Error al cargar historial:", err); }
}

// --- 3. 🚀 FUNCIÓN MAESTRA: REDIRECCIÓN ---
window.irAContenido = async function(notiId, tipo, refId) {
    try {
        await fetch(`/api/notificaciones/leer/${notiId}`, { method: 'PUT' });
        
        let urlDestino = "";
        if (tipo === 'nuevo_evento') urlDestino = `index.html#evento-${refId}`;
        else if (tipo === 'reaccion' || tipo === 'comentario' || tipo === 'compartir') {
            urlDestino = `index.html#post-${refId}`;
        }
        else if (tipo === 'amistad' || tipo === 'confirmacion_amistad') {
            urlDestino = `perfil.html?id=${refId}`;
        }
        else urlDestino = "index.html";

        window.location.href = urlDestino;
        
        if (window.location.pathname.includes('index.html')) {
            setTimeout(() => location.reload(), 100); 
        }

    } catch (err) { console.error("Error al navegar:", err); }
};

// --- 4. 🗣️ TRADUCTOR DE TIPOS ---
function interpretarTipo(tipo) {
    switch(tipo) {
        case 'amistad': return "te envió una <b>solicitud de amistad</b> 🤝";
        case 'confirmacion_amistad': return "<b>aceptó tu solicitud</b> 🎉";
        case 'nuevo_evento': return "creó un <b>nuevo evento</b> 📅";
        case 'reaccion': return "reaccionó a tu publicación 👍";
        case 'comentario': return "comentó tu post 💬";
        case 'compartir': return "<b>compartió</b> tu publicación en su muro 🔄"; 
        default: return "interactuó contigo.";
    }
}

// --- 5. ACCIONES DE LIMPIEZA ---
window.borrarNotificacion = async function(id) {
    if (!confirm("¿Eliminar este aviso?")) return;
    try {
        const res = await fetch(`/api/notificaciones/${id}`, { method: 'DELETE' });
        if (res.ok) cargarNotificaciones();
    } catch (err) { console.error(err); }
};

window.responderSolicitud = async function(idRef, estado) {
    try {
        const res = await fetch('/api/amistades/responder', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solicitud_id: idRef, nuevo_estado: estado })
        });
        if (res.ok) location.reload();
    } catch (err) { console.error(err); }
};

document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorNotificaciones();
    cargarNotificaciones();

    const btnMarcarTodas = document.getElementById('btn-marcar-leidas');
    if (btnMarcarTodas) {
        btnMarcarTodas.onclick = async () => {
            await fetch(`/api/notificaciones/leer-todas/${miIdNoti}`, { method: 'PUT' });
            location.reload();
        };
    }
});

setInterval(actualizarContadorNotificaciones, 30000);