// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (IDENTIDAD GLOBAL & FILTRADO POR ROL)
// ARCHIVO: usuario_global.js
// =============================================

// --- 1. 👤 LÓGICA DE IDENTIDAD VISUAL (Arquitecto) ---

/**
 * Gestiona el nombre y el avatar (Foto real vs Iniciales)
 * @param {Object} datos - Datos del usuario desde la DB
 */
function establecerIdentidad(datos) {
    const nombreMenuSpan = document.getElementById('user-name-text');
    const contenedorNavLink = document.querySelector('.nav-user-link');

    if (nombreMenuSpan) {
        nombreMenuSpan.textContent = `${datos.nombre} ${datos.apellido}`;
    }

    if (contenedorNavLink) {
        // --- 🛡️ LIMPIEZA ABSOLUTA (ELIMINA DUPLICADOS) ---
        // Borramos TODOS los hijos del contenedor excepto el span del nombre.
        // Esto elimina iconos <i>, cuadros "SC" y círculos "s" sobrantes.
        Array.from(contenedorNavLink.childNodes).forEach(node => {
            if (node.id !== 'user-name-text') {
                node.remove();
            }
        });

        const nuevoAvatar = document.createElement('div');
        nuevoAvatar.className = 'avatar-hibrido';

        // --- 🏗️ LÓGICA DE RUTA (FIX 404) ---
        if (datos.foto_url && datos.foto_url !== 'default.png') {
            // Usamos ruta absoluta /uploads/perfiles/ y fallback a /img/default.png
            nuevoAvatar.innerHTML = `
                <img src="/uploads/perfiles/${datos.foto_url}" 
                     class="avatar-img-real" 
                     onerror="this.src='/img/default.png'">`;
        } else {
            // Generamos las iniciales y el color dinámico si no hay foto
            const iniciales = (datos.nombre.charAt(0) + (datos.apellido ? datos.apellido.charAt(0) : "")).toUpperCase();
            nuevoAvatar.innerHTML = `<div class="avatar-dinamico-ui">${iniciales}</div>`;
            nuevoAvatar.firstChild.style.backgroundColor = generarColorPorNombre(datos.nombre);
        }

        // Insertar al principio del enlace (antes del texto del nombre)
        contenedorNavLink.prepend(nuevoAvatar);
    }
}

/**
 * Genera un color consistente basado en la longitud del nombre
 */
function generarColorPorNombre(nombre) {
    const colores = ['#3498db', '#9b59b6', '#2ecc71', '#e67e22', '#e74c3c'];
    return colores[nombre.length % colores.length];
}

// --- 2. ⚙️ CARGA GLOBAL Y CONTROL DE NAVEGACIÓN ---

async function cargarIdentidadGlobal() {
    const miId = localStorage.getItem('usuarioId');
    const miRol = localStorage.getItem('rol') || localStorage.getItem('usuarioRol'); 
    
    const postPlaceholder = document.getElementById('post-contenido');
    const btnAdminNav = document.getElementById('btn-admin-nav');
    const enlaceEventos = document.getElementById('nav-eventos');

    // A. Control del Panel de Administración según Rol
    if (btnAdminNav) {
        if (miRol === 'admin') {
            btnAdminNav.classList.add('nav-admin-visible');
            btnAdminNav.classList.remove('nav-element-hidden');
        } else {
            btnAdminNav.classList.add('nav-element-hidden');
            btnAdminNav.classList.remove('nav-admin-visible');
        }
    }

    // B. Limpieza de interfaz (Ocultar eventos)
    if (enlaceEventos) {
        enlaceEventos.classList.add('nav-element-hidden');
    }

    // C. Carga de datos del perfil
    if (!miId) return;

    try {
        const res = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await res.json();

        if (res.ok && datos.nombre) {
            // Ejecutamos la lógica de Avatar y Nombre
            establecerIdentidad(datos);
            
            // Personalizar placeholder del muro si existe
            if (postPlaceholder) {
                postPlaceholder.placeholder = `¿Qué estás pensando, ${datos.nombre}?`;
            }
            console.log(`✅ Identidad Híbrida limpia cargada para: ${datos.nombre}`);
        }
    } catch (err) {
        console.error("🚨 Error al cargar la identidad global:", err);
    }
}

// --- 3. 🚀 REGISTRO DEL SERVICE WORKER (Lógica del Yeti) ---

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registro) => {
                console.log('✅ Service Worker del Yeti activo en:', registro.scope);
            })
            .catch((error) => {
                console.error('🚨 Error al registrar el Service Worker:', error);
            });
    });
}

// Disparar carga al estar listo el DOM
document.addEventListener('DOMContentLoaded', cargarIdentidadGlobal);