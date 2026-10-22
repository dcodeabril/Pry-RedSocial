const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/base_datos');
const rutasUsuarios = require('../rutas/usuarios.routes');
const rutasSeguridad = require('../rutas/seguridad.routes');

test('ambas rutas de acceso comparten validación y no exponen la contraseña', async (contexto) => {
    const usuario = {
        id: 7,
        email: 'persona@ejemplo.com',
        password: 'hash-almacenado',
        rol: 'usuario',
        estado: 'activo',
        nombre: 'Persona'
    };
    let encontrados = [usuario];
    let coincide = true;
    let consultas = 0;
    let comparaciones = 0;

    contexto.mock.method(db, 'query', async (consulta, parametros) => {
        consultas++;
        assert.match(consulta, /WHERE u\.email = \?/);
        assert.deepEqual(parametros, [usuario.email]);
        return [encontrados];
    });
    contexto.mock.method(bcrypt, 'compare', async (texto, hash) => {
        comparaciones++;
        assert.equal(texto, 'clave-ingresada');
        assert.equal(hash, usuario.password);
        return coincide;
    });

    const aplicacion = express();
    aplicacion.use(express.json());
    aplicacion.use('/api/usuarios', rutasUsuarios);
    aplicacion.use('/api/seguridad', rutasSeguridad);

    const servidor = await new Promise((resolver) => {
        const instancia = aplicacion.listen(0, '127.0.0.1', () => resolver(instancia));
    });
    contexto.after(() => new Promise((resolver) => servidor.close(resolver)));
    const origen = `http://127.0.0.1:${servidor.address().port}`;

    async function enviar(ruta, cuerpo) {
        const respuesta = await fetch(`${origen}${ruta}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cuerpo)
        });
        return { estado: respuesta.status, datos: await respuesta.json() };
    }

    for (const ruta of ['/api/usuarios/login', '/api/seguridad/login']) {
        const exito = await enviar(ruta, { email: usuario.email, password: 'clave-ingresada' });
        assert.equal(exito.estado, 200);
        assert.deepEqual(exito.datos, {
            usuarioId: 7,
            nombre: 'Persona',
            rol: 'usuario',
            email: usuario.email
        });
        assert.equal('password' in exito.datos, false);

        coincide = false;
        assert.equal((await enviar(ruta, { email: usuario.email, password: 'clave-ingresada' })).estado, 401);
        coincide = true;
    }
    assert.equal(comparaciones, 4);

    usuario.estado = 'suspendido';
    assert.equal((await enviar('/api/seguridad/login', { email: usuario.email, password: 'clave-ingresada' })).estado, 403);
    assert.equal(comparaciones, 4);
    usuario.estado = 'activo';

    encontrados = [];
    assert.equal((await enviar('/api/usuarios/login', { email: usuario.email, password: 'clave-ingresada' })).estado, 401);

    const consultasPrevias = consultas;
    assert.equal((await enviar('/api/usuarios/login', { email: usuario.email })).estado, 400);
    assert.equal((await enviar('/api/usuarios/registro', { email: usuario.email })).estado, 400);
    assert.equal(consultas, consultasPrevias);
});
