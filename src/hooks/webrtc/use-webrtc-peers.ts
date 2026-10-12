
import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import { getRtcConfiguration } from "./webrtc.config";
import type { BroadcastWebSocket } from "../../lib/websocket";

type MutableRef<T> = {
    current: T;
};

type UseWebRTCPeersOptions = {
    userId: string;
    roomId: string;
    websocketRef: MutableRef<BroadcastWebSocket | null>;
    peerConnectionsRef: MutableRef<Map<string, RTCPeerConnection>>;
    remoteStreamsRef: MutableRef<Map<string, MediaStream>>;
    pendingIceCandidatesRef: MutableRef<Map<string, RTCIceCandidateInit[]>>;
    negotiationInProgressRef: MutableRef<Set<string>>;
    createOfferRef: MutableRef<((target: string) => Promise<void>) | null>;
    setRemoteStreams: Dispatch<SetStateAction<Map<string, MediaStream>>>;
    setPeerStates: Dispatch<SetStateAction<Record<string, string>>>;
};

type RemoteStreamWithSources = MediaStream & {
    screenStream?: MediaStream;
    cameraStream?: MediaStream;
    micAudioStream?: MediaStream;
    screenAudioStream?: MediaStream;
};

export function useWebRTCPeers({
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
}: UseWebRTCPeersOptions) {
    const flushPendingIceCandidates = useCallback(
        async (
            targetUserId: string,
            peerConnection: RTCPeerConnection,
        ) => {
            if (!peerConnection.remoteDescription) return;

            const queued =
                pendingIceCandidatesRef.current.get(targetUserId) ?? [];

            if (queued.length === 0) return;

            pendingIceCandidatesRef.current.delete(targetUserId);

            for (const candidate of queued) {
                try {
                    await peerConnection.addIceCandidate(
                        new RTCIceCandidate(candidate),
                    );
                } catch (error) {
                    console.warn(
                        "[WebRTC] Ignorando ICE pendente:",
                        error,
                    );
                }
            }
        },
        [pendingIceCandidatesRef],
    );

    const closePeer = useCallback(
        (targetUserId: string) => {
            const peerConnection =
                peerConnectionsRef.current.get(targetUserId);

            if (peerConnection) {
                peerConnection.onconnectionstatechange = null;
                peerConnection.onnegotiationneeded = null;
                peerConnection.ontrack = null;
                peerConnection.onicecandidate = null;
                peerConnection.close();
            }

            peerConnectionsRef.current.delete(targetUserId);
            pendingIceCandidatesRef.current.delete(targetUserId);
            negotiationInProgressRef.current.delete(targetUserId);
            remoteStreamsRef.current.delete(targetUserId);

            setRemoteStreams(new Map(remoteStreamsRef.current));

            setPeerStates(previous => {
                const next = { ...previous };
                delete next[targetUserId];
                return next;
            });
        },
        [
            negotiationInProgressRef,
            peerConnectionsRef,
            pendingIceCandidatesRef,
            remoteStreamsRef,
            setPeerStates,
            setRemoteStreams,
        ],
    );

    const createPeerConnection = useCallback(
        (targetUserId: string): RTCPeerConnection | null => {
            if (!targetUserId || targetUserId === userId) {
                console.warn(
                    "[WebRTC] Ignorando conexão consigo mesmo:",
                    targetUserId,
                );
                return null;
            }

            const existing =
                peerConnectionsRef.current.get(targetUserId);

            if (existing) return existing;

            const peerConnection =
                new RTCPeerConnection(getRtcConfiguration());

            peerConnection.onicecandidate = event => {
                if (!event.candidate) return;

                websocketRef.current?.send(
                    "webrtc:ice:candidate",
                    {
                        user: userId,
                        room: roomId,
                        target: targetUserId,
                        candidate: event.candidate.toJSON(),
                    },
                );
            };

            peerConnection.onnegotiationneeded = () => {
                void createOfferRef.current?.(targetUserId);
            };

            peerConnection.ontrack = event => {
                const track = event.track;

                let stream =
                    remoteStreamsRef.current.get(targetUserId) as
                        | RemoteStreamWithSources
                        | undefined;

                if (!stream) {
                    stream = new MediaStream() as RemoteStreamWithSources;
                    remoteStreamsRef.current.set(targetUserId, stream);
                }

                const addTrackIfMissing = (
                    destination: MediaStream,
                ) => {
                    if (
                        !destination
                            .getTracks()
                            .some(item => item.id === track.id)
                    ) {
                        destination.addTrack(track);
                    }
                };

                if (track.kind === "video") {
                    // Preserva os dois canais de vídeo existentes:
                    // 0 = tela; 1 = câmera.
                    const videoTransceivers =
                        peerConnection
                            .getTransceivers()
                            .filter(
                                transceiver =>
                                    transceiver.receiver.track.kind === "video" &&
                                    transceiver.direction !== "stopped",
                            );

                    const index =
                        videoTransceivers.indexOf(event.transceiver);

                    const source =
                        index === 0
                            ? "screenStream"
                            : index === 1
                              ? "cameraStream"
                              : null;

                    if (source) {
                        let destination = stream[source];

                        if (!destination) {
                            destination = new MediaStream();
                            stream[source] = destination;
                        }

                        addTrackIfMissing(destination);
                    }

                    // O stream principal contém somente vídeo.
                    addTrackIfMissing(stream);
                } else if (track.kind === "audio") {
                    // O áudio é classificado pelo transceiver,
                    // não pela ordem de chegada do evento.
                    const audioTransceivers =
                        peerConnection
                            .getTransceivers()
                            .filter(
                                transceiver =>
                                    transceiver.receiver.track.kind === "audio" &&
                                    transceiver.direction !== "stopped",
                            );

                    const index =
                        audioTransceivers.indexOf(event.transceiver);

                    const source =
                        index === 0
                            ? "micAudioStream"
                            : index === 1
                              ? "screenAudioStream"
                              : null;

                    if (source) {
                        let destination = stream[source];

                        if (!destination) {
                            destination = new MediaStream();
                            stream[source] = destination;
                        }

                        addTrackIfMissing(destination);
                    }

                    // Não adiciona áudio ao stream principal de vídeo.
                }

                track.addEventListener(
                    "ended",
                    () => {
                        stream?.getTracks()
                            .filter(item => item.id === track.id)
                            .forEach(item => stream?.removeTrack(item));

                        const sources: Array<
                            "screenStream" |
                            "cameraStream" |
                            "micAudioStream" |
                            "screenAudioStream"
                        > = [
                            "screenStream",
                            "cameraStream",
                            "micAudioStream",
                            "screenAudioStream",
                        ];

                        for (const source of sources) {
                            const destination = stream?.[source];

                            destination
                                ?.getTracks()
                                .filter(item => item.id === track.id)
                                .forEach(item => destination.removeTrack(item));

                            if (
                                destination &&
                                destination.getTracks().length === 0 &&
                                stream
                            ) {
                                delete stream[source];
                            }
                        }

                        setRemoteStreams(
                            new Map(remoteStreamsRef.current),
                        );
                    },
                    { once: true },
                );

                setRemoteStreams(new Map(remoteStreamsRef.current));
            };

            peerConnection.onconnectionstatechange = () => {
                console.log(
                    `[WebRTC] ${targetUserId}:`,
                    peerConnection.connectionState,
                );

                setPeerStates(previous => ({
                    ...previous,
                    [targetUserId]: peerConnection.connectionState,
                }));

                if (
                    peerConnection.connectionState === "failed" ||
                    peerConnection.connectionState === "closed"
                ) {
                    if (
                        peerConnectionsRef.current.get(targetUserId) ===
                        peerConnection
                    ) {
                        peerConnectionsRef.current.delete(targetUserId);
                        pendingIceCandidatesRef.current.delete(targetUserId);
                        negotiationInProgressRef.current.delete(targetUserId);
                        remoteStreamsRef.current.delete(targetUserId);

                        setRemoteStreams(
                            new Map(remoteStreamsRef.current),
                        );
                    }
                }
            };

            peerConnectionsRef.current.set(
                targetUserId,
                peerConnection,
            );

            return peerConnection;
        },
        [
            createOfferRef,
            negotiationInProgressRef,
            peerConnectionsRef,
            pendingIceCandidatesRef,
            remoteStreamsRef,
            roomId,
            setPeerStates,
            setRemoteStreams,
            userId,
            websocketRef,
        ],
    );

    return {
        createPeerConnection,
        closePeer,
        flushPendingIceCandidates,
    };
}