# Guía de trabajo: Red Social Local

## Alcance y arquitectura comprobada

- Este repositorio es una red social local con Node.js, Express 4, MySQL (`mysql2/promise`), Socket.IO y páginas HTML/CSS/JavaScript. No usa React, Vite, Bootstrap ni PostgreSQL.
- `server.js` configura HTTP, archivos estáticos, Socket.IO y monta los módulos de `rutas/` bajo `/api/`.
- `db/base_datos.js` es el único punto de conexión MySQL. Usa variables `DB_*` de `.env`; no escribir credenciales en el código ni publicar `.env`.
- `public/` contiene las páginas y los recursos accesibles desde el navegador. Nunca guardar scripts de mantenimiento, secretos o lógica exclusiva del servidor allí.
- `servicios/autenticacion.js` contiene el inicio de sesión compartido por `/api/usuarios/login` y `/api/seguridad/login`.
- `herramientas/` contiene tareas manuales de mantenimiento. No ejecutarlas al iniciar la aplicación ni durante pruebas normales.

## Mapa funcional

- Acceso y registro: `public/auth.html`, `public/registro.html`, `public/js/auth.js`, `public/js/auth_cliente.js`, `rutas/usuarios.routes.js`, `rutas/seguridad.routes.js`.
- Muro, perfil, reacciones, comentarios y baúl: `public/index.html`, `public/perfil.html`, `public/baul.html`, `public/js/publicaciones.js`, `rutas/publicaciones.routes.js`.
- Amistades, bloqueos, búsqueda y perfil: `rutas/amistades.routes.js`, `rutas/bloqueos.routes.js`, `public/js/buscar.js`.
- Chat y llamadas: `rutas/chats.routes.js`, `public/js/mensajes.js`, `public/js/videollamada.js`, eventos Socket.IO de `server.js`.
- Notas, eventos y notificaciones: módulos homónimos de `rutas/` y `public/js/`.
- Administración y reportes: `public/admin*.html`, `rutas/admin.routes.js`, `rutas/reportes.routes.js`.
- Diseño compartido: `public/css/general.css`, `public/js/tema.js`, `public/js/usuario_global.js`; las páginas añaden su propio CSS y JavaScript.
- Modo sin conexión: `public/sw.js`, `public/desconexion.*`, `public/manifest.json`.

## Reglas adaptadas del documento residencial

1. Inspeccionar consumidores y referencias antes de cambiar un archivo, ruta o nombre. Mantener las rutas públicas y la estructura que ya funciona.
2. Buscar, reutilizar y extender antes de crear. Extraer lógica compartida solo si existe duplicación real. Evitar React, carpetas o componentes del proyecto residencial.
3. Usar nombres internos en español latinoamericano cuando sea seguro. Conservar nombres de API, campos de MySQL, claves de `localStorage`, eventos Socket.IO y rutas públicas si cambiarlos rompe consumidores.
4. Proteger todas las páginas relacionadas con cada cambio, incluido móvil. Reutilizar variables y estilos de `public/css/general.css`; no imponer el estilo neumórfico del proyecto residencial.
5. Mantener acceso a la base en el servidor. Validar datos del cliente en las rutas; usar parámetros SQL. No confiar en el rol o ID guardado en el navegador para autorizar operaciones sensibles.
6. No añadir dependencias, abstracciones, archivos copia ni refactorizaciones extensas sin necesidad. Si una operación modifica varias tablas, revisar atomicidad y consistencia.
7. Después de editar, ejecutar `npm test`, comprobar la sintaxis JavaScript y probar las rutas o páginas afectadas. Este proyecto no define un comando `build`; no inventar uno.
8. No ejecutar `herramientas/migrar_contrasenas.js` sin respaldo y una tarea explícita de migración.

## Límites actuales detectados

- La protección de páginas en `public/js/guardia.js` usa `localStorage`. Las rutas HTTP y los eventos Socket.IO no verifican una sesión del servidor; varios permisos dependen de IDs enviados por el cliente. Hace falta diseñar autenticación y autorización del lado del servidor antes de usar la aplicación con usuarios no confiables.
- Hay datos de la API insertados con `innerHTML` en varias páginas. Revisar escape o construcción segura del DOM antes de aceptar contenido no confiable.
- El registro escribe en varias tablas sin transacción. Una falla intermedia puede dejar una cuenta incompleta.
- No hay esquema SQL, migraciones ni pruebas de interfaz automatizadas versionadas. La base local puede existir, pero su estado no se deduce solo del repositorio.
- La navegación, el avatar y el cierre de sesión se repiten en HTML. Consolidarlos requiere probar todas las páginas afectadas; no hacerlo solo por estilo.
- `npm run dev` invoca `nodemon`, pero `nodemon` no está declarado como dependencia. La aplicación sí arranca con `npm start`.
- Hay referencias a `/img/default.png`, `/uploads/perfiles/default.png` y `favicon.ico` sin archivos correspondientes en `public/`. Los fallbacks de imagen requieren revisión.
