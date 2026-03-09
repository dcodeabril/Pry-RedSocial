// public/js/tema.js
const btnTema = document.getElementById('btn-tema');
const body = document.body;

// 1. Cargar el tema guardado al iniciar
const temaGuardado = localStorage.getItem('tema') || 'claro';
aplicarTema(temaGuardado);

// 2. Escuchar el clic en el interruptor
btnTema.addEventListener('click', () => {
    const nuevoTema = body.classList.contains('dark-mode') ? 'claro' : 'oscuro';
    aplicarTema(nuevoTema);
});

function aplicarTema(tema) {
    if (tema === 'oscuro') {
        body.classList.add('dark-mode');
        btnTema.innerText = '☀️ Modo Claro';
    } else {
        body.classList.remove('dark-mode');
        btnTema.innerText = '🌙 Modo Oscuro';
    }
    localStorage.setItem('tema', tema);
}