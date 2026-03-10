// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (LÓGICA DE NOTIFICACIONES P4)
// ARCHIVO: public/js/notificaciones.js
// =============================================

const lista = document.getElementById('lista-notificaciones');
const btnMarcarTodas = document.getElementById('btn-marcar-leidas');
// 🛡️ Identidad dinámica: Recuperamos el ID de quien inició sesión
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
            // Aplicamos las clases de estilo definidas en el HTML (P5)
            item.className = `notif-item ${n.leido ? '' : 'no-leido'}`;
            
            item.innerHTML = `
                <img src="${n.foto_url || 'img/default.png'}" class="notif-avatar" alt="Avatar">
                <div class="notif-content">
                    <div class="notif-text">
                        <strong>${n.nombre} ${n.apellido}</strong> ${interpretarTipo(n.tipo)}
                    </div>
                    <div class="notif-time">${new Date(n.fecha).toLocaleString()}</div>
                </div>
                ${n.leido ? '' : '<div class="status-dot"></div>'}
            `;

            // Al hacer clic, se marca como leída solo esta notificación
            item.onclick = () => marcarUnaComoLeida(n.id, item);
            
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
        case 'reaccion': return "reaccionó a tu publicación 👍";
        case 'comentario': return "comentó tu post 💬";
        case 'mensaje': return "te envió un mensaje privado ✉️";
        case 'amistad': return "te envió una solicitud de amistad 🤝";
        default: return "realizó una acción en tu cuenta.";
    }
}

// --- 3. MARCAR UNA NOTIFICACIÓN COMO LEÍDA ---
async function marcarUnaComoLeida(id, elemento) {
    try {
        // Usamos el endpoint de borrar o uno específico de 'leer'
        // En este caso, simulamos la actualización visual inmediata
        elemento.classList.remove('no-leido');
        const dot = elemento.querySelector('.status-dot');
        if (dot) dot.remove();

        // [OPCIONAL] Avisar al servidor que esta ID ya se leyó
        // await fetch(`/api/notificaciones/leer-una/${id}`, { method: 'PUT' });
    } catch (err) {
        console.error("Error al marcar como leída:", err);
    }
}

// --- 4. MARCAR TODAS COMO LEÍDAS (BOTÓN GLOBAL) ---
if (btnMarcarTodas) {
    btnMarcarTodas.onclick = async () => {
        try {
            const res = await fetch(`/api/notificaciones/leer-todas/${miId}`, { method: 'PUT' });
            if (res.ok) {
                // Actualización visual masiva (P5)
                const noLeidas = document.querySelectorAll('.notif-item.no-leido');
                noLeidas.forEach(el => {
                    el.classList.remove('no-leido');
                    const dot = el.querySelector('.status-dot');
                    if (dot) dot.remove();
                });
                console.log("Notificaciones limpias ✅");
            }
        } catch (err) {
            alert("No se pudieron marcar todas como leídas.");
        }
    };
}

// --- 🚀 INICIO ---
cargarNotificaciones();