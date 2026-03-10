// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (SEGURIDAD Y ROLES P1)
// ARCHIVO: auth.js
// =============================================

// --- 🔄 1. CAMBIO ENTRE LOGIN Y REGISTRO ---
function toggleAuth() {
    const loginSec = document.getElementById('login-section');
    const regSec = document.getElementById('register-section');
    
    if (loginSec.style.display === 'none') {
        loginSec.style.display = 'block';
        regSec.style.display = 'none';
    } else {
        loginSec.style.display = 'none';
        regSec.style.display = 'block';
    }
}

// --- 🔑 2. LÓGICA DE INICIO DE SESIÓN ACTUALIZADA ---
document.getElementById('btn-entrar').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) {
        alert("⚠️ Por favor, ingresa tus credenciales.");
        return;
    }

    try {
        const res = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass })
        });

        const data = await res.json();

        if (res.ok) {
            // ✅ ÉXITO: Guardamos TODO el kit de identidad en el navegador
            localStorage.setItem('usuarioId', data.usuarioId);
            localStorage.setItem('usuarioRol', data.rol);     // 🔑 ¡ESTA ES LA LLAVE ADMIN!
            localStorage.setItem('usuarioNombre', data.nombre); // Para el saludo inicial
            
            console.log("🔓 Sesión iniciada como:", data.rol);
            window.location.href = 'index.html'; 
        } else {
            alert("Acceso Denegado: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("🚨 Error técnico: El servidor no responde.");
    }
});

// --- 📝 3. LÓGICA DE REGISTRO (PERSONA 1 y 5) ---
document.getElementById('btn-registrar').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (!email || pass.length !== 12) {
        alert("⚠️ Recuerda: Email válido y clave de exactamente 12 caracteres.");
        return;
    }

    try {
        const res = await fetch('/api/usuarios/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ " + data.mensaje);
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-pass').value = '';
            toggleAuth(); 
        } else {
            alert("❌ " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("🚨 Error de conexión con el servidor.");
    }
});