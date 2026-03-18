// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (SISTEMA DE SEGURIDAD P1 + FILTRO DE ROLES)
// ARCHIVO: public/js/guardia.js
// =============================================

(function() {
    const usuarioId = localStorage.getItem('usuarioId');
    const rol = (localStorage.getItem('rol') || '').toLowerCase(); // Obtenemos el rol
    const path = window.location.pathname;

    // 🔍 Detectamos el tipo de página
    const esPaginaLogin = path.includes('auth.html') || path === '/' || path.endsWith('/');
    const esPaginaAdmin = path.includes('admin_'); // Detecta páginas como admin_reportes.html

    // 🚩 CASO 1: No hay sesión e intenta entrar a cualquier página protegida
    if (!usuarioId && !esPaginaLogin) {
        console.warn("⛔ Acceso denegado. Redirigiendo al Login...");
        window.location.href = '/'; 
        return;
    }
    
    // 🚩 CASO 2: Sesión activa intentando entrar al Login
    if (usuarioId && esPaginaLogin) {
        console.log("✅ Sesión activa. Llevándote al Muro...");
        window.location.href = 'index.html';
        return;
    }

    // 🚩 CASO 3: Protección de Rutas Administrativas (EL NUEVO FILTRO)
    if (esPaginaAdmin && rol !== 'admin') {
        console.error("🚫 ¡ALERTA! Intento de acceso administrativo no autorizado.");
        alert("No tienes permisos de administrador para ver esta sección. 🛑");
        window.location.href = 'index.html'; // Lo mandamos al muro
        return;
    }

    // Si pasa estos filtros, el acceso es legítimo
    console.log(`👮 Guardia: Acceso verificado para [${rol.toUpperCase()}]`);
})();