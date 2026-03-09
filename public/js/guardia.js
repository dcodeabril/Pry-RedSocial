// public/js/guardia.js
(function() {
    const sesion = localStorage.getItem('usuarioId');
    
    // Si no hay ID de usuario, lo mandamos de patitas a la calle (al login)
    if (!sesion) {
        window.location.href = '/';
    }
})();