// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (SEGURIDAD Y ROLES P1)
// ARCHIVO: public/js/auth_cliente.js
// =============================================

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const btnSubmit = document.getElementById('btn-submit');
const toggleLink = document.getElementById('toggle-auth');
const mensajeDiv = document.getElementById('mensaje-servidor');

let esModoRegistro = true;

// --- 🔄 CAMBIO ENTRE LOGIN Y REGISTRO ---
toggleLink.addEventListener('click', () => {
    esModoRegistro = !esModoRegistro;
    authTitle.innerText = esModoRegistro ? "Crear cuenta nueva" : "Iniciar sesión";
    btnSubmit.innerText = esModoRegistro ? "Registrarme" : "Entrar";
    toggleLink.innerText = esModoRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate";
    mensajeDiv.innerText = "";
    mensajeDiv.className = ""; // Limpia clases de éxito/error al cambiar modo
});

// --- 🔑 ENVÍO DE FORMULARIO ---
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const ruta = esModoRegistro ? '/api/usuarios/registro' : '/api/seguridad/login';

    try {
        const respuesta = await fetch(ruta, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const datos = await respuesta.json();

        // Limpieza de clases previas
        mensajeDiv.classList.remove('msg-exito', 'msg-error');

        if (respuesta.ok) {
            // Aplicamos clase de éxito extraída al CSS
            mensajeDiv.classList.add('msg-exito');
            mensajeDiv.innerText = datos.mensaje;
            
            if (!esModoRegistro) {
                setTimeout(() => window.location.href = 'index.html', 1500);
            }
        } else {
            // Aplicamos clase de error extraída al CSS
            mensajeDiv.classList.add('msg-error');
            mensajeDiv.innerText = datos.error;
        }
    } catch (error) {
        mensajeDiv.classList.add('msg-error');
        mensajeDiv.innerText = "Error de conexión con el servidor.";
    }
});