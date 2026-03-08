// public/js/reportes.js
async function reportarPublicacion(postId) {
    const motivo = prompt("¿Cuál es el motivo del reporte? (Spam, Odio, Violencia, etc.)");
    
    if (!motivo) return;

    const datos = {
        denunciante_id: 1, // Tú (Arquitecto)
        publicacion_id: postId,
        motivo: motivo
    };

    try {
        const res = await fetch('/api/reportes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert("¡Gracias! El reporte ha sido enviado al administrador.");
        }
    } catch (err) {
        alert("Error al enviar el reporte.");
    }
}