// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: GESTIÓN DE PENSAMIENTOS EFÍMEROS (#15)
// ARCHIVO: public/js/notas.js
// =============================================

// 🛡️ Identidad del usuario actual
const miIdNota = localStorage.getItem('usuarioId');

/**
 * Carga las notas propias y de amigos en el carrusel superior
 */
async function cargarNotas() {
    if (!miIdNota) return;

    try {
        const contenedor = document.getElementById('notas-dinamicas');
        if (!contenedor) return;

        console.log("🔍 Solicitando notas al servidor para ID:", miIdNota);
        // Usamos el endpoint 'activas' definido en notas.routes.js
        const res = await fetch(`/api/notas/activas/${miIdNota}`);
        const notas = await res.json();
        
        contenedor.innerHTML = '';

        if (notas.length === 0) {
            console.log("ℹ️ No hay notas para mostrar actualmente.");
            contenedor.innerHTML = '<p style="font-size: 0.8rem; opacity: 0.5; padding-left: 15px;">Sin notas...</p>';
            return;
        }

        notas.forEach(nota => {
            const div = document.createElement('div');
            div.className = 'nota-item';
            div.style = "flex: 0 0 85px; text-align: center; position: relative; margin-right: 15px; cursor: default;";
            
            // Verificamos si la nota pertenece al usuario actual
            const esMia = String(nota.usuario_id) === String(miIdNota);

            div.innerHTML = `
                <div class="nota-texto-preview" 
                     style="${esMia ? 'border-color: var(--primary); font-weight: bold; background: #e7f3ff;' : ''}"
                     title="${nota.contenido}">
                    ${nota.contenido}
                </div>
                <div class="nota-burbuja" 
                     style="width: 65px; height: 65px; border-radius: 50%; border: 3px solid ${esMia ? 'var(--primary)' : 'var(--border-color)'}; margin: 0 auto 5px; overflow: hidden; background: #eee;">
                    <img src="img/${nota.foto_url || 'default.png'}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
                </div>
                <small style="font-size: 0.75rem; color: var(--text-color); font-weight: ${esMia ? 'bold' : 'normal'};">
                    ${esMia ? 'Tú' : nota.nombre}
                </small>
            `;
            contenedor.appendChild(div);
        });
        console.log("✅ Notas renderizadas en el carrusel.");
    } catch (err) {
        console.error("❌ Error al cargar notas:", err);
    }
}

/**
 * Abre el prompt para que el usuario escriba su pensamiento
 */
window.abrirModalNota = async function() {
    const pensamiento = prompt("¿Qué tienes en mente? (Máximo 60 caracteres)");
    
    // Si cancela, deja vacío o solo espacios, no hacemos nada
    if (pensamiento === null || pensamiento.trim() === "") return;

    try {
        const textoLimpio = pensamiento.trim().substring(0, 60);
        console.log("🚀 Enviando nueva nota...", { id: miIdNota, texto: textoLimpio });
        
        const res = await fetch('/api/notas/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: miIdNota,
                texto: textoLimpio // Sincronizado con notas.routes.js
            })
        });

        const data = await res.json();

        if (res.ok) {
            console.log("✅ Nota guardada con éxito:", data);
            cargarNotas(); // 🔄 Recarga inmediata para ver el cambio
        } else {
            console.error("⚠️ El servidor rechazó la nota:", data.error);
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error("❌ Error de red al crear nota:", err);
        alert("No se pudo conectar con el servidor.");
    }
};

// Carga inicial al detectar que el DOM está listo
document.addEventListener('DOMContentLoaded', cargarNotas);