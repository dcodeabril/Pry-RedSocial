// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (IDENTIDAD GLOBAL & ACCESO ADMIN P1)
// ARCHIVO: usuario_global.js
// =============================================

async function cargarIdentidadGlobal() {
    // 🛡️ Recuperamos los datos de sesión desde el navegador
    const miId = localStorage.getItem('usuarioId');
    // Verificamos el rol en ambas llaves posibles para mayor seguridad
    const miRol = localStorage.getItem('rol') || localStorage.getItem('usuarioRol'); 
    
    const navNombre = document.getElementById('nav-nombre');
    const postPlaceholder = document.getElementById('post-contenido');
    const btnAdminNav = document.getElementById('btn-admin-nav');

    // --- 1. ⚙️ CONTROL DE VISIBILIDAD ADMIN ---
    // En lugar de crear un botón nuevo, controlamos el que ya existe en el HTML
    if (btnAdminNav) {
        if (miRol === 'admin') {
            btnAdminNav.style.display = 'inline-block';
            console.log("🛡️ Modo Administrador Activado");
        } else {
            btnAdminNav.style.display = 'none';
        }
    }

    // --- 2. CARGA DE NOMBRE Y PERSONALIZACIÓN (Persona 5) ---
    if (!miId) return;

    try {
        const res = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await res.json();

        if (res.ok && datos.nombre) {
            // Actualizamos el nombre en la cabecera
            if (navNombre) {
                navNombre.innerText = `${datos.nombre} ${datos.apellido}`;
            }
            
            // Personalizamos el placeholder en el muro (index.html)
            if (postPlaceholder) {
                postPlaceholder.placeholder = `¿Qué estás pensando, ${datos.nombre}?`;
            }
            
            console.log(`✅ Identidad cargada: ${datos.nombre} | Rol: ${miRol}`);
        }
    } catch (err) {
        console.error("🚨 Error al cargar la identidad global:", err);
    }
}

// Ejecutamos la función automáticamente al cargar el script
document.addEventListener('DOMContentLoaded', cargarIdentidadGlobal);