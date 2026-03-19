// =============================================
// PROYECTO: FACEBOOK LOCAL (SISTEMA GLOBAL)
// ROL: MASTER ADMIN (GESTIÓN DE ALTO NIVEL)
// ARCHIVO: admin.js
// =============================================

const miRol = localStorage.getItem('rol') || localStorage.getItem('usuarioRol');
const miId = localStorage.getItem('usuarioId');

// --- 🛡️ FIREWALL DE ACCESO INMEDIATO ---
if (miRol !== 'admin') {
    alert("⚠️ Acceso denegado. Se requiere nivel de Master Admin.");
    window.location.href = 'index.html'; 
}

const tablaUsuarios = document.getElementById('tabla-usuarios');
const msgUsuarios = document.getElementById('msg');
const contenedorReportes = document.getElementById('lista-reportes-admin');
const contadorReportes = document.getElementById('contador-reportes');

// --- 👥 SECCIÓN A: GESTIÓN DE USUARIOS (RENDER INDUSTRIAL) ---

async function cargarUsuarios() {
    try {
        const res = await fetch('/api/admin/usuarios');
        const usuarios = await res.json();
        
        if (!tablaUsuarios) return;

        tablaUsuarios.innerHTML = '';
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            
            // Configuración visual por estado
            const claseBtnEstado = user.estado === 'activo' ? 'btn-danger-soft' : 'btn-success-soft';
            const claseTextoEstado = user.estado === 'activo' ? 'tag-activo' : 'tag-suspendido';
            const iconoEstado = user.estado === 'activo' ? 'fa-user-slash' : 'fa-user-check';

            // Lógica de ascenso a Admin
            const btnPromover = (user.rol !== 'admin') 
                ? `<button class="btn-action-icon promote" title="Ascender a Admin"
                           onclick="promoverAAdmin(${user.id}, '${user.email}')">
                        <i class="fa-solid fa-award"></i>
                   </button>` 
                : '<span class="master-badge"><i class="fa-solid fa-crown"></i> Admin</span>';

            tr.innerHTML = `
                <td><span class="user-id">#${user.id}</span></td>
                <td><div class="user-email-box"><strong>${user.email}</strong></div></td>
                <td class="col-rol"><span class="rol-pill">${user.rol}</span></td>
                <td><span class="status-pill ${claseTextoEstado}">${user.estado.toUpperCase()}</span></td>
                <td>
                    <div class="acciones-flex">
                        ${btnPromover}
                        <button class="btn-action-icon ${claseBtnEstado}" 
                                title="${user.estado === 'activo' ? 'Suspender' : 'Activar'}"
                                onclick="cambiarEstadoUsuario(${user.id}, '${user.estado}')">
                            <i class="fa-solid ${iconoEstado}"></i>
                        </button>
                    </div>
                </td>
            `;
            tablaUsuarios.appendChild(tr);
        });
    } catch (err) {
        if (msgUsuarios) msgUsuarios.innerHTML = `<div class="alert-error">🚨 Error de sincronización con la base de datos.</div>`;
    }
}

// --- 🔑 FUNCIÓN: PROMOVER A ADMIN (PROTOCOLO DE SEGURIDAD) ---
window.promoverAAdmin = async function(usuarioId, nombreUsuario) {
    if (!confirm(`¿Confirmas otorgar privilegios de ADMINISTRADOR a ${nombreUsuario}?`)) return;

    const codigoInput = prompt("🔑 PROTOCOLO: Ingrese código de autorización industrial:");
    
    if (!codigoInput || codigoInput.trim().length < 10) {
        alert("Operación abortada. Código de seguridad insuficiente.");
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
            alert("⭐ Rango otorgado. El nuevo administrador tiene acceso total.");
            location.reload(); 
        } else {
            alert("❌ Acceso Denegado: " + data.error);
        }
    } catch (err) {
        alert("🚨 Error crítico en el Firewall de seguridad.");
    }
};

// --- 🚫 FUNCIÓN: CONTROL DE ESTADO (SUSPENSIÓN/ACTIVACIÓN) ---
window.cambiarEstadoUsuario = async function(id, estadoActual) {
    const nuevo_estado = estadoActual === 'activo' ? 'suspendido' : 'activo';
    if (!confirm(`¿Ejecutar cambio de estado a ${nuevo_estado.toUpperCase()}?`)) return;

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
        alert("Error al modificar el estado del sujeto.");
    }
}

// --- 🚩 SECCIÓN B: MONITOR DE REPORTES (VIGILANCIA) ---

async function cargarResumenReportes() {
    try {
        const res = await fetch('/api/reportes/admin/lista');
        const reportes = await res.json();

        if (contadorReportes) {
            contadorReportes.innerHTML = `<i class="fa-solid fa-fire"></i> ${reportes.length} Casos Pendientes`;
        }

        if (!contenedorReportes) return;

        if (reportes.length === 0) {
            contenedorReportes.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-circle-check"></i>
                    <p>Zona segura. No hay incidencias reportadas.</p>
                </div>`;
            return;
        }

        const resumen = reportes.slice(0, 3);
        contenedorReportes.innerHTML = resumen.map(r => `
            <div class="admin-report-card">
                <div class="report-indicator"></div>
                <div class="report-content">
                    <div class="report-card-header">
                        <span class="motivo-tag">${r.motivo}</span>
                        <small><i class="fa-regular fa-clock"></i> ${new Date(r.fecha_reporte).toLocaleDateString()}</small>
                    </div>
                    <p class="report-excerpt">"${r.post_contenido.substring(0, 60)}..."</p>
                    <div class="report-card-footer">
                        <span>Denuncia por: <b>${r.denunciante_nombre}</b></span>
                    </div>
                </div>
            </div>
        `).join('') + (reportes.length > 3 ? `<p class="more-info-text">Auditando ${reportes.length - 3} denuncias adicionales...</p>` : '');

    } catch (err) {
        console.error("Error en el monitor de reportes:", err);
    }
}

// --- 🚀 INICIALIZACIÓN DEL SISTEMA ---
function init() {
    if (miRol === 'admin') {
        cargarUsuarios();
        cargarResumenReportes();
    }
}

init();