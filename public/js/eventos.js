// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE CALENDARIO P4 - MODAL SPA)
// ARCHIVO: public/js/eventos.js
// =============================================

console.log("✅ eventos.js sincronizado (Versión Maestro Industrial - SPA)");

const miIdEvento = localStorage.getItem('usuarioId');

// --- 1. 🖼️ CONTROL GLOBAL DE MODALES (APERTURA Y CIERRE) ---

window.abrirModalEvento = function() {
    console.log("📂 Abriendo Centro de Eventos...");
    const modal = document.getElementById('modal-evento');
    
    if (modal) {
        modal.classList.remove('modal-evento-hidden');
        modal.classList.add('modal-evento-visible');
        
        // 🚀 CRÍTICO: Disparamos la carga de la lista de eventos inmediatamente
        cargarAgendaEventosModal();
    } else {
        console.error("🚨 Error: El ID 'modal-evento' no existe en el index.html");
    }
};

window.cerrarModalEvento = function() {
    const modal = document.getElementById('modal-evento');
    if (modal) {
        modal.classList.add('modal-evento-hidden');
        modal.classList.remove('modal-evento-visible');
    }
};

// --- 2. 📥 CARGAR LISTA DINÁMICA DENTRO DEL MODAL ---

async function cargarAgendaEventosModal() {
    const contenedor = document.getElementById('lista-eventos-modal');
    if (!contenedor) return;

    try {
        console.log("📡 Sincronizando agenda de eventos...");
        const res = await fetch('/api/eventos/todos');
        const eventos = await res.json();
        
        if (!Array.isArray(eventos) || eventos.length === 0) {
            contenedor.innerHTML = `
                <div class="eventos-vacio-mini">
                    <p>No hay eventos próximos. ✨</p>
                </div>`;
            return;
        }

        contenedor.innerHTML = eventos.map(e => {
            const esMio = String(e.creador_id) === String(miIdEvento);
            
            return `
                <div class="event-card-mini" id="evento-item-${e.id}">
                    <div class="ev-mini-info">
                        <strong>${e.titulo}</strong>
                        <small><i class="fa-solid fa-location-dot"></i> ${e.ubicacion || 'Local'}</small>
                        <small><i class="fa-solid fa-clock"></i> ${new Date(e.fecha_evento).toLocaleString()}</small>
                        <small class="ev-mini-organizer">👤 ${e.nombre} ${e.apellido}</small>
                    </div>
                    ${esMio ? `
                        <button onclick="eliminarEvento(${e.id})" class="btn-del-mini" title="Cancelar">
                            <i class="fa-solid fa-trash"></i>
                        </button>` : ''}
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("🚨 Error al cargar lista en modal:", err);
        contenedor.innerHTML = '<p class="error-text">Error al conectar con el servidor.</p>';
    }
}

// --- 3. 🚀 PUBLICACIÓN DE EVENTOS DESDE EL MODAL ---

document.addEventListener('DOMContentLoaded', () => {
    const formModal = document.getElementById('form-evento-modal');

    if (formModal) {
        formModal.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!miIdEvento) {
                alert("❌ Error: Debes iniciar sesión.");
                return;
            }

            // Sincronización con los IDs del modal en index.html
            const nuevoEvento = {
                creador_id: miIdEvento,
                titulo: document.getElementById('ev-titulo-modal').value.trim(),
                descripcion: document.getElementById('ev-desc-modal') ? document.getElementById('ev-desc-modal').value.trim() : "",
                ubicacion: document.getElementById('ev-ubicacion-modal') ? document.getElementById('ev-ubicacion-modal').value.trim() : "Local",
                fecha_evento: document.getElementById('ev-fecha-modal').value
            };

            try {
                const res = await fetch('/api/eventos/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoEvento)
                });

                if (res.ok) {
                    alert("✅ ¡Evento publicado! Tus amigos han sido notificados. 📅");
                    formModal.reset(); 
                    // Refrescamos la lista interna del modal inmediatamente
                    cargarAgendaEventosModal(); 
                } else {
                    const errorData = await res.json();
                    alert("❌ Error: " + (errorData.error || "No se pudo crear el evento"));
                }
            } catch (err) {
                console.error("🚨 Error en la petición:", err);
            }
        });
    }
});

// --- 4. 🗑️ CANCELACIÓN DE EVENTOS ---

window.eliminarEvento = async function(id) {
    if (!confirm("¿Deseas cancelar este evento permanentemente?")) return;

    try {
        const res = await fetch(`/api/eventos/${id}?usuario_id=${miIdEvento}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            // Refrescamos la lista del modal
            cargarAgendaEventosModal();
        } else {
            const error = await res.json();
            alert("❌ " + (error.error || "No tienes permiso para borrar este evento"));
        }
    } catch (err) {
        console.error("🚨 Error al eliminar:", err);
    }
};