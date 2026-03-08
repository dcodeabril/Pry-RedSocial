// public/js/eventos.js
const listaEventos = document.getElementById('lista-eventos');
const btnCrear = document.getElementById('btn-crear-evento');

async function cargarEventos() {
    const res = await fetch('/api/eventos');
    const eventos = await res.json();
    
    listaEventos.innerHTML = eventos.map(e => `
        <div class="event-card">
            <h4>${e.titulo}</h4>
            <p>${e.descripcion}</p>
            <small>📅 ${new Date(e.fecha_evento).toLocaleString()}</small>
        </div>
    `).join('');
}

btnCrear.addEventListener('click', async () => {
    const datos = {
        creador_id: 1,
        titulo: document.getElementById('ev-titulo').value,
        descripcion: document.getElementById('ev-desc').value,
        fecha_evento: document.getElementById('ev-fecha').value
    };

    const res = await fetch('/api/eventos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });

    if (res.ok) {
        alert("¡Evento creado!");
        cargarEventos();
    }
});

cargarEventos();