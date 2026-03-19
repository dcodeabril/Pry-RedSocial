// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE IDENTIDAD P1 & P5)
// ARCHIVO: ajustes.js
// =============================================

const form = document.getElementById('form-ajustes');
const miId = localStorage.getItem('usuarioId');

// --- 1. CARGAR DATOS ACTUALES AL ENTRAR ---
async function cargarAjustes() {
    if (!miId) return;

    try {
        // Obtenemos los datos actuales desde la API
        const res = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await res.json();
        
        if (res.ok) {
            // Llenamos los campos del formulario con la info de la DB
            document.getElementById('edit-nombre').value = datos.nombre || '';
            document.getElementById('edit-apellido').value = datos.apellido || '';
            document.getElementById('edit-bio').value = datos.bio || '';
            document.getElementById('adj-foto-url').value = datos.foto_url || '';
            document.getElementById('adj-tema').value = datos.preferencia_tema || 'claro';
        }
    } catch (err) {
        console.error("🚨 Error al cargar ajustes iniciales:", err);
    }
}

// --- 2. GUARDAR CAMBIOS (SUBMIT) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnGuardar = document.getElementById('btn-guardar-ajustes');
    const originalContent = btnGuardar.innerHTML;

    // Recolectamos los datos del formulario
    const datosNuevos = {
        nombre: document.getElementById('edit-nombre').value,
        apellido: document.getElementById('edit-apellido').value,
        bio: document.getElementById('edit-bio').value,
        foto_url: document.getElementById('adj-foto-url').value,
        tema: document.getElementById('adj-tema').value,
        password: document.getElementById('edit-password').value || null
    };

    // --- 🛡️ VALIDACIÓN DE SEGURIDAD (REGLA DEL ARQUITECTO) ---
    if (datosNuevos.password && datosNuevos.password.length !== 12) {
        alert("⚠️ Error: El Arquitecto exige que la nueva contraseña tenga exactamente 12 caracteres.");
        return;
    }

    try {
        // 🌀 Estado de carga visual (UX Industrial)
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...';

        const res = await fetch(`/api/usuarios/actualizar-ajustes/${miId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosNuevos)
        });

        const result = await res.json();

        if (res.ok) {
            alert("✅ " + (result.mensaje || "¡Perfil actualizado correctamente!"));
            // Recargamos para que usuario_global.js actualice el nombre en el menú
            location.reload(); 
        } else {
            alert("❌ " + (result.error || "Error al actualizar."));
            // Restauramos el botón si hay error
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = originalContent;
        }
    } catch (err) {
        alert("🚨 Error de conexión con el servidor.");
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = originalContent;
    }
});

// Iniciamos la carga de datos al abrir la página
cargarAjustes();
//
//
// --- 3. DISPARADOR DE ANIMACIÓN (MAGIC NAV KICKSTART) ---
document.addEventListener('DOMContentLoaded', () => {
    const activeItem = document.querySelector('.nav-menu .list.active');
    const indicator = document.querySelector('.indicator');

    if (activeItem && indicator) {
        // Reset temporal para forzar el redibujado
        activeItem.classList.remove('active');
        
        // Un pequeño delay (100ms) para que el navegador registre el cambio
        setTimeout(() => {
            activeItem.classList.add('active');
        }, 100);
    }
});