// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (SISTEMA DE SEGURIDAD P1)
// ARCHIVO: public/js/guardia.js
// =============================================

(function() {
    const usuarioId = localStorage.getItem('usuarioId');
    const path = window.location.pathname;

    // 🔍 Detectamos si el usuario está en la zona de Login
    // (Acepta '/', '/index.html' (si fuera el login), o '/auth.html')
    const esPaginaLogin = path.includes('auth.html') || path === '/' || path.endsWith('/');

    // 🚩 CASO 1: No hay sesión e intenta entrar a páginas protegidas (Muro, Perfil, etc.)
    if (!usuarioId && !esPaginaLogin) {
        console.warn("⛔ Acceso denegado. Redirigiendo al Login...");
        window.location.href = '/'; 
        return; // Detenemos la ejecución
    }
    
    // 🚩 CASO 2: Ya hay sesión e intenta volver al Login (auth.html)
    // Lo mandamos directo al Muro para que no pierda tiempo
    if (usuarioId && esPaginaLogin) {
        console.log("✅ Sesión activa. Llevándote al Muro...");
        window.location.href = 'index.html';
        return;
    }

    // Si no cae en ninguno de los dos casos, el guardia lo deja pasar tranquilamente.
    console.log("👮 Guardia: Acceso verificado.");
})();