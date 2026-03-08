// public/js/notificaciones.js
const container = document.getElementById('lista-notificaciones');
const miUsuarioId = 1; // ID del Arquitecto para pruebas

async function cargarNotificaciones() {
    try {
        const response = await fetch(`/api/notificaciones/${miUsuarioId}`);
        const notificaciones = await response.json();

        if (notificaciones.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">No tienes notificaciones nuevas.</p>';
            return;
        }

        container.innerHTML = ''; // Limpiar mensaje de carga

        notificaciones.forEach(n => {
            const item = document.createElement('div');
            item.className = `notif-item ${n.leido ? '' : 'no-leido'}`;
            
            // Construir el mensaje según el tipo de alerta
            let mensaje = `<strong>${n.nombre} ${n.apellido}</strong> `;
            //if (n.tipo === 'like') mensaje += "reaccionó a tu publicación.";
            // Cambia 'like' por 'reaccion' para que coincida con Tabla 9
            if (n.tipo === 'reaccion') mensaje += "reaccionó a tu publicación.";
            if (n.tipo === 'comentario') mensaje += "comentó tu post.";
            if (n.tipo === 'amistad') mensaje += "te envió una solicitud de amistad.";

            item.innerHTML = `
                <div class="notif-avatar"></div>
                <div class="notif-content">
                    <div class="notif-text">${mensaje}</div>
                    <div class="notif-time">${new Date(n.fecha).toLocaleString()}</div>
                </div>
                ${n.leido ? '' : '<div class="status-dot"></div>'}
            `;

            // Al hacer clic, marcar como leída en la DB
            item.onclick = () => marcarComoLeida(n.id, item);
            
            container.appendChild(item);
        });
    } catch (error) {
        container.innerHTML = '<p style="padding: 20px; color: red;">Error al conectar con el servidor.</p>';
    }
}

async function marcarComoLeida(id, elemento) {
    await fetch(`/api/notificaciones/leer/${id}`, { method: 'PATCH' });
    elemento.classList.remove('no-leido');
    const dot = elemento.querySelector('.status-dot');
    if (dot) dot.remove();
}

// Iniciar carga
cargarNotificaciones();