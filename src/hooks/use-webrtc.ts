import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import {
    BroadcastWebSocket,
    type WebSocketMessage
} from "../lib/websocket";

type UseWebRTCOptions = {
    userId: string;
    roomId: string;
};

type WebRTCSignal = {
    user: string;
    room: string;
    target: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
};

export function useWebRTC({
    userId,
    roomId
}: UseWebRTCOptions) {
    const websocketRef =
        useRef<BroadcastWebSocket | null>(null);

    const peerConnectionsRef =
        useRef<Map<string, RTCPeerConnection>>(
            new Map()
        );

    const cameraStreamRef =
        useRef<MediaStream | null>(null);

    const screenStreamRef =
        useRef<MediaStream | null>(null);

    const localStreamRef =
        useRef<MediaStream | null>(null);

    const remoteStreamsRef =
        useRef<Map<string, MediaStream>>(
            new Map()
        );

    const [localStream, setLocalStream] =
        useState<MediaStream | null>(null);

    const [remoteStreams, setRemoteStreams] =
        useState<Map<string, MediaStream>>(
            new Map()
        );

    const [connected, setConnected] =
        useState(false);

    const [isScreenSharing, setIsScreenSharing] =
        useState(false);

    const createPeerConnection =
        useCallback(
            (targetUserId: string) => {
                const existing =
                    peerConnectionsRef.current.get(
                        targetUserId
                    );

                if (existing) {
                    return existing;
                }

                const peerConnection =
                    new RTCPeerConnection({
                        iceServers: [
                            {
                                urls:
                                    "stun:stun.l.google.com:19302"
                            }
                        ]
                    });

                peerConnection.onicecandidate =
                    (event) => {
                        if (!event.candidate) {
                            return;
                        }

                        websocketRef.current?.send(
                            "webrtc:ice:candidate",
                            {
                                user: userId,
                                room: roomId,
                                target: targetUserId,
                                candidate:
                                    event.candidate.toJSON()
                            }
                        );
                    };

                peerConnection.ontrack =
                    (event) => {
                        const [stream] =
                            event.streams;

                        if (!stream) {
                            return;
                        }

                        remoteStreamsRef.current.set(
                            targetUserId,
                            stream
                        );

                        setRemoteStreams(
                            new Map(
                                remoteStreamsRef.current
                            )
                        );
                    };

                peerConnection.onconnectionstatechange =
                    () => {
                        console.log(
                            `[WebRTC] ${targetUserId}:`,
                            peerConnection.connectionState
                        );

                        if (
                            peerConnection.connectionState ===
                                "failed" ||
                            peerConnection.connectionState ===
                                "closed"
                        ) {
                            peerConnectionsRef.current.delete(
                                targetUserId
                            );

                            remoteStreamsRef.current.delete(
                                targetUserId
                            );

                            setRemoteStreams(
                                new Map(
                                    remoteStreamsRef.current
                                )
                            );
                        }
                    };

                peerConnectionsRef.current.set(
                    targetUserId,
                    peerConnection
                );

                return peerConnection;
            },
            [roomId, userId]
        );

    const updateLocalStream = useCallback(
        (
            cameraStream: MediaStream,
            screenStream?: MediaStream | null
        ) => {
            const tracks: MediaStreamTrack[] = [];

            if (screenStream) {
                const screenVideo =
                    screenStream.getVideoTracks()[0];

                if (screenVideo) {
                    tracks.push(screenVideo);
                }
            } else {
                const cameraVideo =
                    cameraStream.getVideoTracks()[0];

                if (cameraVideo) {
                    tracks.push(cameraVideo);
                }
            }

            const microphone =
                cameraStream.getAudioTracks()[0];

            if (microphone) {
                tracks.push(microphone);
            }

            const stream =
                new MediaStream(tracks);

            localStreamRef.current = stream;
            setLocalStream(stream);

            return stream;
        },
        []
    );

    const startLocalMedia =
        useCallback(async () => {
            if (cameraStreamRef.current) {
                return (
                    localStreamRef.current ??
                    cameraStreamRef.current
                );
            }

            const cameraStream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: true,
                        audio: true
                    }
                );

            cameraStreamRef.current =
                cameraStream;

            return updateLocalStream(
                cameraStream,
                screenStreamRef.current
            );
        }, [updateLocalStream]);

    const stopScreenShare =
        useCallback(() => {
            const cameraStream =
                cameraStreamRef.current;

            const screenStream =
                screenStreamRef.current;

            if (!cameraStream) {
                return;
            }

            const cameraVideo =
                cameraStream.getVideoTracks()[0];

            if (!cameraVideo) {
                return;
            }

            for (const peerConnection of
                peerConnectionsRef.current.values()) {
                const videoSender =
                    peerConnection
                        .getSenders()
                        .find(
                            (sender) =>
                                sender.track?.kind ===
                                "video"
                        );

                if (videoSender) {
                    void videoSender.replaceTrack(
                        cameraVideo
                    );
                }
            }

            screenStream
                ?.getTracks()
                .forEach((track) => {
                    track.stop();
                });

            screenStreamRef.current = null;

            updateLocalStream(
                cameraStream,
                null
            );

            setIsScreenSharing(false);

            console.log(
                "[WebRTC] Compartilhamento de tela encerrado."
            );
        }, [updateLocalStream]);

    const startScreenShare =
        useCallback(async () => {
            try {
                if (screenStreamRef.current) {
                    return;
                }

                const cameraStream =
                    await startLocalMedia();

                const screenStream =
                    await navigator.mediaDevices.getDisplayMedia(
                        {
                            video: true,
                            audio: false
                        }
                    );

                const screenVideo =
                    screenStream.getVideoTracks()[0];

                if (!screenVideo) {
                    screenStream
                        .getTracks()
                        .forEach((track) =>
                            track.stop()
                        );

                    return;
                }

                screenStreamRef.current =
                    screenStream;

                screenVideo.onended = () => {
                    stopScreenShare();
                };

                for (const peerConnection of
                    peerConnectionsRef.current.values()) {
                    const videoSender =
                        peerConnection
                            .getSenders()
                            .find(
                                (sender) =>
                                    sender.track?.kind ===
                                    "video"
                            );

                    if (videoSender) {
                        await videoSender.replaceTrack(
                            screenVideo
                        );
                    }
                }

                updateLocalStream(
                    cameraStream,
                    screenStream
                );

                setIsScreenSharing(true);

                console.log(
                    "[WebRTC] Compartilhamento de tela iniciado."
                );
            } catch (error) {
                console.error(
                    "[WebRTC] Não foi possível compartilhar a tela:",
                    error
                );
            }
        }, [
            startLocalMedia,
            stopScreenShare,
            updateLocalStream
        ]);

    const createOffer =
        useCallback(
            async (targetUserId: string) => {
                const stream =
                    await startLocalMedia();

                const peerConnection =
                    createPeerConnection(
                        targetUserId
                    );

                for (const track of
                    stream.getTracks()) {
                    const alreadyAdded =
                        peerConnection
                            .getSenders()
                            .some(
                                (sender) =>
                                    sender.track?.id ===
                                    track.id
                            );

                    if (!alreadyAdded) {
                        peerConnection.addTrack(
                            track,
                            stream
                        );
                    }
                }

                const offer =
                    await peerConnection.createOffer();

                await peerConnection.setLocalDescription(
                    offer
                );

                websocketRef.current?.send(
                    "webrtc:offer",
                    {
                        user: userId,
                        room: roomId,
                        target: targetUserId,
                        sdp: offer
                    }
                );
            },
            [
                createPeerConnection,
                roomId,
                startLocalMedia,
                userId
            ]
        );

    const handleOffer =
        useCallback(
            async (data: WebRTCSignal) => {
                const stream =
                    await startLocalMedia();

                const peerConnection =
                    createPeerConnection(
                        data.user
                    );

                for (const track of
                    stream.getTracks()) {
                    const alreadyAdded =
                        peerConnection
                            .getSenders()
                            .some(
                                (sender) =>
                                    sender.track?.id ===
                                    track.id
                            );

                    if (!alreadyAdded) {
                        peerConnection.addTrack(
                            track,
                            stream
                        );
                    }
                }

                if (!data.sdp) {
                    return;
                }

                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(
                        data.sdp
                    )
                );

                const answer =
                    await peerConnection.createAnswer();

                await peerConnection.setLocalDescription(
                    answer
                );

                websocketRef.current?.send(
                    "webrtc:answer",
                    {
                        user: userId,
                        room: roomId,
                        target: data.user,
                        sdp: answer
                    }
                );
            },
            [
                createPeerConnection,
                roomId,
                startLocalMedia,
                userId
            ]
        );

    const handleAnswer =
        useCallback(
            async (data: WebRTCSignal) => {
                const peerConnection =
                    peerConnectionsRef.current.get(
                        data.user
                    );

                if (!peerConnection) {
                    console.warn(
                        "[WebRTC] PeerConnection não encontrada:",
                        data.user
                    );

                    return;
                }

                if (!data.sdp) {
                    return;
                }

                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(
                        data.sdp
                    )
                );
            },
            []
        );

    const handleIceCandidate =
        useCallback(
            async (data: WebRTCSignal) => {
                const peerConnection =
                    peerConnectionsRef.current.get(
                        data.user
                    );

                if (!peerConnection) {
                    console.warn(
                        "[WebRTC] PeerConnection não encontrada para ICE:",
                        data.user
                    );

                    return;
                }

                if (!data.candidate) {
                    return;
                }

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(
                        data.candidate
                    )
                );
            },
            []
        );

    useEffect(() => {
        const websocket =
            new BroadcastWebSocket();

        websocketRef.current =
            websocket;

        let unsubscribe:
            (() => void) | null = null;

        async function initialize() {
            try {
                await websocket.connect();

                setConnected(true);

                unsubscribe =
                    websocket.onMessage(
                        (
                            message: WebSocketMessage
                        ) => {
                            const data =
                                message.data as WebRTCSignal;

                            switch (
                                message.event
                            ) {
                                case "webrtc:offer":
                                    void handleOffer(
                                        data
                                    );
                                    break;

                                case "webrtc:answer":
                                    void handleAnswer(
                                        data
                                    );
                                    break;

                                case "webrtc:ice:candidate":
                                    void handleIceCandidate(
                                        data
                                    );
                                    break;
                            }
                        }
                    );

                websocket.send(
                    "room:join",
                    {
                        user: userId,
                        room: roomId
                    }
                );
            } catch (error) {
                console.error(
                    "[WebRTC] Falha ao iniciar:",
                    error
                );
            }
        }

        void initialize();

        return () => {
            unsubscribe?.();

            websocket.send(
                "room:leave",
                {
                    user: userId,
                    room: roomId
                }
            );

            websocket.disconnect();

            for (const peerConnection of
                peerConnectionsRef.current.values()) {
                peerConnection.close();
            }

            peerConnectionsRef.current.clear();

            screenStreamRef.current
                ?.getTracks()
                .forEach((track) =>
                    track.stop()
                );

            cameraStreamRef.current
                ?.getTracks()
                .forEach((track) =>
                    track.stop()
                );

            screenStreamRef.current = null;
            cameraStreamRef.current = null;
            localStreamRef.current = null;

            remoteStreamsRef.current.clear();
        };
    }, [
        handleAnswer,
        handleIceCandidate,
        handleOffer,
        roomId,
        userId
    ]);

    return {
        connected,
        localStream,
        remoteStreams,
        isScreenSharing,
        startLocalMedia,
        startScreenShare,
        stopScreenShare,
        createOffer
    };
}