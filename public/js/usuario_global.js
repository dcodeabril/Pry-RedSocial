// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (IDENTIDAD GLOBAL & ACCESO ADMIN P1)
// ARCHIVO: usuario_global.js
// =============================================

async function cargarIdentidadGlobal() {
    // 🛡️ Recuperamos los datos de sesión desde el navegador
    const miId = localStorage.getItem('usuarioId');
    const miRol = localStorage.getItem('usuarioRol'); // 🔑 Rol: 'admin' o 'usuario'
    
    const nav = document.querySelector('nav');
    const navNombre = document.getElementById('nav-nombre');
    const postPlaceholder = document.getElementById('post-contenido');
    const btnTema = document.getElementById('btn-tema');

    // --- 1. [NUEVO] BOTÓN DINÁMICO PARA EL ADMINISTRADOR ---
    // Si el rol es admin y estamos en una página con navegación
    if (miRol === 'admin' && nav) {
        // Evitamos crear el botón dos veces
        if (!document.getElementById('link-admin-panel')) {
            const linkAdmin = document.createElement('a');
            linkAdmin.id = 'link-admin-panel';
            linkAdmin.href = 'admin.html';
            linkAdmin.innerHTML = '⚙️ Panel Admin';
            linkAdmin.style.color = '#ff4757'; // Rojo suave para resaltar
            linkAdmin.style.fontWeight = 'bold';
            linkAdmin.style.marginRight = '15px';
            linkAdmin.style.textDecoration = 'none';

            // Lo insertamos justo antes del botón de modo oscuro
            if (btnTema) {
                nav.insertBefore(linkAdmin, btnTema);
            } else {
                nav.appendChild(linkAdmin);
            }
        }
    }

    // --- 2. CARGA DE NOMBRE Y PERSONALIZACIÓN (Persona 5) ---
    // Si no hay ID de usuario, no intentamos consultar la base de datos
    if (!miId) return;

    try {
        const res = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await res.json();

        if (res.ok && datos.nombre) {
            // Actualizamos el nombre en la cabecera
            if (navNombre) {
                navNombre.innerText = `${datos.nombre} ${datos.apellido}`;
            }
            
            // Personalizamos el "Qué estás pensando" en el muro
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
// Usamos DOMContentLoaded para asegurar que el <nav> ya exista
document.addEventListener('DOMContentLoaded', cargarIdentidadGlobal);