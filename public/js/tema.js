// public/js/tema.js
const btnTema = document.getElementById('btn-tema');
const themeIcon = document.getElementById('theme-icon'); // Referencia al icono
const body = document.body;

// 1. Cargar el tema guardado al iniciar
const temaGuardado = localStorage.getItem('tema') || 'claro';
aplicarTema(temaGuardado);

// 2. Escuchar el clic en el botón
btnTema.addEventListener('click', () => {
    // Si ya tiene dark-mode, el nuevo tema será claro, de lo contrario oscuro
    const nuevoTema = body.classList.contains('dark-mode') ? 'claro' : 'oscuro';
    aplicarTema(nuevoTema);
});

function aplicarTema(tema) {
    if (tema === 'oscuro') {
        body.classList.add('dark-mode');
        // ☀️ Cambiamos el icono a Sol cuando el fondo es oscuro
        if (themeIcon) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    } else {
        body.classList.remove('dark-mode');
        // 🌙 Cambiamos el icono a Luna cuando el fondo es claro
        if (themeIcon) {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    }
    // Guardamos la preferencia exacta
    localStorage.setItem('tema', tema);
}