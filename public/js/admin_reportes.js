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
            // Estilos movidos a .tabla-vacia
            tabla.innerHTML = '<tr><td colspan="5" class="tabla-vacia">No hay denuncias pendientes. ¡Paz total! ✨</td></tr>';
            return;
        }

        tabla.innerHTML = reportes.map(r => `
            <tr class="reporte-fila">
                <td class="reporte-celda">${r.denunciante_nombre} ${r.denunciante_apellido}</td>
                <td class="reporte-celda post-snippet">"${r.post_contenido}"</td>
                <td class="reporte-celda">${r.autor_nombre} ${r.autor_apellido}</td>
                <td class="reporte-celda"><span class="reporte-motivo">${r.motivo}</span></td>
                <td class="reporte-celda reporte-acciones">
                    <button onclick="eliminarPost(${r.post_id}, ${r.reporte_id})" class="btn-justicia btn-eliminar-post">
                        Borrar Post 🗑️
                    </button>
                    
                    <button onclick="suspenderUsuario(${r.autor_id || r.post_id_autor}, ${r.reporte_id})" class="btn-justicia btn-suspender-autor">
                        Suspender Autor 🚫
                    </button>

                    <button onclick="ignorarReporte(${r.reporte_id})" class="btn-justicia btn-ignorar-reporte">
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
            body: JSON.stringify({ adminId: 1 }) 
        });

        if (res.ok) {
            alert("Usuario suspendido. El orden ha sido restaurado. ⚖️");
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
        cargarReportes(); 
    } catch (err) {
        console.error("Error al archivar reporte:", err);
    }
};

cargarReportes();