// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (BUSCADOR PREDICTIVO - VERSIÓN INDUSTRIAL)
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
                
                listaResultados.innerHTML = usuarios.map(u => {
                    // 🧠 MOTOR DE IDENTIDAD HÍBRIDA (Sincronizado)
                    const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim();
                    const iniciales = (u.nombre.charAt(0) + (u.apellido ? u.apellido.charAt(0) : "")).toUpperCase();
                    
                    // 🛡️ REGLA HÍBRIDA: ¿Foto real o iniciales?
                    const tieneFotoReal = u.foto_url && 
                                          u.foto_url !== 'default.png' && 
                                          u.foto_url !== 'null' && 
                                          u.foto_url !== '' && 
                                          !u.foto_url.includes('default');

                    // Generar el HTML del Avatar según disponibilidad
                    let avatarHtml = '';
                    if (tieneFotoReal) {
                        // Forzamos la ruta a la carpeta de subidas
                        avatarHtml = `<img src="/uploads/perfiles/${u.foto_url}" class="search-result-avatar" onerror="this.src='/img/default.png'">`;
                    } else {
                        // Sincronizado con generarColorPorNombre de usuario_global.js
                        const colorFondo = typeof generarColorPorNombre === 'function' ? generarColorPorNombre(u.nombre) : '#3B82F6';
                        avatarHtml = `<div class="search-avatar-initial" style="background-color: ${colorFondo}">${iniciales}</div>`;
                    }

                    return `
                        <div class="search-result-item" 
                             onclick="window.location.href='perfil.html?id=${u.usuario_id}'">
                            
                            <div class="search-avatar-wrapper">${avatarHtml}</div>
                            
                            <div class="search-result-info">
                                <span class="search-result-name">${u.nombre} ${u.apellido}</span>
                                <small class="search-result-bio">${u.bio || 'Usuario de Facebook Local'}</small>
                            </div>
                        </div>
                    `;
                }).join('');
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

    // --- 2. RE-ACTIVACIÓN AL ENFOCAR ---
    inputBusqueda.addEventListener('focus', () => {
        if (inputBusqueda.value.trim().length >= 2) {
            listaResultados.classList.add('results-visible');
            listaResultados.classList.remove('results-hidden');
        }
    });
}

// --- 3. GESTIÓN DE VISIBILIDAD (Cerrar al hacer clic fuera) ---
document.addEventListener('click', (e) => {
    const contenedor = document.querySelector('.buscador-contenedor');
    if (contenedor && !contenedor.contains(e.target)) {
        listaResultados.classList.add('results-hidden');
        listaResultados.classList.remove('results-visible');
    }
});