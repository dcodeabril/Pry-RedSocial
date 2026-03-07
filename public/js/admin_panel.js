// public/js/admin_panel.js
const tabla = document.getElementById('tabla-usuarios');
const msg = document.getElementById('msg');

async function cargarUsuarios() {
    try {
        const res = await fetch('/api/admin/usuarios');
        const usuarios = await res.json();
        
        tabla.innerHTML = '';
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.rol}</td>
                <td><strong>${user.estado}</strong></td>
                <td>
                    <button class="${user.estado === 'activo' ? 'btn-suspender' : 'btn-activar'}" 
                            onclick="cambiarEstado(${user.id}, '${user.estado}')">
                        ${user.estado === 'activo' ? 'Suspender' : 'Activar'}
                    </button>
                </td>
            `;
            tabla.appendChild(tr);
        });
    } catch (err) {
        msg.innerText = "Error al conectar con la API de administración.";
    }
}

async function cambiarEstado(id, estadoActual) {
    const nuevo_estado = estadoActual === 'activo' ? 'suspendido' : 'activo';
    try {
        await fetch(`/api/admin/usuarios/estado/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevo_estado })
        });
        cargarUsuarios(); // Recargar tabla
    } catch (err) {
        alert("No se pudo cambiar el estado.");
    }
}

cargarUsuarios();