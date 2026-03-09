// public/js/perfil.js
const nombreTxt = document.getElementById('prof-nombre');
const bioTxt = document.getElementById('prof-bio');
const miUsuarioId = 1; // ID del Arquitecto para pruebas

async function cargarDatosPerfil() {
    try {
        // Consultamos la API de usuarios/perfiles (Persona 1)
        const response = await fetch(`/api/usuarios/perfil/${miUsuarioId}`);
        const datos = await response.json();

        if (datos) {
            nombreTxt.innerText = `${datos.nombre} ${datos.apellido}`;
            bioTxt.innerText = datos.bio || "Sin biografía aún.";
        }
    } catch (error) {
        console.error("Error al cargar el perfil:", error);
    }
}

// Iniciar carga
cargarDatosPerfil();