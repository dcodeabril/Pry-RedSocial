const express = require('express');
const router = express.Router();
const db = require('../db/base_datos');

// [1] OBTENER EL MURO (Feed)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT p.*, perf.nombre, perf.apellido 
            FROM publicaciones p
            JOIN perfiles perf ON p.usuario_id = perf.usuario_id
            ORDER BY p.fecha DESC`;
        const [posts] = await db.query(query);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "Error al cargar el muro" });
    }
});

// [2] CREAR NUEVA PUBLICACIÓN
router.post('/', async (req, res) => {
    const { usuario_id, contenido, privacidad } = req.body;
    try {
        await db.query(
            'INSERT INTO publicaciones (usuario_id, contenido, privacidad) VALUES (?, ?, ?)',
            [usuario_id, contenido, privacidad || 'publica']
        );
        res.status(201).json({ mensaje: "Publicación compartida" });
    } catch (err) {
        res.status(500).json({ error: "Error al crear la publicación" });
    }
});

// [3] REACCIONAR A UN POST (Me gusta)
router.post('/reaccionar', async (req, res) => {
    const { publicacion_id, usuario_id, tipo } = req.body;
    try {
        await db.query(
            'INSERT INTO reacciones (publicacion_id, usuario_id, tipo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE tipo = ?',
            [publicacion_id, usuario_id, tipo, tipo]
        );
        res.json({ mensaje: "Reacción guardada" });
    } catch (err) {
        res.status(500).json({ error: "Error al reaccionar" });
    }
});

// [4] OBTENER COMENTARIOS (Añadido aquí)
router.get('/:id/comentarios', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT c.*, p.nombre FROM comentarios c JOIN perfiles p ON c.usuario_id = p.usuario_id WHERE c.publicacion_id = ?`;
        const [comentarios] = await db.query(query, [id]);
        res.json(comentarios);
    } catch (err) { res.status(500).send(err); }
});

// [5] CREAR COMENTARIO (Añadido aquí)
router.post('/comentar', async (req, res) => {
    const { publicacion_id, usuario_id, contenido } = req.body;
    try {
        await db.query('INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES (?, ?, ?)', [publicacion_id, usuario_id, contenido]);
        res.json({ mensaje: "Comentario guardado" });
    } catch (err) { res.status(500).send(err); }
});

// ESTA SIEMPRE DEBE SER LA ÚLTIMA LÍNEA
module.exports = router;