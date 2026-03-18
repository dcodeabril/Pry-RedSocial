// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE CALENDARIO P4)
// ARCHIVO: public/js/eventos.js
// =============================================

console.log("✅ eventos.js cargado correctamente (Versión Maestro #12)");

const miIdEvento = localStorage.getItem('usuarioId');

// --- 1. 🖼️ MANEJO GLOBAL DEL MODAL ---
window.abrirModalEvento = function() {
    const modal = document.getElementById('modal-evento');
    if (modal) {
        modal.classList.add('modal-evento-visible');
        modal.classList.remove('modal-evento-hidden');
    } else {
        console.error("❌ ERROR: El elemento 'modal-evento' no existe en el HTML.");
    }
};

window.cerrarModalEvento = function() {
    const modal = document.getElementById('modal-evento');
    if (modal) {
        modal.classList.add('modal-evento-hidden');
        modal.classList.remove('modal-evento-visible');
    }
};

// --- 2. 📥 CARGAR EVENTOS DESDE LA DB ---
async function cargarAgendaEventos() {
    const contenedor = document.getElementById('lista-eventos');
    if (!contenedor) return; 

    try {
        console.log("📡 Cargando cartelera dinámica...");
        const res = await fetch('/api/eventos/todos');
        const eventos = await res.json();
        
        contenedor.innerHTML = '';

        if (!Array.isArray(eventos) || eventos.length === 0) {
            contenedor.innerHTML = `
                <div class="eventos-vacio">
                    <p>No hay eventos programados próximamente. ✨</p>
                </div>`;
            return;
        }

        contenedor.innerHTML = eventos.map(e => {
            const esMio = String(e.creador_id) === String(miIdEvento);
            const btnBorrar = esMio 
                ? `<button onclick="eliminarEvento(${e.id})" class="btn-secundario btn-cancelar-evento">
                    Cancelar Evento 🗑️
                   </button>` 
                : '';
            
            return `
                <div id="evento-${e.id}" class="event-card card">
                    <h4 class="event-card-title">${e.titulo}</h4>
                    <p class="event-card-desc">${e.descripcion || 'Sin descripción.'}</p>
                    <div class="event-card-meta">
                        <div>📍 <strong>Lugar:</strong> ${e.ubicacion || 'Por confirmar'}</div>
                        <div>📅 <strong>Fecha:</strong> ${new Date(e.fecha_evento).toLocaleString()}</div>
                        <div class="event-card-organizer">
                            👤 Organiza: ${e.nombre} ${e.apellido}
                        </div>
                    </div>
                    ${btnBorrar}
                </div>
            `;
        }).join('');

        // ✅ LÓGICA DE ATERRIZAJE: Resaltar si venimos de una notificación
        if (window.location.hash && window.location.hash.startsWith('#evento-')) {
            const idAncla = window.location.hash.substring(1);
            const elemento = document.getElementById(idAncla);
            if (elemento) {
                setTimeout(() => {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    elemento.classList.add('event-highlight');
                    setTimeout(() => {
                        elemento.classList.remove('event-highlight');
                    }, 2000);
                }, 600);
            }
        }

    } catch (err) {
        console.error("🚨 Error al conectar con el servidor de eventos:", err);
    }
}

// --- 3. 🚀 PUBLICACIÓN DE EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    const formEvento = document.getElementById('form-evento');

    if (formEvento) {
        formEvento.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!miIdEvento) {
                alert("❌ Debes iniciar sesión para crear eventos.");
                return;
            }

            const nuevoEvento = {
                creador_id: miIdEvento,
                titulo: document.getElementById('ev-titulo').value.trim(),
                descripcion: document.getElementById('ev-descripcion').value.trim(),
                ubicacion: document.getElementById('ev-ubicacion').value.trim(),
                fecha_evento: document.getElementById('ev-fecha').value
            };

            try {
                const res = await fetch('/api/eventos/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoEvento)
                });

                if (res.ok) {
                    alert("✅ ¡Evento publicado y amigos notificados! 📅");
                    formEvento.reset(); 
                    window.cerrarModalEvento(); 
                    cargarAgendaEventos(); 
                } else {
                    const errorData = await res.json();
                    alert("❌ Error: " + errorData.error);
                }
            } catch (err) {
                console.error("🚨 Error en la petición:", err);
                alert("🚨 No se pudo conectar con el servidor.");
            }
        });
    }
    
    cargarAgendaEventos();
});

// --- 4. 🗑️ ELIMINAR EVENTO ---
window.eliminarEvento = async function(id) {
    if (!confirm("¿Deseas cancelar este evento permanentemente?")) return;

    try {
        const res = await fetch(`/api/eventos/${id}?usuario_id=${miIdEvento}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            cargarAgendaEventos();
        } else {
            const error = await res.json();
            alert("❌ " + error.error);
        }
    } catch (err) {
        console.error("🚨 Error al intentar eliminar:", err);
    }
};