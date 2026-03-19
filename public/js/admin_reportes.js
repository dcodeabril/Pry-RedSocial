// =============================================
// PROYECTO: FACEBOOK LOCAL (SISTEMA GLOBAL)
// ROL: ARQUITECTO DE JUSTICIA (MODERACIÓN)
// ARCHIVO: admin_reportes.js
// =============================================

const tabla = document.getElementById('tabla-reportes');
const statsJusticia = document.getElementById('stats-justicia');

async function cargarReportes() {
    try {
        const res = await fetch('/api/reportes/admin/lista');
        const reportes = await res.json();

        if (statsJusticia) {
            statsJusticia.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${reportes.length} Casos`;
        }

        if (reportes.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5" class="tabla-vacia">
                        <div class="empty-state">
                            <i class="fa-solid fa-handshake"></i>
                            <p>No hay denuncias pendientes. ¡Paz total en la red! ✨</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tabla.innerHTML = reportes.map(r => `
            <tr class="reporte-fila">
                <td class="reporte-celda">
                    <div class="user-info-box">
                        <i class="fa-solid fa-user-shield"></i>
                        <span>${r.denunciante_nombre} ${r.denunciante_apellido}</span>
                    </div>
                </td>
                <td class="reporte-celda post-snippet" title="${r.post_contenido}">
                    "${r.post_contenido.substring(0, 80)}..."
                </td>
                <td class="reporte-celda">
                    <span class="autor-tag"><i class="fa-solid fa-user"></i> ${r.autor_nombre}</span>
                </td>
                <td class="reporte-celda">
                    <span class="reporte-motivo-pill">${r.motivo.toUpperCase()}</span>
                </td>
                <td class="reporte-celda reporte-acciones">
                    <div class="acciones-flex">
                        <button onclick="eliminarPost(${r.post_id}, ${r.reporte_id})" class="btn-action-icon btn-danger" title="Borrar Publicación">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        
                        <button onclick="suspenderUsuario(${r.autor_id || r.post_id_autor}, ${r.reporte_id})" class="btn-action-icon btn-dark" title="Suspender Usuario">
                            <i class="fa-solid fa-user-slash"></i>
                        </button>

                        <button onclick="ignorarReporte(${r.reporte_id})" class="btn-action-icon btn-success" title="Archivar/Ignorar">
                            <i class="fa-solid fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error en el tribunal de justicia:", err);
    }
}

// 🛡️ ACCIÓN 1: Eliminar Publicación
window.eliminarPost = async function(postId, reporteId) {
    if (!confirm("🚨 ¿CONFIRMAS ELIMINACIÓN? El contenido se borrará de forma permanente.")) return;
    
    const adminId = localStorage.getItem('usuarioId') || 1; 

    try {
        const res = await fetch(`/api/publicaciones/${postId}?usuario_id=${adminId}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Evidencia eliminada. ✅");
            await ignorarReporte(reporteId); 
        }
    } catch (err) {
        console.error("Error al ejecutar borrado:", err);
    }
};

// 🛡️ ACCIÓN 2: Suspensión de Cuenta
window.suspenderUsuario = async function(usuarioId, reporteId) {
    if (!confirm("⚠️ ¿SUSPENDER CUENTA? El usuario perderá acceso inmediato e indefinido.")) return;

    try {
        const res = await fetch(`/api/usuarios/suspendido/${usuarioId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: localStorage.getItem('usuarioId') || 1 }) 
        });

        if (res.ok) {
            alert("Usuario neutralizado. Justicia aplicada. ⚖️");
            await ignorarReporte(reporteId); 
        }
    } catch (err) {
        console.error("Error en el protocolo de suspensión:", err);
    }
};

// 🛡️ ACCIÓN 3: Archivar Reporte
window.ignorarReporte = async function(id) {
    try {
        await fetch(`/api/reportes/admin/resolver/${id}`, { method: 'PATCH' });
        cargarReportes(); 
    } catch (err) {
        console.error("Error al archivar:", err);
    }
};

cargarReportes();