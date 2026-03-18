// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (IDENTIDAD GLOBAL & FILTRADO POR ROL)
// ARCHIVO: usuario_global.js
// =============================================

async function cargarIdentidadGlobal() {
    const miId = localStorage.getItem('usuarioId');
    const miRol = localStorage.getItem('rol') || localStorage.getItem('usuarioRol'); 
    
    const navNombre = document.getElementById('nav-nombre');
    const postPlaceholder = document.getElementById('post-contenido');
    const btnAdminNav = document.getElementById('btn-admin-nav');
    const enlaceEventos = document.getElementById('nav-eventos');

    // --- 1. ⚙️ CONTROL DE NAVEGACIÓN SEGÚN ROL ---
    
    // A. Control del Panel de Administración
    if (btnAdminNav) {
        if (miRol === 'admin') {
            btnAdminNav.classList.add('nav-admin-visible');
            btnAdminNav.classList.remove('nav-element-hidden');
        } else {
            btnAdminNav.classList.add('nav-element-hidden');
            btnAdminNav.classList.remove('nav-admin-visible');
        }
    }

    // B. ✅ LIMPIEZA TOTAL DE EVENTOS EN LA NAV
    if (enlaceEventos) {
        enlaceEventos.classList.add('nav-element-hidden');
        console.log("扫 Nav: Enlace de eventos oculto para simplificar la interfaz.");
    }

    // --- 2. 👤 CARGA DE NOMBRE Y PERSONALIZACIÓN ---
    if (!miId) return;

    try {
        const res = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await res.json();

        if (res.ok && datos.nombre) {
            if (navNombre) {
                navNombre.innerText = `${datos.nombre} ${datos.apellido}`;
            }
            
            if (postPlaceholder) {
                postPlaceholder.placeholder = `¿Qué estás pensando, ${datos.nombre}?`;
            }
            
            console.log(`✅ Identidad cargada: ${datos.nombre} | Rol: ${miRol}`);
        }
    } catch (err) {
        console.error("🚨 Error al cargar la identidad global:", err);
    }
}

document.addEventListener('DOMContentLoaded', cargarIdentidadGlobal);