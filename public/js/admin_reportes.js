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
                <td style="padding: 10px;">
                    <button onclick="eliminarPost(${r.post_id}, ${r.reporte_id})" class="btn-primario" style="background: #dc3545; margin-bottom: 5px;">Borrar Post 🗑️</button>
                    <button onclick="ignorarReporte(${r.reporte_id})" class="btn-secundario">Ignorar 👐</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

// 🛡️ ACCIÓN 1: Eliminar el post reportado
window.eliminarPost = async function(postId, reporteId) {
    if (!confirm("¿Seguro que deseas ELIMINAR esta publicación? No se puede deshacer.")) return;
    
    // Usamos el ID del Admin (suponiendo que eres tú, ID 1)
    const adminId = 1; 

    try {
        // Llamamos a la API de publicaciones que ya tiene el DELETE
        const res = await fetch(`/api/publicaciones/${postId}?usuario_id=${adminId}`, { method: 'DELETE' });
        
        if (res.ok) {
            alert("Post eliminado por infracción de normas. ✅");
            await ignorarReporte(reporteId); // Cerramos el reporte automáticamente
        }
    } catch (err) {
        console.error(err);
    }
};

// 🛡️ ACCIÓN 2: Ignorar (Resolver sin borrar)
window.ignorarReporte = async function(id) {
    try {
        await fetch(`/api/reportes/admin/resolver/${id}`, { method: 'PATCH' });
        cargarReportes();
    } catch (err) {
        console.error(err);
    }
};

cargarReportes();