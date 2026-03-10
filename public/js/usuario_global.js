// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (IDENTIDAD GLOBAL P1 & P5)
// ARCHIVO: usuario_global.js
// =============================================

async function cargarIdentidadGlobal() {
    // 🛡️ Recuperamos la "llave" del usuario desde el navegador
    const miId = localStorage.getItem('usuarioId');
    const navNombre = document.getElementById('nav-nombre');
    const postPlaceholder = document.getElementById('post-contenido');

    // Si no hay sesión, no intentamos cargar nada
    if (!miId) return;

    try {
        // Consultamos la API de ajustes que ya tenemos funcionando
        const res = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await res.json();

        if (res.ok && datos.nombre) {
            // 1. Actualizamos el nombre en el Menú de Navegación
            if (navNombre) {
                navNombre.innerText = `${datos.nombre} ${datos.apellido}`;
            }
            
            // 2. [Persona 5] Personalizamos el cuadro de texto del Muro
            // Esto hará que Lucero vea: "¿Qué estás pensando, Lucero?"
            if (postPlaceholder) {
                postPlaceholder.placeholder = `¿Qué estás pensando, ${datos.nombre}?`;
            }
            
            console.log(`✅ Identidad cargada: ${datos.nombre} ${datos.apellido}`);
        }
    } catch (err) {
        console.error("🚨 Error al cargar la identidad global:", err);
    }
}

// Ejecutamos la función automáticamente al cargar cualquier página
cargarIdentidadGlobal();