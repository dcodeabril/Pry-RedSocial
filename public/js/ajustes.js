// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: PERSONA 5 (UI/UX) & PERSONA 1 (SEGURIDAD)
// ARCHIVO: ajustes.js
// =============================================

const form = document.getElementById('form-ajustes');
const idUsuario = 1; // ID del Arquitecto para pruebas locales

// --- 1. CARGAR DATOS ACTUALES AL ENTRAR ---
async function cargarAjustes() {
    try {
        // Obtenemos los datos actuales (Unión de usuarios y perfiles)
        const res = await fetch(`/api/usuarios/ajustes/${idUsuario}`);
        const datos = await res.json();
        
        if (datos) {
            // Llenamos los campos del formulario
            document.getElementById('edit-nombre').value = datos.nombre || '';
            document.getElementById('edit-apellido').value = datos.apellido || '';
            document.getElementById('edit-bio').value = datos.bio || '';
            document.getElementById('adj-foto-url').value = datos.foto_url || '';
            document.getElementById('adj-tema').value = datos.preferencia_tema || 'claro';
        }
    } catch (err) {
        console.error("Error al cargar ajustes iniciales:", err);
    }
}

// --- 2. GUARDAR CAMBIOS (SUBMIT) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Recolectamos todos los datos del Arquitecto y Lucero
    const datos = {
        nombre: document.getElementById('edit-nombre').value,
        apellido: document.getElementById('edit-apellido').value,
        bio: document.getElementById('edit-bio').value,
        foto_url: document.getElementById('adj-foto-url').value,
        tema: document.getElementById('adj-tema').value,
        password: document.getElementById('edit-password').value || null
    };

    // --- 🛡️ VALIDACIÓN DE SEGURIDAD (PERSONA 1) ---
    // La contraseña debe ser exactamente de 12 caracteres si se intenta cambiar
    if (datos.password && datos.password.length !== 12) {
        alert("⚠️ Error: La contraseña debe tener exactamente 12 caracteres.");
        return;
    }

    try {
        const res = await fetch(`/api/usuarios/actualizar-ajustes/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const result = await res.json();

        if (res.ok) {
            alert("✅ " + (result.mensaje || "¡Ajustes guardados permanentemente!"));
            // Recargamos para aplicar el nuevo tema y cambios visuales
            location.reload(); 
        } else {
            alert("❌ " + (result.error || "Error al actualizar."));
        }
    } catch (err) {
        alert("🚨 Error de conexión con el servidor.");
    }
});

// Iniciar carga de datos
cargarAjustes();