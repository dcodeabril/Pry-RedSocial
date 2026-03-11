// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (JUSTICIA SOCIAL P4)
// ARCHIVO: public/js/admin_reportes.js
// =============================================

const tabla = document.getElementById('tabla-reportes');

async function cargarReportes() {
    try {
        const res = await fetch('/api/reportes/admin/lista');
        const reportes = await res.json();

        if (reportes.length === 0) {
            tabla.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">No hay denuncias pendientes. ¡Paz total! ✨</td></tr>';
            return;
        }

        tabla.innerHTML = reportes.map(r => `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${r.denunciante_nombre} ${r.denunciante_apellido}</td>
                <td style="padding: 10px; font-style: italic;">"${r.post_contenido}"</td>
                <td style="padding: 10px;">${r.autor_nombre} ${r.autor_apellido}</td>
                <td style="padding: 10px;"><span style="color: #dc3545; font-weight: bold;">${r.motivo}</span></td>
                <td style="padding: 10px; display: flex; flex-direction: column; gap: 5px;">
                    <button onclick="eliminarPost(${r.post_id}, ${r.reporte_id})" class="btn-primario" 
                            style="background: #dc3545; border: none; padding: 5px; color: white; cursor: pointer;">
                        Borrar Post 🗑️
                    </button>
                    
                    <button onclick="suspenderUsuario(${r.autor_id || r.post_id_autor}, ${r.reporte_id})" class="btn-primario" 
                            style="background: #000; border: none; padding: 5px; color: white; cursor: pointer;">
                        Suspender Autor 🚫
                    </button>

                    <button onclick="ignorarReporte(${r.reporte_id})" class="btn-secundario" 
                            style="padding: 5px; cursor: pointer;">
                        Ignorar 👐
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error al cargar la tabla de justicia:", err);
    }
}

// 🛡️ ACCIÓN 1: Eliminar el post reportado
window.eliminarPost = async function(postId, reporteId) {
    if (!confirm("¿Seguro que deseas ELIMINAR esta publicación? No se puede deshacer.")) return;
    
    const adminId = 1; 

    try {
        const res = await fetch(`/api/publicaciones/${postId}?usuario_id=${adminId}`, { method: 'DELETE' });
        
        if (res.ok) {
            alert("Post eliminado por infracción de normas. ✅");
            await ignorarReporte(reporteId); 
        }
    } catch (err) {
        console.error("Error al eliminar post:", err);
    }
};

// 🛡️ ACCIÓN 2: Suspender cuenta de usuario
window.suspenderUsuario = async function(usuarioId, reporteId) {
    if (!confirm("⚠️ ¿Confirmas la suspensión permanente de este usuario? No podrá volver a entrar.")) return;

    try {
        const res = await fetch(`/api/usuarios/suspendido/${usuarioId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: 1 }) // Tu ID de Arquitecto
        });

        if (res.ok) {
            alert("Usuario suspendido. El orden ha sido restaurado. ⚖️");
            // Cerramos el reporte ya que el autor ya no existe/está bloqueado
            await ignorarReporte(reporteId); 
        } else {
            alert("Error al intentar suspender al usuario.");
        }
    } catch (err) {
        console.error("Error en la petición de suspensión:", err);
    }
};

// 🛡️ ACCIÓN 3: Ignorar (Resolver sin borrar)
window.ignorarReporte = async function(id) {
    try {
        await fetch(`/api/reportes/admin/resolver/${id}`, { method: 'PATCH' });
        cargarReportes(); // Refrescar la tabla
    } catch (err) {
        console.error("Error al archivar reporte:", err);
    }
};

cargarReportes();