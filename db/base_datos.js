const mysql = require('mysql2');
require('dotenv').config();

// Creamos un "pool" de conexiones para que sea más rápido
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exportamos la promesa para usar async/await
module.exports = pool.promise();
console.log("✅ Puente con MySQL establecido correctamente.");