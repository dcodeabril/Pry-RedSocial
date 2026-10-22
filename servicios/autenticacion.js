const bcrypt = require('bcrypt');
const db = require('../db/base_datos');

async function iniciarSesion(req, res) {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
        return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
    }

    try {
        const [usuarios] = await db.query(`
            SELECT u.id, u.email, u.password, u.rol, u.estado, p.nombre
            FROM usuarios u
            JOIN perfiles p ON u.id = p.usuario_id
            WHERE u.email = ?`, [email]);

        if (usuarios.length === 0) return res.status(401).json({ error: 'No registrado.' });

        const usuario = usuarios[0];
        if (usuario.estado === 'suspendido') {
            return res.status(403).json({ error: 'Cuenta suspendida. 🚫' });
        }

        const coinciden = await bcrypt.compare(password, usuario.password);
        if (!coinciden) return res.status(401).json({ error: 'Contraseña incorrecta.' });

        return res.json({
            usuarioId: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol,
            email: usuario.email
        });
    } catch (err) {
        console.error('Error al iniciar sesión:', err);
        return res.status(500).json({ error: 'Error en el servidor.' });
    }
}

module.exports = iniciarSesion;
