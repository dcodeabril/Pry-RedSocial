const NOMBRE_CACHE = 'fb-local-v4';

// 📋 Lista de recursos críticos (Verificados en tu carpeta /public)
const ARCHIVOS_OFFLINE = [
    '/',
    '/auth.html',
    '/desconexion.html',
    '/desconexion.css',
    '/desconexion.js',
    '/manifest.json', // 👈 Añadido para estabilidad de la PWA
    'https://unpkg.com/gsap@3/dist/gsap.min.js'
];

// 1. INSTALACIÓN: Guardado de seguridad
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(NOMBRE_CACHE).then((cache) => {
            console.log("📦 Maestro del Caché: Protegiendo recursos en v4...");
            return Promise.allSettled(
                ARCHIVOS_OFFLINE.map(url => cache.add(url))
            ).then(() => console.log("✅ Blindaje v4 completado con éxito."));
        })
    );
});

// 2. ACTIVACIÓN: Limpieza de versiones antiguas
self.addEventListener('activate', (e) => {
    e.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map(key => {
                        if (key !== NOMBRE_CACHE) {
                            console.log('🧹 Limpiando rastro antiguo:', key);
                            return caches.delete(key);
                        }
                    })
                );
            })
        ])
    );
    console.log('🚀 Service Worker v4: Sistema de patrullaje activo.');
});

// 3. INTERCEPCIÓN: Gestión inteligente de la red
self.addEventListener('fetch', (e) => {
    // A. Navegación (HTML principal)
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).catch(() => {
                console.warn('🌐 Red caída. Activando refugio del Yeti...');
                return caches.match('/desconexion.html');
            })
        );
    } 
    // B. Recursos estáticos (CSS, JS, Imágenes, Manifest)
    else {
        e.respondWith(
            caches.match(e.request).then((respuestaCache) => {
                return respuestaCache || fetch(e.request);
            })
        );
    }
});