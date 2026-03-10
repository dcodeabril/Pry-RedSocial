// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: MASTER ADMIN (GESTIÓN DE USUARIOS Y REPORTES P4)
// ARCHIVO: public/js/admin.js
// =============================================

// 🚩 SEGURIDAD DE ROL (Blindaje de acceso)
const miRol = localStorage.getItem('usuarioRol');

if (miRol !== 'admin') {
    alert("⚠️ Acceso denegado. No tienes permisos de administrador.");
    window.location.href = 'index.html'; // Expulsar al usuario al muro
}

// --- SELECTORES Y VARIABLES ---
const tablaUsuarios = document.getElementById('tabla-usuarios');
const msgUsuarios = document.getElementById('msg');
const contenedorReportes = document.getElementById('lista-reportes-admin');
const contadorReportes = document.getElementById('contador-reportes');
const miId = localStorage.getItem('usuarioId');

// --- 🛡️ SECCIÓN A: GESTIÓN DE USUARIOS (Identidad) ---

async function cargarUsuarios() {
    try {
        const res = await fetch('/api/admin/usuarios');
        const usuarios = await res.json();
        
        tablaUsuarios.innerHTML = '';
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.rol}</td>
                <td><strong>${user.estado}</strong></td>
                <td>
                    <button class="${user.estado === 'activo' ? 'btn-suspender' : 'btn-activar'}" 
                            onclick="cambiarEstadoUsuario(${user.id}, '${user.estado}')">
                        ${user.estado === 'activo' ? 'Suspender' : 'Activar'}
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
    try {
        await fetch(`/api/admin/usuarios/estado/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevo_estado })
        });
        cargarUsuarios(); 
    } catch (err) {
        alert("No se pudo cambiar el estado del usuario.");
    }
}

// --- 🚩 SECCIÓN B: GESTIÓN DE REPORTES (Contenido) ---

async function cargarReportes() {
    try {
        const res = await fetch('/api/reportes/lista');
        const reportes = await res.json();

        if (reportes.length === 0) {
            if (contenedorReportes) {
                contenedorReportes.innerHTML = '<p style="text-align:center; opacity:0.6;">No hay reportes pendientes. ¡Paz total! ✨</p>';
            }
            if (contadorReportes) contadorReportes.innerText = "0 pendientes";
            return;
        }

        if (contadorReportes) contadorReportes.innerText = `${reportes.length} pendientes`;
        
        if (contenedorReportes) {
            contenedorReportes.innerHTML = reportes.map(r => `
                <div class="card report-card">
                    <div class="report-info">
                        <p><b>Denunciante:</b><br>${r.denunciante_nombre}</p>
                        <p><b>Motivo:</b><br><span style="color: #dc3545;">${r.motivo}</span></p>
                    </div>
                    <div class="post-preview">
                        <b>Post Reportado:</b><br>"${r.post_contenido}"
                    </div>
                    <div class="actions-admin">
                        <button onclick="eliminarYResolver(${r.publicacion_id}, ${r.id})" class="btn-primario" style="background: #dc3545;">
                            Eliminar Post 🗑️
                        </button>
                        <button onclick="archivarReporte(${r.id})" class="btn-secundario">
                            Ignorar / Archivar
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        if (contenedorReportes) contenedorReportes.innerHTML = '<p>Error al cargar reportes.</p>';
    }
}

window.eliminarYResolver = async function(postId, reporteId) {
    if (!confirm("¿Borrar publicación reportada?")) return;
    try {
        const resPost = await fetch(`/api/publicaciones/${postId}?usuario_id=${miId}`, { method: 'DELETE' });
        if (resPost.ok) {
            await fetch(`/api/reportes/revisar/${reporteId}`, { method: 'PUT' });
            alert("Contenido eliminado y reporte cerrado.");
            cargarReportes();
        }
    } catch (err) { alert("Error en la operación."); }
};

window.archivarReporte = async function(id) {
    try {
        await fetch(`/api/reportes/revisar/${id}`, { method: 'PUT' });
        cargarReportes();
    } catch (err) { console.error(err); }
};

// --- 🚀 ARRANQUE INICIAL ---
function init() {
    // Solo ejecutamos la carga si el usuario es administrador
    if (miRol === 'admin') {
        cargarUsuarios();
        cargarReportes();
    }
}

init();