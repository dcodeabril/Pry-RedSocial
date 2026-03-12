// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE CALENDARIO P4)
// ARCHIVO: public/js/eventos.js
// =============================================

console.log("✅ eventos.js cargado correctamente (Versión Maestro)");

// --- 1. 🖼️ MANEJO GLOBAL DE LA INTERFAZ DEL MODAL ---
// 🚩 Estas funciones son globales para que el 'onclick' del HTML las reconozca al instante.
window.abrirModalEvento = function() {
    console.log("🎉 Intentando abrir el modal de eventos...");
    const modal = document.getElementById('modal-evento');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error("❌ ERROR: El elemento 'modal-evento' no existe en este HTML.");
    }
};

window.cerrarModalEvento = function() {
    const modal = document.getElementById('modal-evento');
    if (modal) {
        modal.style.display = 'none';
    }
};

// --- 2. 📥 CARGAR EVENTOS DESDE LA DB ---
async function cargarEventos() {
    const miId = localStorage.getItem('usuarioId');
    // Buscamos el contenedor donde mostrar los eventos (lista o feed) de forma segura
    const contenedor = document.getElementById('lista-eventos') || document.getElementById('feed');
    if (!contenedor) return; 

    try {
        console.log("📡 Cargando cartelera de eventos...");
        const res = await fetch('/api/eventos');
        const eventos = await res.json();
        
        // Limpiamos solo si el contenedor es específico para eventos
        if(document.getElementById('lista-eventos')) {
            contenedor.innerHTML = '';
        }

        if (!Array.isArray(eventos) || eventos.length === 0) {
            if(document.getElementById('lista-eventos')) {
                contenedor.innerHTML = `
                <div class="card" style="text-align: center; opacity: 0.6; padding: 20px;">
                    <p>No hay eventos programados. ✨</p>
                </div>`;
            }
            return;
        }

        eventos.forEach(e => {
            const card = document.createElement('div');
            card.className = 'event-card card'; 

            // Verificamos si el usuario actual es el creador para mostrar el botón borrar
            const btnBorrar = (String(e.creador_id) === String(miId)) 
                ? `<button onclick="eliminarEvento(${e.id})" class="btn-secundario" 
                    style="margin-top:10px; color: #ff4d4d; border-color: #ff4d4d; width: 100%;">
                    Eliminar Evento 🗑️
                   </button>` 
                : '';
            
            card.innerHTML = `
                <h4>${e.titulo}</h4>
                <p style="font-size: 0.9rem; color: var(--primary);"><strong>📍 Lugar:</strong> ${e.ubicacion || 'Por confirmar'}</p>
                <p style="margin: 10px 0;">${e.descripcion || 'Sin descripción.'}</p>
                <div class="meta" style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted); background: var(--bg-color); padding: 5px; border-radius: 4px;">
                    <strong>📅 Fecha:</strong> ${new Date(e.fecha_evento).toLocaleString()}<br>
                    <strong>👤 Organiza:</strong> ${e.nombre} ${e.apellido}
                </div>
                ${btnBorrar}
            `;
            contenedor.appendChild(card);
        });
    } catch (err) {
        console.error("🚨 Error al conectar con el servidor de eventos:", err);
    }
}

// --- 3. 🚀 INICIALIZACIÓN Y PUBLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const formEvento = document.getElementById('form-evento');
    const miId = localStorage.getItem('usuarioId');

    if (formEvento) {
        formEvento.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Sincronización exacta con los IDs de index.html
            const nuevoEvento = {
                creador_id: miId,
                titulo: document.getElementById('ev-titulo').value.trim(),
                descripcion: document.getElementById('ev-descripcion').value.trim(),
                ubicacion: document.getElementById('ev-ubicacion').value.trim(),
                fecha_evento: document.getElementById('ev-fecha').value
            };

            if (!miId) {
                alert("❌ Debes estar logueado para crear eventos.");
                return;
            }

            try {
                const res = await fetch('/api/eventos/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoEvento)
                });

                if (res.ok) {
                    alert("✅ ¡Evento publicado en la cartelera! 📅");
                    formEvento.reset(); 
                    window.cerrarModalEvento(); 
                    cargarEventos(); 
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
    
    // Carga inicial
    cargarEventos();
});

// --- 4. 🗑️ ELIMINAR EVENTO (GLOBAL) ---
window.eliminarEvento = async function(id) {
    const miId = localStorage.getItem('usuarioId');
    if (!confirm("¿Seguro que quieres cancelar este evento?")) return;

    try {
        const res = await fetch(`/api/eventos/${id}?usuario_id=${miId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            cargarEventos();
        } else {
            const error = await res.json();
            alert("❌ " + error.error);
        }
    } catch (err) {
        console.error("🚨 Error al intentar eliminar:", err);
    }
};