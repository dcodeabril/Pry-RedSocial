// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: MASTER ADMIN (GESTIÓN DE USUARIOS Y REPORTES P4)
// ARCHIVO: public/js/admin.js
// =============================================

// 🚩 SEGURIDAD DE ROL (Blindaje de acceso)
const miRol = localStorage.getItem('rol') || localStorage.getItem('usuarioRol');
const miId = localStorage.getItem('usuarioId');

if (miRol !== 'admin') {
    alert("⚠️ Acceso denegado. No tienes permisos de administrador.");
    window.location.href = 'index.html'; 
}

// --- SELECTORES Y VARIABLES ---
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
            
            // ✅ DETERMINACIÓN DE BOTONES DE ACCIÓN
            // Solo permitimos promover si no es admin ya
            const btnPromover = (user.rol !== 'admin') 
                ? `<button class="btn-secundario" 
                           style="border-color: #28a745; color: #28a745; margin-right: 5px;"
                           onclick="promoverAAdmin(${user.id}, '${user.email}')">
                        Ascender 🔑
                   </button>` 
                : '';

            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td style="text-transform: capitalize; font-weight: bold;">${user.rol}</td>
                <td><span style="color: ${user.estado === 'activo' ? '#28a745' : '#dc3545'}; font-weight: bold;">
                    ${user.estado.toUpperCase()}
                </span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        ${btnPromover}
                        <button class="btn-secundario" 
                                style="border-color: ${user.estado === 'activo' ? '#dc3545' : '#28a745'}; color: ${user.estado === 'activo' ? '#dc3545' : '#28a745'};"
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
                admin_solicitante_id: miId, // El ID de quien autoriza (tú)
                usuario_a_promover: usuarioId, // El ID de quien asciende
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
            contenedorReportes.innerHTML = '<p style="text-align:center; opacity:0.6; padding: 20px;">No hay denuncias pendientes. ✨</p>';
            return;
        }

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