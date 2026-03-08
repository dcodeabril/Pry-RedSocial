const mysql = require('mysql2/promise');
require('dotenv').config(); // <-- ESTA LÍNEA ES VITAL AQUÍ TAMBIÉN

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,      // Si esto llega vacío, da el error que tienes
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;