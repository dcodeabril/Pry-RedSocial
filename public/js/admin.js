// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: MASTER ADMIN (GESTIÓN DE USUARIOS Y REPORTES P4)
// ARCHIVO: public/js/admin.js
// =============================================

const miRol = localStorage.getItem('rol') || localStorage.getItem('usuarioRol');
const miId = localStorage.getItem('usuarioId');

if (miRol !== 'admin') {
    alert("⚠️ Acceso denegado. No tienes permisos de administrador.");
    window.location.href = 'index.html'; 
}

const tablaUsuarios = document.getElementById('tabla-usuarios');
const msgUsuarios = document.getElementById('msg');
const contenedorReportes = document.getElementById('lista-reportes-admin');
const contadorReportes = document.getElementById('contador-reportes');

// --- 🛡️ SECCIÓN A: GESTIÓN DE USUARIOS ---

async function cargarUsuarios() {
    try {
        const res = await fetch('/api/admin/usuarios');
        const usuarios = await res.json();
        
        if (!tablaUsuarios) return;

        tablaUsuarios.innerHTML = '';
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            
            // ✅ Clase condicional para el botón de estado
            const claseBtnEstado = user.estado === 'activo' ? 'btn-estado-activo' : 'btn-estado-suspendido';
            const claseTextoEstado = user.estado === 'activo' ? 'estado-activo' : 'estado-suspendido';

            const btnPromover = (user.rol !== 'admin') 
                ? `<button class="btn-secundario btn-ascender" 
                           onclick="promoverAAdmin(${user.id}, '${user.email}')">
                        Ascender 🔑
                   </button>` 
                : '';

            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td class="col-rol">${user.rol}</td>
                <td><span class="estado-usuario ${claseTextoEstado}">
                    ${user.estado.toUpperCase()}
                </span></td>
                <td>
                    <div class="acciones-flex">
                        ${btnPromover}
                        <button class="btn-secundario ${claseBtnEstado}" 
                                onclick="cambiarEstadoUsuario(${user.id}, '${user.estado}')">
                            ${user.estado === 'activo' ? 'Suspender 🚫' : 'Activar ✅'}
                        </button>
                    </div>
                </td>
            `;
            tablaUsuarios.appendChild(tr);
        });
    } catch (err) {
        if (msgUsuarios) msgUsuarios.innerText = "Error al conectar con la API de usuarios.";
    }
}

// --- 🔑 FUNCIÓN MAESTRA: PROMOVER A ADMIN ---
window.promoverAAdmin = async function(usuarioId, nombreUsuario) {
    const confirmacion = confirm(`¿Estás seguro de otorgar rango de ADMINISTRADOR a ${nombreUsuario}?`);
    if (!confirmacion) return;

    const codigoInput = prompt("🔑 SEGURIDAD: Ingrese un código de su lista autorizada (XXXXX-XXXXX...):");
    
    if (!codigoInput || codigoInput.trim().length < 20) {
        alert("Operación cancelada. El código debe ser válido y completo.");
        return;
    }

    try {
        const res = await fetch('/api/usuarios/promover', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                admin_solicitante_id: miId, 
                usuario_a_promover: usuarioId, 
                codigo: codigoInput.trim() 
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("⭐ ¡Éxito! Rango otorgado correctamente.");
            location.reload(); 
        } else {
            alert("❌ Denegado: " + data.error);
        }
    } catch (err) {
        alert("🚨 Error de conexión con el firewall de seguridad.");
    }
};

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

// --- 🚩 SECCIÓN B: RESUMEN DE REPORTES ---

async function cargarResumenReportes() {
    try {
        const res = await fetch('/api/reportes/admin/lista');
        const reportes = await res.json();

        if (contadorReportes) {
            contadorReportes.innerText = `${reportes.length} pendientes`;
        }

        if (!contenedorReportes) return;

        if (reportes.length === 0) {
            contenedorReportes.innerHTML = '<p class="msg-vacio">No hay denuncias pendientes. ✨</p>';
            return;
        }

        const resumen = reportes.slice(0, 3);
        contenedorReportes.innerHTML = resumen.map(r => `
            <div class="report-card">
                <div class="report-card-header">
                    <strong>🚩 Motivo: ${r.motivo}</strong>
                    <small>${new Date(r.fecha_reporte).toLocaleDateString()}</small>
                </div>
                <p class="report-card-body">
                    <b>Post:</b> "${r.post_contenido.substring(0, 50)}..."
                </p>
                <small>Denunciado por: ${r.denunciante_nombre}</small>
            </div>
        `).join('') + (reportes.length > 3 ? `<p class="report-card-footer-info">Y ${reportes.length - 3} denuncias más...</p>` : '');

    } catch (err) {
        console.error("Error al cargar resumen:", err);
    }
}

function init() {
    if (miRol === 'admin') {
        cargarUsuarios();
        cargarResumenReportes();
    }
}

init();