// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: MASTER ADMIN (GESTIÓN DE USUARIOS Y REPORTES P4)
// ARCHIVO: public/js/admin.js
// =============================================

// 🚩 SEGURIDAD DE ROL (Blindaje de acceso)
const miRol = localStorage.getItem('rol') || localStorage.getItem('usuarioRol');

if (miRol !== 'admin') {
    alert("⚠️ Acceso denegado. No tienes permisos de administrador.");
    window.location.href = 'index.html'; 
}

// --- SELECTORES Y VARIABLES ---
const tablaUsuarios = document.getElementById('tabla-usuarios');
const msgUsuarios = document.getElementById('msg');
const contenedorReportes = document.getElementById('lista-reportes-admin');
const contadorReportes = document.getElementById('contador-reportes');
const miId = localStorage.getItem('usuarioId');

// --- 🛡️ SECCIÓN A: GESTIÓN DE USUARIOS ---

async function cargarUsuarios() {
    try {
        const res = await fetch('/api/admin/usuarios');
        const usuarios = await res.json();
        
        if (!tablaUsuarios) return;

        tablaUsuarios.innerHTML = '';
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.rol}</td>
                <td><span style="color: ${user.estado === 'activo' ? '#28a745' : '#dc3545'}; font-weight: bold;">
                    ${user.estado.toUpperCase()}
                </span></td>
                <td>
                    <button class="btn-secundario" 
                            style="border-color: ${user.estado === 'activo' ? '#dc3545' : '#28a745'}; color: ${user.estado === 'activo' ? '#dc3545' : '#28a745'};"
                            onclick="cambiarEstadoUsuario(${user.id}, '${user.estado}')">
                        ${user.estado === 'activo' ? 'Suspender 🚫' : 'Activar ✅'}
                    </button>
                </td>
            `;
            tablaUsuarios.appendChild(tr);
        });
    } catch (err) {
        if (msgUsuarios) msgUsuarios.innerText = "Error al conectar con la API de usuarios.";
    }
}

window.cambiarEstadoUsuario = async function(id, estadoActual) {
    const nuevo_estado = estadoActual === 'activo' ? 'suspendido' : 'activo';
    if (!confirm(`¿Estás seguro de cambiar el estado a: ${nuevo_estado.toUpperCase()}?`)) return;

    try {
        const res = await fetch(`/api/admin/usuarios/estado/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevo_estado })
        });
        
        if (res.ok) {
            cargarUsuarios(); 
        }
    } catch (err) {
        alert("No se pudo cambiar el estado del usuario.");
    }
}

// --- 🚩 SECCIÓN B: RESUMEN DE REPORTES (Integración Solicitada) ---

async function cargarResumenReportes() {
    try {
        // 🎯 Usamos la ruta de administración detallada para el resumen
        const res = await fetch('/api/reportes/admin/lista');
        const reportes = await res.json();

        // 1. Actualizar el contador (Badge)
        if (contadorReportes) {
            contadorReportes.innerText = `${reportes.length} pendientes`;
        }

        // 2. Mostrar previsualización en el Dashboard
        if (!contenedorReportes) return;

        if (reportes.length === 0) {
            contenedorReportes.innerHTML = '<p style="text-align:center; opacity:0.6; padding: 20px;">No hay denuncias pendientes. ¡Paz total! ✨</p>';
            return;
        }

        // Mostramos solo los últimos 3 como un "vistazo rápido"
        const resumen = reportes.slice(0, 3);
        contenedorReportes.innerHTML = resumen.map(r => `
            <div class="report-card" style="border-left: 6px solid #dc3545; padding: 15px; margin-bottom: 10px; background: #fff5f5; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>🚩 Motivo: ${r.motivo}</strong>
                    <small>${new Date(r.fecha_reporte).toLocaleDateString()}</small>
                </div>
                <p style="font-size: 0.9rem; margin: 5px 0;">
                    <b>Post:</b> "${r.post_contenido.substring(0, 50)}..."
                </p>
                <small>Denunciado por: ${r.denunciante_nombre}</small>
            </div>
        `).join('') + (reportes.length > 3 ? `<p style="text-align:center; font-size: 0.8rem; color: #666;">Y ${reportes.length - 3} denuncias más...</p>` : '');

    } catch (err) {
        console.error("Error al cargar resumen:", err);
        if (contadorReportes) contadorReportes.innerText = "Error";
        if (contenedorReportes) contenedorReportes.innerHTML = '<p>Error al conectar con el servidor de justicia.</p>';
    }
}

// --- 🚀 ARRANQUE INICIAL ---
function init() {
    if (miRol === 'admin') {
        cargarUsuarios();
        cargarResumenReportes();
    }
}

init();