// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (IDENTIDAD GLOBAL & FILTRADO POR ROL)
// ARCHIVO: usuario_global.js
// =============================================

async function cargarIdentidadGlobal() {
    // 🛡️ Recuperamos los datos de sesión desde el navegador
    const miId = localStorage.getItem('usuarioId');
    const miRol = localStorage.getItem('rol') || localStorage.getItem('usuarioRol'); 
    
    const navNombre = document.getElementById('nav-nombre');
    const postPlaceholder = document.getElementById('post-contenido');
    const btnAdminNav = document.getElementById('btn-admin-nav');
    const enlaceEventos = document.getElementById('nav-eventos');

    // --- 1. ⚙️ CONTROL DE NAVEGACIÓN SEGÚN ROL ---
    
    // A. Control del Panel de Administración (Botón de engranaje)
    // Solo Israel (Admin) puede ver este acceso directo
    if (btnAdminNav) {
        btnAdminNav.style.display = (miRol === 'admin') ? 'inline-block' : 'none';
    }

    // B. ✅ LIMPIEZA TOTAL DE EVENTOS EN LA NAV
    // Ocultamos el enlace 'Eventos' para TODOS los roles. 
    // La creación se gestiona ahora únicamente por el botón "➕ Crear Evento"
    if (enlaceEventos) {
        enlaceEventos.style.display = 'none';
        console.log("🧹 Nav: Enlace de eventos oculto para simplificar la interfaz.");
    }

    // --- 2. 👤 CARGA DE NOMBRE Y PERSONALIZACIÓN (Persona 5) ---
    if (!miId) return;

    try {
        const res = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await res.json();

        if (res.ok && datos.nombre) {
            // Actualizamos el nombre en la cabecera (Navbar)
            if (navNombre) {
                navNombre.innerText = `${datos.nombre} ${datos.apellido}`;
            }
            
            // Personalizamos el saludo en la caja de publicaciones del muro
            if (postPlaceholder) {
                postPlaceholder.placeholder = `¿Qué estás pensando, ${datos.nombre}?`;
            }
            
            console.log(`✅ Identidad cargada: ${datos.nombre} | Rol: ${miRol}`);
        }
    } catch (err) {
        console.error("🚨 Error al cargar la identidad global:", err);
    }
}

// Ejecutamos la carga cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarIdentidadGlobal);