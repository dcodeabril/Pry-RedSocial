// Ejecutar manualmente solo después de respaldar la base de datos.
// Reutiliza las variables DB_* cargadas por db/base_datos.js.
const bcrypt = require('bcrypt');
const db = require('../db/base_datos');

async function migrarContrasenas() {
    const [usuarios] = await db.query('SELECT id, password FROM usuarios');
    let actualizados = 0;

    for (const usuario of usuarios) {
        if (typeof usuario.password !== 'string' || /^\$2[aby]\$/.test(usuario.password)) continue;

        const hash = await bcrypt.hash(usuario.password, 10);
        await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, usuario.id]);
        actualizados++;
    }

    console.log(`Migración terminada. Contraseñas actualizadas: ${actualizados}.`);
}

migrarContrasenas()
    .catch((error) => {
        console.error('Error durante la migración:', error);
        process.exitCode = 1;
    })
    .finally(() => db.end());
