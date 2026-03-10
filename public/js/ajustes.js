// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (GESTIÓN DE IDENTIDAD P1 & P5)
// ARCHIVO: ajustes.js
// =============================================

const form = document.getElementById('form-ajustes');
// 🛡️ Identidad dinámica: Recuperamos el ID de la sesión activa
const miId = localStorage.getItem('usuarioId');

// --- 1. CARGAR DATOS ACTUALES AL ENTRAR ---
async function cargarAjustes() {
    if (!miId) return;

    try {
        // Obtenemos los datos actuales desde la API (Unión de usuarios y perfiles)
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
        console.error("Error al cargar ajustes iniciales:", err);
    }
}

// --- 2. GUARDAR CAMBIOS (SUBMIT) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Recolectamos los datos del formulario
    const datosNuevos = {
        nombre: document.getElementById('edit-nombre').value,
        apellido: document.getElementById('edit-apellido').value,
        bio: document.getElementById('edit-bio').value,
        foto_url: document.getElementById('adj-foto-url').value,
        tema: document.getElementById('adj-tema').value,
        password: document.getElementById('edit-password').value || null
    };

    // --- 🛡️ VALIDACIÓN DE SEGURIDAD (PERSONA 1) ---
    // Si se intenta cambiar la contraseña, debe cumplir la Regla de Oro
    if (datosNuevos.password && datosNuevos.password.length !== 12) {
        alert("⚠️ Error: El Arquitecto exige que la nueva contraseña tenga exactamente 12 caracteres.");
        return;
    }

    try {
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
        }
    } catch (err) {
        alert("🚨 Error de conexión con el servidor.");
    }
});

// Iniciamos la carga de datos al abrir la página
cargarAjustes();