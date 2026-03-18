// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (BUSCADOR PREDICTIVO P5)
// ARCHIVO: public/js/buscar.js
// =============================================

const inputBusqueda = document.getElementById('input-busqueda');
const listaResultados = document.getElementById('resultados-busqueda');
const miIdActual = localStorage.getItem('usuarioId');

// --- 1. ESCUCHA DE ENTRADA (Búsqueda en tiempo real) ---
if (inputBusqueda) {
    inputBusqueda.addEventListener('input', async (e) => {
        const texto = e.target.value.trim();

        if (texto.length < 2) {
            listaResultados.classList.add('results-hidden');
            listaResultados.classList.remove('results-visible');
            listaResultados.innerHTML = '';
            return;
        }

        try {
            const res = await fetch(`/api/usuarios/buscar?q=${texto}&miId=${miIdActual}`);
            const usuarios = await res.json();

            if (usuarios.length > 0) {
                listaResultados.classList.add('results-visible');
                listaResultados.classList.remove('results-hidden');
                
                listaResultados.innerHTML = usuarios.map(u => `
                    <div class="search-result-item" 
                         onclick="window.location.href='perfil.html?id=${u.usuario_id}'">
                        
                        <img src="img/${u.foto_url || 'default.png'}" class="search-result-avatar">
                        
                        <div class="search-result-info">
                            <span class="search-result-name">
                                ${u.nombre} ${u.apellido}
                            </span>
                            <small class="search-result-bio">
                                ${u.bio || 'Usuario de Facebook Local'}
                            </small>
                        </div>
                    </div>
                `).join('');
            } else {
                listaResultados.classList.add('results-visible');
                listaResultados.classList.remove('results-hidden');
                listaResultados.innerHTML = `
                    <p class="search-empty-msg">
                        No encontramos a nadie llamado "${texto}". 🔍
                    </p>`;
            }
        } catch (err) {
            console.error("🚨 Error en la búsqueda predictiva:", err);
            listaResultados.innerHTML = '<p class="search-error-msg">Error al conectar con el servidor.</p>';
        }
    });

    // --- 2. RE-ACTIVACIÓN ---
    inputBusqueda.addEventListener('focus', () => {
        if (inputBusqueda.value.trim().length >= 2) {
            listaResultados.classList.add('results-visible');
            listaResultados.classList.remove('results-hidden');
        }
    });
}

// --- 3. GESTIÓN DE VISIBILIDAD ---
document.addEventListener('click', (e) => {
    const contenedor = document.querySelector('.buscador-contenedor');
    if (contenedor && !contenedor.contains(e.target)) {
        listaResultados.classList.add('results-hidden');
        listaResultados.classList.remove('results-visible');
    }
});