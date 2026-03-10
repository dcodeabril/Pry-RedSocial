// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE CALENDARIO P4)
// ARCHIVO: public/js/eventos.js
// =============================================

const listaEventos = document.getElementById('lista-eventos');
const formEvento = document.getElementById('form-evento');
// 🛡️ Identidad dinámica: Recuperamos el ID de la sesión activa
const miId = localStorage.getItem('usuarioId');

// --- 1. CARGAR EVENTOS DESDE LA DB ---
async function cargarEventos() {
    try {
        const res = await fetch('/api/eventos');
        const eventos = await res.json();
        
        if (!Array.isArray(eventos) || eventos.length === 0) {
            listaEventos.innerHTML = `
                <div class="card" style="text-align: center; opacity: 0.6;">
                    <p>No hay eventos programados para los próximos días. ✨</p>
                </div>`;
            return;
        }

        // Limpiamos el contenedor antes de renderizar
        listaEventos.innerHTML = '';

        eventos.forEach(e => {
            const card = document.createElement('div');
            card.className = 'event-card';

            // 🛡️ Lógica de Control: Solo mostramos el botón si somos los dueños (Persona 4)
            const btnBorrar = (e.creador_id == miId) 
                ? `<button onclick="eliminarEvento(${e.id})" class="btn-secundario" 
                    style="margin-top:10px; color: #dc3545; border-color: #dc3545; width: 100%;">
                    Eliminar Evento 🗑️
                   </button>` 
                : '';
            
            card.innerHTML = `
                <h4>${e.titulo}</h4>
                <p>${e.descripcion || 'Sin descripción adicional.'}</p>
                <div class="meta" style="margin-bottom: 10px;">
                    <strong>📅 Fecha:</strong> ${new Date(e.fecha_evento).toLocaleString()}<br>
                    <strong>👤 Organiza:</strong> ${e.nombre} ${e.apellido}
                </div>
                ${btnBorrar}
            `;
            listaEventos.appendChild(card);
        });

    } catch (err) {
        console.error("🚨 Error al conectar con el servidor de eventos:", err);
        listaEventos.innerHTML = '<p style="color: red;">Error al cargar el calendario.</p>';
    }
}

// --- 2. CREAR NUEVO EVENTO (SUBMIT) ---
if (formEvento) {
    formEvento.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nuevoEvento = {
            creador_id: miId,
            titulo: document.getElementById('ev-titulo').value.trim(),
            descripcion: document.getElementById('ev-desc').value.trim(),
            fecha_evento: document.getElementById('ev-fecha').value
        };

        if (!nuevoEvento.creador_id) {
            alert("❌ Error de sesión. Por favor, inicia sesión de nuevo.");
            return;
        }

        try {
            const res = await fetch('/api/eventos/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoEvento)
            });

            if (res.ok) {
                alert("✅ Evento organizado con éxito 📅");
                formEvento.reset(); 
                cargarEventos();    
            } else {
                const errorData = await res.json();
                alert("❌ " + errorData.error);
            }
        } catch (err) {
            alert("🚨 Error de conexión al crear el evento.");
        }
    });
}

// --- 3. [NUEVO] FUNCIÓN PARA ELIMINAR EVENTO ---
// La definimos en el objeto window para que el onclick del HTML pueda encontrarla
window.eliminarEvento = async function(id) {
    if (!confirm("¿Seguro que quieres cancelar este evento? Esta acción no se puede deshacer.")) return;

    try {
        // Enviamos el usuario_id como query parameter para la validación del backend
        const res = await fetch(`/api/eventos/${id}?usuario_id=${miId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            cargarEventos(); // Refrescamos la lista tras borrar
        } else {
            const error = await res.json();
            alert("❌ " + error.error);
        }
    } catch (err) {
        console.error("🚨 Error al intentar eliminar el evento:", err);
    }
};

// --- 🚀 INICIO DE CARGA ---
cargarEventos();