// =============================================
// PROYECTO: FACEBOOK LOCAL
// ROL: CONTROL DE ILUMINACIÓN (SISTEMA GLOBAL)
// ARCHIVO: tema.js
// =============================================

const btnTema = document.getElementById('btn-tema');
const themeIcon = document.getElementById('theme-icon'); 
const body = document.body;

// 1. CARGA INICIAL
const temaGuardado = localStorage.getItem('tema') || 'claro';
aplicarTema(temaGuardado);

// 2. DISPARADOR DE CAMBIO SEGURIZADO
if (btnTema) {
    btnTema.addEventListener('click', () => {
        const nuevoTema = body.classList.contains('dark-mode') ? 'claro' : 'oscuro';
        aplicarTema(nuevoTema);
    });
}

/**
 * FUNCIÓN MAESTRA DE RENDERIZADO
 */
function aplicarTema(tema) {
    // --- SECCIÓN: ACCIÓN CAMBIO MODO OSCURO ---
    if (tema === 'oscuro') {
        body.classList.add('dark-mode');
        // Icono Sol para modo oscuro
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        body.classList.remove('dark-mode');
        // Icono Luna para modo claro
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
    // --- FIN ACCIÓN ---

    // PERSISTENCIA
    localStorage.setItem('tema', tema);
}