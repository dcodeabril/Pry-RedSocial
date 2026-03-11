// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (BUSCADOR PREDICTIVO P5)
// ARCHIVO: public/js/buscar.js
// =============================================

const inputBusqueda = document.getElementById('input-busqueda');
const listaResultados = document.getElementById('resultados-busqueda');
const miIdActual = localStorage.getItem('usuarioId');

// --- 1. ESCUCHA DE ENTRADA (Búsqueda en tiempo real) ---
inputBusqueda.addEventListener('input', async (e) => {
    const texto = e.target.value.trim();

    // 🛡️ Validación: Si el texto es muy corto, limpiamos y ocultamos
    if (texto.length < 2) {
        listaResultados.style.display = 'none';
        listaResultados.innerHTML = '';
        return;
    }

    try {
        // 📡 Consultamos a la API enviando el texto y nuestro ID para excluirnos
        const res = await fetch(`/api/usuarios/buscar?q=${texto}&miId=${miIdActual}`);
        const usuarios = await res.json();

        if (usuarios.length > 0) {
            listaResultados.style.display = 'block';
            
            // 🎨 Dibujamos cada resultado encontrado con estilo de "ítem de notificación"
            listaResultados.innerHTML = usuarios.map(u => `
                <div class="search-result-item" 
                     style="display: flex; align-items: center; padding: 12px; cursor: pointer; border-bottom: 1px solid #f0f2f5; transition: background 0.2s;"
                     onclick="window.location.href='perfil.html?id=${u.usuario_id}'"
                     onmouseover="this.style.background='#f2f2f2'" 
                     onmouseout="this.style.background='transparent'">
                    
                    <img src="${u.foto_url || 'img/default.png'}" 
                         style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd;">
                    
                    <div style="margin-left: 12px;">
                        <span style="font-weight: 600; font-size: 0.95rem; color: #050505;">
                            ${u.nombre} ${u.apellido}
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            // 🔍 Caso: No hay coincidencias
            listaResultados.style.display = 'block';
            listaResultados.innerHTML = `
                <p style="padding: 15px; font-size: 0.85rem; color: #65676b; text-align: center; margin: 0;">
                    No encontramos a nadie llamado "${texto}". 🔍
                </p>`;
        }
    } catch (err) {
        console.error("🚨 Error en la búsqueda predictiva:", err);
        listaResultados.innerHTML = '<p style="padding: 10px; color: red;">Error al buscar.</p>';
    }
});

// --- 2. GESTIÓN DE VISIBILIDAD (Cerrar al hacer clic fuera) ---
document.addEventListener('click', (e) => {
    // Si el clic NO fue dentro del contenedor del buscador, cerramos la lista
    if (!e.target.closest('.buscador-contenedor')) {
        listaResultados.style.display = 'none';
    }
});

// --- 3. RE-ACTIVACIÓN (Mostrar si se hace foco y ya hay texto) ---
inputBusqueda.addEventListener('focus', () => {
    if (inputBusqueda.value.trim().length >= 2) {
        listaResultados.style.display = 'block';
    }
});