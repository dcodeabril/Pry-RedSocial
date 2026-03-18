// =============================================
// PROYECTO: FACEBOOK BÁSICO (VERSIÓN LOCAL)
// ROL: ARQUITECTO (MÓDULO DE VIDEOLLAMADAS - ACTUALIZACIÓN DE FUERZA CRÍTICA)
// ARCHIVO: public/js/videollamada.js
// =============================================

(function() {
    const socket = io(); 
    const miId = localStorage.getItem('usuarioId');

    let localStream;
    let peerConnection;
    let receptorIdActual;
    let ofertaRecibida = null; 

    // 📦 COLA DE ESPERA PARA CANDIDATOS ICE
    let iceCandidatesQueue = [];

    const servers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    if (miId) {
        socket.emit('join-room', miId);
        console.log(`✅ Canal de señales activo para: ${miId}`);
    }

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

    // --- 🌍 FUNCIONES GLOBALES ---

    window.abrirInterfazLlamada = function(idDestino) {
        const modal = document.getElementById('modal-videollamada');
        const controles = document.getElementById('controles-entrantes');
        
        if (modal) {
            // El que llama NO debe ver el botón de responder
            if (controles) {
                controles.style.setProperty('display', 'none', 'important');
            }

            modal.style.setProperty('display', 'flex', 'important');
            modal.classList.add('video-modal-visible');
            modal.classList.remove('video-modal-hidden');
            
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

    window.aceptarLlamadaClick = async function() {
        console.log("✅ Contestando llamada...");
        
        const controles = document.getElementById('controles-entrantes');
        if (controles) {
            controles.style.setProperty('display', 'none', 'important');
            controles.classList.add('video-controles-hidden');
        }
        
        const status = document.getElementById('video-status');
        if (status) status.innerText = "Conectando...";

        await iniciarMedia();
        crearPeerConnection(receptorIdActual);

        await peerConnection.setRemoteDescription(new RTCSessionDescription(ofertaRecibida));
        
        while (iceCandidatesQueue.length > 0) {
            const candidate = iceCandidatesQueue.shift();
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('contestar-llamada', {
            receptorId: miId,
            emisorId: receptorIdActual,
            respuesta: answer
        });
    };

    window.colgarLlamada = function() {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        const remoteVideo = document.getElementById('remoteVideo');
        const localVideo = document.getElementById('localVideo');
        if (remoteVideo) remoteVideo.srcObject = null;
        if (localVideo) localVideo.srcObject = null;
        
        const controles = document.getElementById('controles-entrantes');
        if (controles) {
            controles.style.setProperty('display', 'none', 'important');
        }

        iceCandidatesQueue = [];
        console.log("Log: 📵 Llamada terminada.");
    };

    window.colgarYSalir = function() {
        window.colgarLlamada(); 
        const modal = document.getElementById('modal-videollamada');
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.add('video-modal-hidden');
            modal.classList.remove('video-modal-visible');
        }
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

    // --- 5. ESCUCHA DE EVENTOS DEL SOCKET (LÓGICA DE FUERZA CRÍTICA) ---

    socket.on('llamada-entrante', async ({ emisorId, oferta }) => {
        console.log(`🔔 LLAMADA DETECTADA DE: ${emisorId}`);
        
        const modal = document.getElementById('modal-videollamada');
        const controles = document.getElementById('controles-entrantes');

        // 🚩 PASO 1: ACTIVACIÓN DEL PADRE (EL MODAL NEGRO)
        if (modal) {
            modal.classList.remove('video-modal-hidden', 'auth-hidden');
            modal.classList.add('video-modal-visible');
            // Forzamos visibilidad total
            modal.style.setProperty('display', 'flex', 'important');
            modal.style.setProperty('opacity', '1', 'important');
            modal.style.setProperty('visibility', 'visible', 'important');
        }
        
        // 🚩 PASO 2: ACTIVACIÓN DEL HIJO (EL BOTÓN)
        if (controles) {
            controles.classList.remove('video-controles-hidden', 'auth-hidden');
            controles.classList.add('video-controles-visible');
            // Forzamos que se centre y se ponga por encima de todo
            controles.style.setProperty('display', 'flex', 'important');
            controles.style.setProperty('z-index', '100000', 'important');
        }

        const status = document.getElementById('video-status');
        if (status) status.innerText = "📞 ALGUIEN TE ESTÁ LLAMANDO...";

        ofertaRecibida = oferta;
        receptorIdActual = emisorId;
    });

    socket.on('llamada-aceptada', async ({ respuesta }) => {
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(respuesta));
            while (iceCandidatesQueue.length > 0) {
                const candidate = iceCandidatesQueue.shift();
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
    });

    socket.on('ice-candidate', async (candidate) => {
        try {
            if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                iceCandidatesQueue.push(candidate);
            }
        } catch (e) {
            console.error("Error ICE:", e);
        }
    });

})();