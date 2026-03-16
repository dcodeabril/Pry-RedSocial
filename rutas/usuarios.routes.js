// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (IDENTIDAD: LIZBETH RÍOS 👑)
// ARCHIVO: rutas/usuarios.routes.js
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');
const bcrypt = require('bcrypt');

// --- 1. REGISTRO MAESTRO (Con Hashing de Contraseña) ---
router.post('/registro', async (req, res) => {
    const { email, password } = req.body;

    if (password.length !== 12) {
        return res.status(400).json({ error: "La contraseña debe tener exactamente 12 caracteres." });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [resultado] = await db.query(
            'INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)',
            [email, hashedPassword, 'usuario'] 
        );
        
        const nuevoId = resultado.insertId;

        await db.query(
            'INSERT INTO perfiles (usuario_id, nombre, apellido) VALUES (?, ?, ?)',
            [nuevoId, 'Nuevo', 'Usuario']
        );

        // ✅ ACTUALIZACIÓN: Lizbeth Ríos da la bienvenida oficial
        const saludo = `¡Hola! Soy Lizbeth Ríos, la Arquitecta de esta red social. ¡Bienvenida/o a bordo!`;
        await db.query(
            'INSERT INTO mensajes (emisor_id, receptor_id, contenido) VALUES (?, ?, ?)',
            [1, nuevoId, saludo]
        );

        res.status(201).json({ 
            mensaje: "¡Cuenta creada con éxito! Ya puedes iniciar sesión.", 
            id: nuevoId 
        });

    } catch (err) {
        console.error("🚨 Error en registro:", err);
        res.status(500).json({ error: "Error al registrar usuario." });
    }
});

// --- 2. LOGIN DE USUARIOS (Con Verificación de Hash) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const query = `
            SELECT u.id, u.email, u.password, u.rol, u.estado, p.nombre 
            FROM usuarios u
            JOIN perfiles p ON u.id = p.usuario_id
            WHERE u.email = ?`;
            
        const [usuarios] = await db.query(query, [email]);

        if (usuarios.length === 0) {
            return res.status(401).json({ error: "El correo no está registrado." });
        }

        const usuario = usuarios[0];

        if (usuario.estado === 'suspendido') {
            return res.status(403).json({ 
                error: "Acceso denegado. Tu cuenta se encuentra suspendida. 🚫" 
            });
        }

        const coinciden = await bcrypt.compare(password, usuario.password);

        if (!coinciden) {
            return res.status(401).json({ error: "Contraseña incorrecta." });
        }

        res.json({ 
            mensaje: "¡Bienvenido de nuevo!", 
            usuarioId: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol, 
            email: usuario.email 
        });

    } catch (err) {
        console.error("🚨 Error en login:", err);
        res.status(500).json({ error: "Error en el servidor al intentar entrar." });
    }
});

// --- 3. OBTENER AJUSTES (Privado) ---
router.get('/ajustes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT u.email, u.rol, u.preferencia_tema, p.nombre, p.apellido, p.bio, p.foto_url 
            FROM usuarios u 
            JOIN perfiles p ON u.id = p.usuario_id 
            WHERE u.id = ?`;
        
        const [rows] = await db.query(query, [id]);
        
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ error: "Usuario no encontrado" });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
});

// --- 4. ACTUALIZAR AJUSTES ---
router.put('/actualizar-ajustes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, bio, foto_url, tema, password } = req.body;

    try {
        if (password) {
            if (password.length !== 12) {
                return res.status(400).json({ error: "La contraseña debe ser de 12 caracteres." });
            }
            const hashedNewPassword = await bcrypt.hash(password, 10);
            await db.query('UPDATE usuarios SET password = ?, preferencia_tema = ? WHERE id = ?', [hashedNewPassword, tema, id]);
        } else {
            await db.query('UPDATE usuarios SET preferencia_tema = ? WHERE id = ?', [tema, id]);
        }

        await db.query(
            `UPDATE perfiles SET nombre = ?, apellido = ?, bio = ?, foto_url = ? WHERE usuario_id = ?`,
            [nombre, apellido, bio, foto_url, id]
        );

        res.json({ mensaje: "¡Perfil y ajustes actualizados correctamente! ✅" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error crítico al guardar cambios." });
    }
});

// --- 🔍 5. BUSCADOR PREDICTIVO (#13) ---
router.get('/buscar', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    try {
        const query = `SELECT usuario_id, nombre, apellido, foto_url, bio FROM perfiles WHERE nombre LIKE ? OR apellido LIKE ? LIMIT 5`;
        const termino = `${q}%`; 
        const [resultados] = await db.query(query, [termino, termino]);
        res.json(resultados);
    } catch (err) { res.status(500).json({ error: "Error en el buscador" }); }
});

// --- 👤 6. OBTENER PERFIL PÚBLICO ---
router.get('/perfil/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT u.id, u.email, p.nombre, p.apellido, p.bio, p.foto_url FROM usuarios u JOIN perfiles p ON u.id = p.usuario_id WHERE u.id = ?`;
        const [rows] = await db.query(query, [id]);
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ error: "Usuario no encontrado" });
    } catch (err) { res.status(500).json({ error: "Error en el servidor" }); }
});

// --- 🚫 7. SUSPENDER USUARIO (Lizbeth Ríos - ID: 1) ---
router.patch('/suspendido/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.body; 
    // Mantenemos el 1 porque Lizbeth hereda ese ID
    if (parseInt(adminId) !== 1) return res.status(403).json({ error: "Solo la Arquitecta Lizbeth tiene este poder." });

    try {
        await db.query('UPDATE usuarios SET estado = "suspendido" WHERE id = ?', [id]);
        res.json({ mensaje: "La cuenta ha sido suspendida correctamente. 🚫" });
    } catch (err) { res.status(500).json({ error: "Error al actualizar estado." }); }
});

// --- 🔑 8. PROMOVER USUARIO CON CÓDIGO MAESTRO ---
router.patch('/promover', async (req, res) => {
    const { usuario_a_promover, codigo, admin_solicitante_id } = req.body;
    try {
        // Mantenemos el 1 porque Lizbeth hereda ese ID
        if (admin_solicitante_id != 1) return res.status(403).json({ error: "No autorizado. Solo Lizbeth autoriza ascensos. 🚫" });

        const [busqueda] = await db.query('SELECT * FROM codigos_admin WHERE codigo = ? AND estado = "disponible"', [codigo]);
        if (busqueda.length === 0) return res.status(403).json({ error: "Código inválido o usado. ❌" });

        const codigoId = busqueda[0].id;
        await db.query('UPDATE usuarios SET rol = "admin" WHERE id = ?', [usuario_a_promover]);
        await db.query(`UPDATE codigos_admin SET estado = "usado", usuario_que_lo_uso = ?, fecha_uso = NOW() WHERE id = ?`, [usuario_a_promover, codigoId]);

        res.json({ mensaje: "¡Usuario ascendido a Administrador por la Arquitecta! ⭐" });
    } catch (err) { res.status(500).json({ error: "Error interno en ascenso." }); }
});

module.exports = router;