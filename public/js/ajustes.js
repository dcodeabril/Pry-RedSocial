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
        const res = await fetch(`/api/usuarios/ajustes/${miId}`);
        const datos = await res.json();
        
        if (res.ok) {
            document.getElementById('edit-nombre').value = datos.nombre || '';
            document.getElementById('edit-apellido').value = datos.apellido || '';
            document.getElementById('edit-bio').value = datos.bio || '';
            // El campo adj-foto-url ha sido eliminado por el input file en el HTML
            document.getElementById('adj-tema').value = datos.preferencia_tema || 'claro';
        }
    } catch (err) {
        console.error("🚨 Error al cargar ajustes iniciales:", err);
    }
}

// --- 2. GUARDAR CAMBIOS (SUBMIT CON FORM DATA) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnGuardar = document.getElementById('btn-guardar-ajustes');
    const originalContent = btnGuardar.innerHTML;
    
    // Capturamos el archivo físico si existe
    const fotoInput = document.getElementById('adj-foto-archivo');
    const fotoArchivo = fotoInput ? fotoInput.files[0] : null;

    // Usamos FormData para el envío multimodal (campos + archivo)
    const formData = new FormData();
    formData.append('nombre', document.getElementById('edit-nombre').value);
    formData.append('apellido', document.getElementById('edit-apellido').value);
    formData.append('bio', document.getElementById('edit-bio').value);
    formData.append('tema', document.getElementById('adj-tema').value);
    
    const password = document.getElementById('edit-password').value;

    // --- 🛡️ VALIDACIÓN DE SEGURIDAD (REGLA DEL ARQUITECTO) ---
    if (password) {
        if (password.length !== 12) {
            alert("⚠️ Error: El Arquitecto exige que la nueva contraseña tenga exactamente 12 caracteres.");
            return;
        }
        formData.append('password', password);
    }

    // Si el usuario seleccionó una foto, la adjuntamos
    if (fotoArchivo) {
        formData.append('foto_perfil', fotoArchivo);
    }

    try {
        // 🌀 Estado de carga visual
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...';

        // IMPORTANTE: Al enviar FormData, no se debe definir 'Content-Type' manualmente
        const res = await fetch(`/api/usuarios/actualizar-ajustes/${miId}`, {
            method: 'PUT',
            body: formData 
        });

        const result = await res.json();

        if (res.ok) {
            alert("✅ ¡Perfil y Avatar actualizados con éxito!");
            location.reload(); 
        } else {
            alert("❌ " + (result.error || "Error al actualizar."));
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

// --- 3. DISPARADOR DE ANIMACIÓN (MAGIC NAV KICKSTART) ---
document.addEventListener('DOMContentLoaded', () => {
    const activeItem = document.querySelector('.nav-menu .list.active');
    const indicator = document.querySelector('.indicator');

    if (activeItem && indicator) {
        activeItem.classList.remove('active');
        setTimeout(() => {
            activeItem.classList.add('active');
        }, 100);
    }
});