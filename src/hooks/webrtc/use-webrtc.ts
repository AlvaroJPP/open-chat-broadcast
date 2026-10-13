import { useCallback, useRef, useState } from "react";

import { BroadcastWebSocket } from "../../lib/websocket";

import { useWebRTCAudio } from "./use-webrtc-audio";
import { useWebRTCCamera } from "./use-webrtc-camera";
import { useWebRTCConnection } from "./use-webrtc-connection";
import { useWebRTCEvents } from "./use-webrtc-events";
import { useWebRTCMicrophone } from "./use-webrtc-microphone";
import { useWebRTCPeers } from "./use-webrtc-peers";
import { useWebRTCQuality } from "./use-webrtc-quality";
import { useWebRTCScreen } from "./use-webrtc-screen";
import { useWebRTCSignaling } from "./use-webrtc-signaling";
import { useWebRTCTracks } from "./use-webrtc-tracks";

import type {
    MediaState,
    UseWebRTCOptions,
} from "./webrtc.types";

export function useWebRTC({ userId, roomId }: UseWebRTCOptions) {
    // WebSocket
    const websocketRef = useRef<BroadcastWebSocket | null>(null);

    // Conexões WebRTC
    const peerConnectionsRef =
        useRef<Map<string, RTCPeerConnection>>(new Map());

    const remoteStreamsRef =
        useRef<Map<string, MediaStream>>(new Map());

    const negotiationInProgressRef =
        useRef<Set<string>>(new Set());

    const pendingIceCandidatesRef =
        useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    const createOfferRef =
        useRef<((target: string) => Promise<void>) | null>(null);

    // Referências das mídias locais
    const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
    const micTrackRef = useRef<MediaStreamTrack | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    // Gerenciamento de áudio
    const {
    micSourceRef,
    setAudioSource,
    getOutboundMicAudio,
    getOutboundScreenAudio,
    cleanupAudio,
} = useWebRTCAudio();

    // Qualidade da transmissão
    const {
        streamQuality,
        streamQualityRef,
        applyQualityToTrack,
        applyQualityToSenders,
        setStreamQuality,
    } = useWebRTCQuality({
        peerConnectionsRef,
        cameraTrackRef,
        screenStreamRef,
    });

    // Estado da interface
    const [localStream, setLocalStream] =
        useState<MediaStream | null>(null);

    const [remoteStreams, setRemoteStreams] =
        useState<Map<string, MediaStream>>(new Map());

    const [connected, setConnected] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);

    const [sharingUsers, setSharingUsers] = useState<string[]>([]);
    const sharingUsersRef = useRef<Set<string>>(new Set());

    const [mediaStates, setMediaStates] =
        useState<Record<string, MediaState>>({});

    const [peerStates, setPeerStates] =
        useState<Record<string, string>>({});

    const [lastError, setLastError] = useState<string | null>(null);

    // Conexões com participantes
    const {
        createPeerConnection,
        closePeer,
        flushPendingIceCandidates,
    } = useWebRTCPeers({
        userId,
        roomId,
        websocketRef,
        peerConnectionsRef,
        remoteStreamsRef,
        pendingIceCandidatesRef,
        negotiationInProgressRef,
        createOfferRef,
        setRemoteStreams,
        setPeerStates,
    });

    // Publicação do estado das mídias
    const sendMediaState = useCallback(() => {
        if (!userId || !roomId) {
            return;
        }

        websocketRef.current?.send("media:state", {
            user: userId,
            room: roomId,
            camera: Boolean(cameraTrackRef.current),
            screen: Boolean(screenStreamRef.current),
            mic: Boolean(getOutboundMicAudio()),
        });
    }, [roomId, userId, micSourceRef]);

    // Sincronização das faixas de áudio e vídeo
    const {
    syncPeerTracks,
    publishToPeers,
} = useWebRTCTracks({
    peerConnectionsRef,
    cameraTrackRef,
    screenStreamRef,
    streamQualityRef,
    getOutboundMicAudio,
    getOutboundScreenAudio,
    applyQualityToSenders,
    sendMediaState,
    setLocalStream,
});

    // Tratamento de erros de mídia
    const reportMediaError = useCallback(
        (what: string, error: unknown) => {
            console.error(
                `[WebRTC] Não foi possível usar ${what}:`,
                error,
            );

            if (
                error instanceof DOMException &&
                error.name === "NotAllowedError"
            ) {
                return;
            }

            window.alert(
                error instanceof Error
                    ? error.message
                    : `Não foi possível usar ${what}.`,
            );
        },
        [],
    );

    // Verificação do contexto seguro do navegador
    const requireSecureContext = useCallback((): boolean => {
        if (window.isSecureContext && navigator.mediaDevices) {
            return true;
        }

        window.alert(
            `Câmera, microfone e compartilhamento de tela exigem HTTPS (ou localhost). Você abriu ${window.location.origin}. Acesse por https://${window.location.host} e aceite/instale o certificado.`,
        );

        return false;
    }, []);

    // Câmera
    const { startCamera, stopCamera } = useWebRTCCamera({
        cameraTrackRef,
        streamQualityRef,
        applyQualityToTrack,
        applyQualityToSenders,
        publishToPeers,
        reportMediaError,
        requireSecureContext,
        setIsCameraOn,
    });

    // Microfone
    const { startMic, stopMic } = useWebRTCMicrophone({
        micTrackRef,
        setAudioSource,
        publishToPeers,
        reportMediaError,
        requireSecureContext,
        setIsMicOn,
    });

    // Compartilhamento de tela
    const { startScreenShare, stopScreenShare } = useWebRTCScreen({
        userId,
        roomId,
        screenStreamRef,
        websocketRef,
        streamQualityRef,
        applyQualityToTrack,
        applyQualityToSenders,
        setAudioSource,
        publishToPeers,
        reportMediaError,
        requireSecureContext,
        setIsScreenSharing,
    });

    // Encerramento de todas as mídias locais
    const stopAllMedia = useCallback(() => {
        stopScreenShare();
        stopCamera();
        stopMic();
    }, [stopCamera, stopMic, stopScreenShare]);

    // Sinalização WebRTC
    const {
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
    } = useWebRTCSignaling({
        userId,
        roomId,
        websocketRef,
        peerConnectionsRef,
        negotiationInProgressRef,
        pendingIceCandidatesRef,
        createOfferRef,
        createPeerConnection,
        flushPendingIceCandidates,
        syncPeerTracks,
    });

    // Tratamento de eventos recebidos
    const { handleMessage } = useWebRTCEvents({
        userId,
        roomId,
        peerConnectionsRef,
        sharingUsersRef,
        createOffer,
        closePeer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        sendMediaState,
        setLastError,
        stopMic,
        setSharingUsers,
        setMediaStates,
    });

    // WebSocket e ciclo de vida das conexões
    useWebRTCConnection({
        userId,
        roomId,
        websocketRef,
        peerConnectionsRef,
        remoteStreamsRef,
        pendingIceCandidatesRef,
        negotiationInProgressRef,
        screenStreamRef,
        cameraTrackRef,
        micTrackRef,
        sharingUsersRef,
        handleMessage,
        cleanupAudio,
        setConnected,
        setRemoteStreams,
        setLocalStream,
        setIsScreenSharing,
        setIsCameraOn,
        setIsMicOn,
        setSharingUsers,
        setMediaStates,
        setPeerStates,
    });

    // API pública do hook
    return {
        connected,
        localStream,
        remoteStreams,
        isScreenSharing,
        isCameraOn,
        isMicOn,
        sharingUsers,
        mediaStates,
        peerStates,
        lastError,
        streamQuality,
        setStreamQuality,
        startCamera,
        stopCamera,
        startMic,
        stopMic,
        startScreenShare,
        stopScreenShare,
        stopAllMedia,
    };
}
