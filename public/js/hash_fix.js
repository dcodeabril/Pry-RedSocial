const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function migrar() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',      // Asegúrate de que sea tu usuario de MySQL
            password: 'root',      // Asegúrate de que sea tu contraseña de MySQL
            database: 'facebook_local'
        });

        console.log("🛠️ Iniciando migración de contraseñas...");

        // 1. Traemos los usuarios actuales
        const [usuarios] = await connection.execute('SELECT id, password FROM usuarios');

        for (let u of usuarios) {
            // Verificamos si ya es un hash (los hashes de bcrypt empiezan con $2b$)
            if (u.password.startsWith('$2b$')) {
                console.log(`⏩ Usuario ID ${u.id} ya tiene un hash. Saltando...`);
                continue;
            }

            // 2. Convertimos la clave plana a Hash
            const hash = await bcrypt.hash(u.password, 10);
            
            // 3. Guardamos el Hash
            await connection.execute('UPDATE usuarios SET password = ? WHERE id = ?', [hash, u.id]);
            console.log(`✅ Usuario ID ${u.id} actualizado a Hash.`);
        }

        console.log("🚀 ¡Migración terminada con éxito!");
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error durante la migración:", error.message);
        process.exit(1);
    }
}

migrar();