// public/js/usuario_global.js
const navNombre = document.getElementById('nav-nombre');
const postPlaceholder = document.getElementById('post-contenido');
const idUsuarioActual = 1; // Tu ID de Arquitecto

async function cargarNombreGlobal() {
    try {
        const res = await fetch(`/api/usuarios/ajustes/${idUsuarioActual}`);
        const datos = await res.json();
        
        if (datos && datos.nombre) {
            // 1. Actualiza el enlace del perfil en el menú
            if (navNombre) navNombre.innerText = `${datos.nombre} ${datos.apellido}`;
            
            // 2. Actualiza el saludo en el cuadro de publicación
            if (postPlaceholder) {
                postPlaceholder.placeholder = `¿Qué estás pensando, ${datos.nombre}?`;
            }
        }
    } catch (err) {
        console.error("Error al cargar identidad global:", err);
    }
}

cargarNombreGlobal();