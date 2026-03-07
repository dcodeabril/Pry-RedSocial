// public/js/ajustes.js
const form = document.getElementById('form-ajustes');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idUsuario = 1; // En una app real, esto vendría del login/sesión
    
    const datos = {
        nombre: document.getElementById('edit-nombre').value,
        apellido: document.getElementById('edit-apellido').value,
        bio: document.getElementById('edit-bio').value,
        password: document.getElementById('edit-password').value || null
    };

    // Validación del Arquitecto en el cliente
    if (datos.password && datos.password.length !== 12) {
        alert("La contraseña debe tener exactamente 12 caracteres.");
        return;
    }

    try {
        const res = await fetch(`/api/usuarios/perfil/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const result = await res.json();
        alert(result.mensaje || result.error);
    } catch (err) {
        alert("Error de conexión.");
    }
});