// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE PENSAMIENTOS EFÍMEROS - VERSIÓN INDUSTRIAL)
// ARCHIVO: public/js/notas.js
// =============================================

const miIdNota = localStorage.getItem('usuarioId');

async function cargarNotas() {
    if (!miIdNota) return;

    try {
        const contenedor = document.getElementById('notas-dinamicas');
        if (!contenedor) return;

        const res = await fetch(`/api/notas/activas/${miIdNota}`);
        const notas = await res.json();
        
        contenedor.innerHTML = '';

        if (notas.length === 0) {
            contenedor.innerHTML = '<p class="notas-vacias">Sin notas...</p>';
            return;
        }

        notas.forEach(nota => {
            const div = document.createElement('div');
            const esMia = String(nota.usuario_id) === String(miIdNota);
            
            // 🛠️ SINCRONIZACIÓN DE CLASES INDUSTRIALES
            div.className = `nota-item ${esMia ? 'nota-item-mia' : ''}`;
            
            // 🧠 LÓGICA DE AVATAR DINÁMICO (Sincronizada con Identidad Global)
            // Extraemos hasta 2 iniciales (Ej: Michelle Carvajal -> MC)
            const iniciales = nota.nombre 
                ? nota.nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                : '?';
            
            const avatarHtml = (nota.foto_url && nota.foto_url !== 'default.png' && nota.foto_url !== 'null' && nota.foto_url !== '')
                ? `<img src="/img/${nota.foto_url}" class="nota-avatar" onerror="this.onerror=null; this.src='/img/default.png';">`
                : `<div class="avatar-dinamico-nav nota-avatar" style="width: 100%; height: 100%; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                       <span class="iniciales-text" style="font-size: 0.9rem; color: white; font-weight: 800;">${iniciales}</span>
                   </div>`;

            div.innerHTML = `
                <div class="nota-texto-preview" title="${nota.contenido}">
                    ${nota.contenido}
                </div>
                <div class="nota-burbuja">
                    ${avatarHtml}
                </div>
                <small class="nota-nombre">
                    ${esMia ? 'Tú' : nota.nombre}
                </small>
            `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("❌ Error al cargar notas:", err);
    }
}

// --- ✍️ CREACIÓN DE NOTA (LÓGICA FUNCIONAL 100%) ---
window.abrirModalNota = async function() {
    const pensamiento = prompt("¿Qué tienes en mente? (Máximo 60 caracteres)");
    
    if (pensamiento === null || pensamiento.trim() === "") return;

    try {
        const textoLimpio = pensamiento.trim().substring(0, 60);
        
        const res = await fetch('/api/notas/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: miIdNota,
                texto: textoLimpio 
            })
        });

        if (res.ok) {
            cargarNotas(); 
        } else {
            const data = await res.json();
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error("❌ Error de red al crear nota:", err);
        alert("No se pudo conectar con el servidor.");
    }
};

document.addEventListener('DOMContentLoaded', cargarNotas);