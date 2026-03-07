const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const btnSubmit = document.getElementById('btn-submit');
const toggleLink = document.getElementById('toggle-auth');
const mensajeDiv = document.getElementById('mensaje-servidor');

let esModoRegistro = true;

// Cambiar entre Login y Registro
toggleLink.addEventListener('click', () => {
    esModoRegistro = !esModoRegistro;
    authTitle.innerText = esModoRegistro ? "Crear cuenta nueva" : "Iniciar sesión";
    btnSubmit.innerText = esModoRegistro ? "Registrarme" : "Entrar";
    toggleLink.innerText = esModoRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate";
    mensajeDiv.innerText = "";
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Ruta destino basada en el modo
    const ruta = esModoRegistro ? '/api/usuarios/registro' : '/api/seguridad/login';

    try {
        const respuesta = await fetch(ruta, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mensajeDiv.style.color = "green";
            mensajeDiv.innerText = datos.mensaje;
            if (!esModoRegistro) {
                // Si el login es exitoso, podríamos redirigir al muro (Persona 2)
                setTimeout(() => window.location.href = 'index.html', 1500);
            }
        } else {
            mensajeDiv.style.color = "red";
            mensajeDiv.innerText = datos.error;
        }
    } catch (error) {
        mensajeDiv.innerText = "Error de conexión con el servidor.";
    }
});