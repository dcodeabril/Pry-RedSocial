const formularioRegistro = document.getElementById('auth-form');
const mensajeRegistro = document.getElementById('mensaje-servidor');

formularioRegistro.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const respuesta = await fetch('/api/usuarios/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const datos = await respuesta.json();
        mensajeRegistro.classList.remove('msg-exito', 'msg-error');
        mensajeRegistro.classList.add(respuesta.ok ? 'msg-exito' : 'msg-error');
        mensajeRegistro.textContent = respuesta.ok ? datos.mensaje : datos.error;

        if (respuesta.ok) formularioRegistro.reset();
    } catch (error) {
        mensajeRegistro.classList.remove('msg-exito');
        mensajeRegistro.classList.add('msg-error');
        mensajeRegistro.textContent = 'Error de conexión con el servidor.';
    }
});
