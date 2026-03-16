// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (MÓDULO DE VIDEOLLAMADAS #11 - VERSIÓN FINAL)
// ARCHIVO: public/js/videollamada.js
// =============================================

(function() {
    // 🛡️ Cápsula de seguridad para evitar errores de declaración duplicada (miId)
    const socket = io(); 
    const miId = localStorage.getItem('usuarioId');

    let localStream;
    let peerConnection;
    let receptorIdActual;
    let ofertaRecibida = null; 

    const servers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // --- 1. INICIALIZACIÓN ---
    if (miId) {
        socket.emit('join-room', miId);
        console.log(`✅ Canal de señales activo para: ${miId}`);
    }

    // --- 2. ACCESO A CÁMARA Y MICRÓFONO ---
    async function iniciarMedia() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const localVideo = document.getElementById('localVideo');
            if (localVideo) localVideo.srcObject = localStream;
        } catch (err) {
            console.error("❌ Error de cámara:", err);
            alert("Permite el acceso a la cámara para realizar la videollamada.");
        }
    }

    // --- 3. LÓGICA DE WEBRTC ---
    function crearPeerConnection(targetId) {
        peerConnection = new RTCPeerConnection(servers);

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        peerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) remoteVideo.srcObject = event.streams[0];
            const status = document.getElementById('video-status');
            if (status) status.innerText = "En llamada";
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { targetId, candidate: event.candidate });
            }
        };
    }

    // --- 🌍 4. FUNCIONES GLOBALES (Exportadas al objeto window) ---

    window.abrirInterfazLlamada = function(idDestino) {
        const modal = document.getElementById('modal-videollamada');
        if (modal) {
            modal.style.display = 'flex';
            const status = document.getElementById('video-status');
            if (status) status.innerText = "Llamando...";
            window.llamarUsuario(idDestino); 
        }
    };

    window.llamarUsuario = async function(idDestino) {
        receptorIdActual = idDestino;
        await iniciarMedia();
        crearPeerConnection(idDestino);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('iniciar-llamada', {
            emisorId: miId,
            receptorId: idDestino,
            oferta: offer
        });
    };

    // ✅ ACCIÓN: Contestar llamada desde el botón verde
    window.aceptarLlamadaClick = async function() {
        console.log("✅ Contestando llamada...");
        
        const controles = document.getElementById('controles-entrantes');
        if (controles) controles.style.display = 'none';
        
        const status = document.getElementById('video-status');
        if (status) status.innerText = "Conectando...";

        await iniciarMedia();
        crearPeerConnection(receptorIdActual);

        await peerConnection.setRemoteDescription(new RTCSessionDescription(ofertaRecibida));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('contestar-llamada', {
            receptorId: miId,
            emisorId: receptorIdActual,
            respuesta: answer
        });
    };

    // ✅ COLGAR: Corregido con guardias de seguridad para evitar el error de "null"
    window.colgarLlamada = function() {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        // Limpiamos los videos solo si los elementos existen
        const remoteVideo = document.getElementById('remoteVideo');
        const localVideo = document.getElementById('localVideo');
        if (remoteVideo) remoteVideo.srcObject = null;
        if (localVideo) localVideo.srcObject = null;
        
        // 🛡️ Guardia contra el error Uncaught TypeError
        const controles = document.getElementById('controles-entrantes');
        if (controles) {
            controles.style.display = 'none';
        }
        
        console.log("📵 Llamada terminada.");
    };

    window.colgarYSalir = function() {
        window.colgarLlamada(); 
        const modal = document.getElementById('modal-videollamada');
        if (modal) modal.style.display = 'none';
    };

    window.toggleMic = () => {
        if (!localStream) return;
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        const btn = document.getElementById('btn-mic');
        if (btn) btn.innerText = audioTrack.enabled ? '🎤' : '🔇';
    };

    window.toggleCam = () => {
        if (!localStream) return;
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        const btn = document.getElementById('btn-cam');
        if (btn) btn.innerText = videoTrack.enabled ? '📷' : '🚫';
    };

    // --- 5. ESCUCHA DE EVENTOS DEL SOCKET ---

    socket.on('llamada-entrante', async ({ emisorId, oferta }) => {
        console.log(`🔔 Recibiendo llamada de: ${emisorId}`);
        ofertaRecibida = oferta;
        receptorIdActual = emisorId;

        const modal = document.getElementById('modal-videollamada');
        const status = document.getElementById('video-status');
        const controles = document.getElementById('controles-entrantes');

        if (modal) modal.style.display = 'flex';
        if (status) status.innerText = "📞 Llamada Entrante...";
        
        // Solo activamos el botón si el elemento existe en el HTML
        if (controles) {
            controles.style.display = 'block';
        } else {
            console.warn("⚠️ Advertencia: No se encontró '#controles-entrantes' en este archivo HTML.");
        }
    });

    socket.on('llamada-aceptada', async ({ respuesta }) => {
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(respuesta));
        }
    });

    socket.on('ice-candidate', async (candidate) => {
        try {
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (e) {
            console.error("Error ICE:", e);
        }
    });

})(); // 🚪 Fin de la cápsula