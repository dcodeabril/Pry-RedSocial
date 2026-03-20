// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (SISTEMA DE AUTENTICACIÓN SINCRONIZADO)
// ARCHIVO: auth.js
// =============================================

// Prevenir que un usuario logueado vea el login
if (localStorage.getItem('usuarioId')) {
    window.location.replace('index.html'); 
}

// --- 🔄 1. CAMBIO ENTRE LOGIN Y REGISTRO ---
function toggleAuth() {
    const loginSec = document.getElementById('login-section');
    const regSec = document.getElementById('register-section');
    loginSec.classList.toggle('auth-hidden');
    regSec.classList.toggle('auth-hidden');
}

// --- 🔑 2. LÓGICA DE INICIO DE SESIÓN (REPARADA) ---
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
            // 🛡️ ESTANDARIZACIÓN DE KEYS (Fundamental para que el Perfil y Guardia funcionen)
            localStorage.setItem('usuarioId', data.usuarioId);
            localStorage.setItem('rol', data.rol); // 👈 Corregido: de 'usuarioRol' a 'rol'
            localStorage.setItem('nombre', data.nombre); // 👈 Corregido: de 'usuarioNombre' a 'nombre'
            
            console.log("🔓 Sesión iniciada con éxito. Rol detectado:", data.rol);
            window.location.href = 'index.html'; 
        } else {
            alert("Acceso Denegado: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("🚨 Error técnico: El servidor no responde.");
    }
});

// --- 📝 3. LÓGICA DE REGISTRO ---
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

// --- 🚀 REGISTRO DEL SERVICE WORKER (Lógica del Yeti) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Usamos '/sw.js' para que el servidor lo busque en la raíz principal
        navigator.serviceWorker.register('/sw.js') 
            .then((registro) => {
                console.log('✅ Service Worker del Yeti activo en:', registro.scope);
            })
            .catch((error) => {
                // Si sigue saliendo error aquí, es porque el archivo no está en la raíz
                console.error('🚨 Error al registrar el Service Worker:', error);
            });
    });
}