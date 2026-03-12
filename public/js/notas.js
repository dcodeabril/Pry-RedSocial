// =============================================
// ARCHIVO: js/notas.js
// ROL: GESTIÓN DE PENSAMIENTOS EFÍMEROS (#15)
// =============================================

// 🛡️ Usamos la misma llave que el resto del sistema
const miIdNota = localStorage.getItem('usuarioId');

async function cargarNotas() {
    if (!miIdNota) return;

    try {
        console.log("🔍 Solicitando notas al servidor para ID:", miIdNota);
        const res = await fetch(`/api/notas/muro/${miIdNota}`);
        const notas = await res.json();
        
        const contenedor = document.getElementById('notas-dinamicas');
        if (!contenedor) return;

        contenedor.innerHTML = '';

        if (notas.length === 0) {
            console.log("ℹ️ No hay notas de amigos para mostrar actualmente.");
        }

        notas.forEach(nota => {
            const div = document.createElement('div');
            div.className = 'nota-item';
            div.style = "flex: 0 0 80px; text-align: center; position: relative; margin-right: 10px;";
            
            // Verificamos si la nota pertenece al usuario actual
            const esMia = String(nota.usuario_id) === String(miIdNota);

            div.innerHTML = `
                <div class="nota-texto-preview" style="${esMia ? 'border-color: var(--primary); font-weight: bold;' : ''}">
                    ${nota.contenido}
                </div>
                <div class="nota-burbuja" style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid ${esMia ? 'var(--primary)' : '#ddd'}; margin: 0 auto 5px; overflow: hidden; background: #eee;">
                    <img src="${nota.foto_url && nota.foto_url !== 'default.png' ? nota.foto_url : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" 
                         style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <small style="font-size: 0.75rem; color: var(--text-muted);">${esMia ? 'Tú' : nota.nombre}</small>
            `;
            contenedor.appendChild(div);
        });
        console.log("✅ Notas renderizadas en el carrusel.");
    } catch (err) {
        console.error("❌ Error al cargar notas:", err);
    }
}

window.abrirModalNota = async function() {
    const pensamiento = prompt("¿Qué tienes en mente? (Máximo 60 caracteres)");
    
    // Si cancela o deja vacío, no hacemos nada
    if (pensamiento === null || pensamiento.trim() === "") return;

    try {
        console.log("🚀 Enviando nueva nota...", { id: miIdNota, texto: pensamiento });
        
        const res = await fetch('/api/notas/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: miIdNota,
                contenido: pensamiento
            })
        });

        const data = await res.json();

        if (res.ok) {
            console.log("✅ Nota guardada en Base de Datos:", data);
            cargarNotas(); // 🔄 Recarga inmediata del carrusel
        } else {
            console.error("⚠️ El servidor rechazó la nota:", data.error);
            alert("Error del servidor: " + data.error);
        }
    } catch (err) {
        console.error("❌ Error de red al crear nota:", err);
        alert("No se pudo conectar con el servidor.");
    }
};

// Carga inicial al detectar que el DOM está listo
document.addEventListener('DOMContentLoaded', cargarNotas);