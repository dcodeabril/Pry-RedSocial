// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (NAVEGACIÓN CONTEXTUAL + IDENTIDAD INDUSTRIAL)
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
                badge.style.display = 'flex'; 
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (err) { console.error("🚨 Error en contador:", err); }
}

// --- 2. 📥 CARGAR HISTORIAL (Sincronizado con Identidad Híbrida) ---
async function cargarNotificaciones() {
    const lista = document.getElementById('lista-notificaciones');
    if (!miIdNoti || !lista) return; 

    try {
        const res = await fetch(`/api/notificaciones/${miIdNoti}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            lista.innerHTML = `
                <div class="notif-empty">
                    <i class="fa-solid fa-ghost"></i>
                    <p>Sin novedades por ahora. ✨</p>
                </div>`;
            return;
        }

        lista.innerHTML = data.map(n => {
            const iniciales = ((n.nombre ? n.nombre[0] : "") + (n.apellido ? n.apellido[0] : "")).toUpperCase() || "?";
            
            const tieneFoto = n.foto_url && 
                              n.foto_url !== 'default.png' && 
                              n.foto_url !== 'null' && 
                              n.foto_url !== '';

            let avatarHtml = "";

            if (tieneFoto) {
                avatarHtml = `<img src="/uploads/perfiles/${n.foto_url}" class="notif-avatar" onerror="this.src='/uploads/perfiles/default.png';">`;
            } else {
                let bgColor = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
                if (typeof generarColorPorNombre === 'function') {
                    bgColor = generarColorPorNombre(n.nombre || "User");
                }
                avatarHtml = `<div class="notif-avatar-initial" style="background: ${bgColor}">${iniciales}</div>`;
            }

            let botonesAmistad = '';
            if (n.tipo === 'amistad' && !n.leido) {
                const idVinculo = n.referencia_id || n.id; 
                botonesAmistad = `
                    <div class="notif-actions">
                        <button onclick="responderSolicitud(event, ${idVinculo}, 'aceptada')" class="btn-vibrant btn-mini">Aceptar</button>
                        <button onclick="responderSolicitud(event, ${idVinculo}, 'rechazada')" class="btn-secundario btn-mini">Rechazar</button>
                    </div>`;
            }

            // 🎯 ACTUALIZACIÓN: Se agrega n.emisor_id a la llamada de manejarClicNotif
            return `
                <div class="notif-item ${n.leido ? '' : 'no-leido'}" 
                     onclick="manejarClicNotif(event, ${n.id}, '${n.tipo}', ${n.referencia_id}, ${n.emisor_id})">
                    
                    ${avatarHtml}
                    
                    <div class="notif-content">
                        <div class="notif-text">
                            <strong>${n.nombre} ${n.apellido}</strong> ${interpretarTipo(n.tipo)}
                        </div>
                        <div class="notif-time">
                            <i class="fa-regular fa-clock"></i> ${new Date(n.fecha).toLocaleString()}
                        </div>
                        ${botonesAmistad}
                    </div>

                    ${n.leido ? '' : '<div class="status-dot"></div>'}

                    <button onclick="borrarNotificacion(event, ${n.id})" class="notif-btn-delete" title="Eliminar">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>`;
        }).join('');

    } catch (err) { console.error("🚨 Error al cargar historial:", err); }
}

// --- 3. 🚀 FUNCIÓN MAESTRA: REDIRECCIÓN (CORREGIDA) ---
window.irAContenido = async function(notiId, tipo, refId, emisorId) {
    try {
        await fetch(`/api/notificaciones/leer/${notiId}`, { method: 'PUT' });
        
        let urlDestino = "index.html";
        
        if (tipo === 'nuevo_evento') urlDestino = `index.html#evento-${refId}`;
        else if (['reaccion', 'comentario', 'compartir'].includes(tipo)) {
            urlDestino = `index.html#post-${refId}`;
        }
        // 🎯 CORRECCIÓN: Redirigir al perfil del emisor para tipos de amistad
        else if (tipo === 'amistad' || tipo === 'confirmacion_amistad') {
            urlDestino = `perfil.html?id=${emisorId}`;
        }

        window.location.href = urlDestino;
        
        if (window.location.pathname.includes('index.html')) {
            setTimeout(() => location.reload(), 150); 
        }
    } catch (err) { console.error("Error al navegar:", err); }
};

// 🎯 ACTUALIZACIÓN: Recibe y pasa el emisorId
function manejarClicNotif(e, id, tipo, refId, emisorId) {
    if (e.target.closest('button')) return; 
    irAContenido(id, tipo, refId, emisorId);
}

// --- 4. 🗣️ TRADUCTOR DE TIPOS ---
function interpretarTipo(tipo) {
    const glosario = {
        'amistad': 'te envió una <b>solicitud de amistad</b> 🤝',
        'confirmacion_amistad': '<b>aceptó tu solicitud</b> 🎉',
        'nuevo_evento': 'creó un <b>nuevo evento</b> 📅',
        'reaccion': 'reaccionó a tu publicación 👍',
        'comentario': 'comentó tu post 💬',
        'compartir': '<b>compartió</b> tu publicación 🔄'
    };
    return glosario[tipo] || 'interactuó contigo.';
}

// --- 5. ACCIONES DE LIMPIEZA Y RESPUESTA ---
window.borrarNotificacion = async function(e, id) {
    e.stopPropagation(); 
    if (!confirm("¿Eliminar este aviso de forma permanente?")) return;
    try {
        const res = await fetch(`/api/notificaciones/${id}`, { method: 'DELETE' });
        if (res.ok) cargarNotificaciones();
    } catch (err) { console.error(err); }
};

window.responderSolicitud = async function(e, idRef, estado) {
    e.stopPropagation(); 
    try {
        const res = await fetch('/api/amistades/responder', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solicitud_id: idRef, nuevo_estado: estado })
        });
        if (res.ok) {
            actualizarContadorNotificaciones();
            cargarNotificaciones();
        }
    } catch (err) { console.error(err); }
};

// --- 🏗️ INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorNotificaciones();
    cargarNotificaciones();

    const btnMarcarTodas = document.getElementById('btn-marcar-leidas');
    if (btnMarcarTodas) {
        btnMarcarTodas.onclick = async () => {
            await fetch(`/api/notificaciones/leer-todas/${miIdNoti}`, { method: 'PUT' });
            actualizarContadorNotificaciones();
            cargarNotificaciones();
        };
    }
});

setInterval(actualizarContadorNotificaciones, 15000);