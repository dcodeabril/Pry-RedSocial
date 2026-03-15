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

        // 🛡️ Validación: Si el texto es muy corto, limpiamos y ocultamos
        if (texto.length < 2) {
            listaResultados.style.display = 'none';
            listaResultados.innerHTML = '';
            return;
        }

        try {
            // 📡 Consultamos a la API enviando el texto y nuestro ID para excluirnos de los resultados
            const res = await fetch(`/api/usuarios/buscar?q=${texto}&miId=${miIdActual}`);
            const usuarios = await res.json();

            if (usuarios.length > 0) {
                listaResultados.style.display = 'block';
                
                // 🎨 Dibujamos cada resultado encontrado
                listaResultados.innerHTML = usuarios.map(u => `
                    <div class="search-result-item" 
                         style="display: flex; align-items: center; padding: 12px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background 0.2s;"
                         onclick="window.location.href='perfil.html?id=${u.usuario_id}'"
                         onmouseover="this.style.background='var(--bg-color)'" 
                         onmouseout="this.style.background='transparent'">
                        
                        <img src="img/${u.foto_url || 'default.png'}" 
                             style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">
                        
                        <div style="margin-left: 12px;">
                            <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-color); display: block;">
                                ${u.nombre} ${u.apellido}
                            </span>
                            <small style="color: var(--text-muted); font-size: 0.8rem;">
                                ${u.bio || 'Usuario de Facebook Local'}
                            </small>
                        </div>
                    </div>
                `).join('');
            } else {
                // 🔍 Caso: No hay coincidencias
                listaResultados.style.display = 'block';
                listaResultados.innerHTML = `
                    <p style="padding: 15px; font-size: 0.85rem; color: var(--text-muted); text-align: center; margin: 0;">
                        No encontramos a nadie llamado "${texto}". 🔍
                    </p>`;
            }
        } catch (err) {
            console.error("🚨 Error en la búsqueda predictiva:", err);
            listaResultados.innerHTML = '<p style="padding: 10px; color: red;">Error al conectar con el servidor.</p>';
        }
    });

    // --- 2. RE-ACTIVACIÓN (Mostrar si se hace foco y ya hay texto) ---
    inputBusqueda.addEventListener('focus', () => {
        if (inputBusqueda.value.trim().length >= 2) {
            listaResultados.style.display = 'block';
        }
    });
}

// --- 3. GESTIÓN DE VISIBILIDAD (Cerrar al hacer clic fuera) ---
document.addEventListener('click', (e) => {
    // Si el clic NO fue dentro del contenedor del buscador, cerramos la lista
    const contenedor = document.querySelector('.buscador-contenedor');
    if (contenedor && !contenedor.contains(e.target)) {
        listaResultados.style.display = 'none';
    }
});