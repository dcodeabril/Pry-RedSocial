// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (LÓGICA DE NOTIFICACIONES P3 + P4)
// ARCHIVO: public/js/notificaciones.js
// =============================================

const lista = document.getElementById('lista-notificaciones');
const btnMarcarTodas = document.getElementById('btn-marcar-leidas');
const miId = localStorage.getItem('usuarioId');

// --- 1. CARGAR NOTIFICACIONES DESDE LA API ---
async function cargarNotificaciones() {
    if (!miId) return;

    try {
        const res = await fetch(`/api/notificaciones/${miId}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            lista.innerHTML = '<p style="padding: 20px; text-align: center; opacity: 0.6;">No tienes notificaciones por ahora. ✨</p>';
            return;
        }

        lista.innerHTML = ''; // Limpiar mensaje de carga

        data.forEach(n => {
            const item = document.createElement('div');
            item.className = `notif-item ${n.leido ? '' : 'no-leido'}`;
            
            // 🛡️ Lógica de botones: Solo para solicitudes nuevas (tipo 'amistad')
            let botonesAmistad = '';
            if (n.tipo === 'amistad') {
                const idVínculo = n.referencia_id || n.id; 
                botonesAmistad = `
                    <div class="notif-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                        <button onclick="responderSolicitud(${idVínculo}, 'aceptada')" class="btn-primario" style="padding: 5px 12px; font-size: 0.85rem;">Aceptar</button>
                        <button onclick="responderSolicitud(${idVínculo}, 'rechazada')" class="btn-secundario" style="padding: 5px 12px; font-size: 0.85rem;">Rechazar</button>
                    </div>
                `;
            }

            item.innerHTML = `
                <img src="${n.foto_url || 'img/default.png'}" class="notif-avatar" alt="Avatar">
                <div class="notif-content" style="flex-grow: 1;">
                    <div class="notif-text">
                        <strong>${n.nombre} ${n.apellido}</strong> ${interpretarTipo(n.tipo)}
                    </div>
                    <div class="notif-time">${new Date(n.fecha).toLocaleString()}</div>
                    ${botonesAmistad}
                </div>
                ${n.leido ? '' : '<div class="status-dot"></div>'}
                <button onclick="borrarNotificacion(${n.id})" style="background:none; border:none; cursor:pointer; margin-left:10px; opacity:0.5;">🗑️</button>
            `;

            // Marcar como leída al hacer clic
            item.onclick = (e) => {
                if(e.target.tagName !== 'BUTTON') marcarUnaComoLeida(n.id, item);
            };
            
            lista.appendChild(item);
        });

    } catch (err) {
        console.error("Error al cargar notificaciones:", err);
        lista.innerHTML = '<p style="padding: 20px; color: red; text-align: center;">Error de conexión con el servidor.</p>';
    }
}

// --- 2. TRADUCTOR DE TIPOS (Persona 4) ---
function interpretarTipo(tipo) {
    switch(tipo) {
        case 'amistad': 
            return "te envió una <b>solicitud de amistad</b> 🤝";
        case 'confirmacion_amistad': 
            return "<b>aceptó tu solicitud de amistad</b>. ¡Ya pueden chatear! 🎉";
        case 'reaccion': 
            return "reaccionó a tu publicación 👍";
        case 'comentario': 
            return "comentó tu post 💬";
        case 'mensaje': 
            return "te envió un mensaje privado ✉️";
        default: 
            return "realizó una acción en tu cuenta.";
    }
}

// --- 3. RESPONDER SOLICITUD DE AMISTAD (Persona 3) ---
window.responderSolicitud = async function(idReferencia, estado) {
    try {
        const res = await fetch('/api/amistades/responder', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                solicitud_id: idReferencia,
                nuevo_estado: estado
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("🤝 " + data.mensaje);
            location.reload(); 
        } else {
            alert("❌ " + data.error);
        }
    } catch (err) {
        console.error("Error al responder solicitud:", err);
    }
};

// --- 4. MARCAR UNA NOTIFICACIÓN COMO LEÍDA ---
async function marcarUnaComoLeida(id, elemento) {
    try {
        elemento.classList.remove('no-leido');
        const dot = elemento.querySelector('.status-dot');
        if (dot) dot.remove();
        // Opcional: fetch a /api/notificaciones/leer-una/${id}
    } catch (err) {
        console.error("Error al marcar como leída:", err);
    }
}

// --- 5. BORRAR NOTIFICACIÓN ---
window.borrarNotificacion = async function(id) {
    try {
        const res = await fetch(`/api/notificaciones/${id}`, { method: 'DELETE' });
        if (res.ok) cargarNotificaciones();
    } catch (err) {
        console.error("Error al borrar:", err);
    }
}

// --- 6. MARCAR TODAS COMO LEÍDAS ---
if (btnMarcarTodas) {
    btnMarcarTodas.onclick = async () => {
        try {
            const res = await fetch(`/api/notificaciones/leer-todas/${miId}`, { method: 'PUT' });
            if (res.ok) location.reload();
        } catch (err) {
            alert("No se pudieron marcar todas como leídas.");
        }
    };
}

// --- 🚀 INICIO ---
cargarNotificaciones();