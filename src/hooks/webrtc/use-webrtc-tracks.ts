
import { useCallback } from "react";

import type { StreamQuality } from "./webrtc.types";

type MutableRef<T> = {
    current: T;
};

type PreviewStream = MediaStream & {
    screenStream?: MediaStream;
    cameraStream?: MediaStream;
};

interface UseWebRTCTracksOptions {
    peerConnectionsRef: MutableRef<Map<string, RTCPeerConnection>>;
    cameraTrackRef: MutableRef<MediaStreamTrack | null>;
    screenStreamRef: MutableRef<MediaStream | null>;
    streamQualityRef: MutableRef<StreamQuality>;
    getOutboundMicAudio: () => MediaStreamTrack | null;
    getOutboundScreenAudio: () => MediaStreamTrack | null;
    applyQualityToSenders: (quality: StreamQuality) => Promise<void>;
    sendMediaState: () => void;
    setLocalStream: (stream: MediaStream | null) => void;
}

async function logAudioSendStats(
    peerConnection: RTCPeerConnection,
    label: string,
    audioTrack: MediaStreamTrack | null,
) {
    console.log(`[Diagnóstico de áudio] ${label}:`, {
        existe: Boolean(audioTrack),
        id: audioTrack?.id ?? null,
        estado: audioTrack?.readyState ?? "sem faixa",
        habilitada: audioTrack?.enabled ?? false,
        conexao: peerConnection.connectionState,
        ice: peerConnection.iceConnectionState,
    });

    if (!audioTrack) return;

    try {
        const beforeStats = await peerConnection.getStats();

        const before = [...beforeStats.values()].filter(
            report =>
                report.type === "outbound-rtp" &&
                (report.kind === "audio" || report.mediaType === "audio"),
        );

        console.log(`[Diagnóstico de áudio] ${label} — envio inicial:`, before);

        window.setTimeout(() => {
            void (async () => {
                try {
                    const afterStats = await peerConnection.getStats();

                    const after = [...afterStats.values()].filter(
                        report =>
                            report.type === "outbound-rtp" &&
                            (report.kind === "audio" || report.mediaType === "audio"),
                    );

                    console.log(
                        `[Diagnóstico de áudio] ${label} — envio após 2 segundos:`,
                        after.map(current => {
                            const previous = before.find(
                                report => report.ssrc === current.ssrc,
                            );

                            return {
                                ssrc: current.ssrc ?? null,
                                bytesEnviados: current.bytesSent ?? 0,
                                diferencaBytes:
                                    (current.bytesSent ?? 0) -
                                    (previous?.bytesSent ?? 0),
                                pacotesEnviados: current.packetsSent ?? 0,
                                diferencaPacotes:
                                    (current.packetsSent ?? 0) -
                                    (previous?.packetsSent ?? 0),
                            };
                        }),
                    );
                } catch (error) {
                    console.warn(
                        `[Diagnóstico de áudio] Falha ao consultar ${label}:`,
                        error,
                    );
                }
            })();
        }, 2000);
    } catch (error) {
        console.warn(
            `[Diagnóstico de áudio] Falha ao iniciar diagnóstico de ${label}:`,
            error,
        );
    }
}

export function useWebRTCTracks({
    peerConnectionsRef,
    cameraTrackRef,
    screenStreamRef,
    streamQualityRef,
    getOutboundMicAudio,
    getOutboundScreenAudio,
    applyQualityToSenders,
    sendMediaState,
    setLocalStream,
}: UseWebRTCTracksOptions) {
    const getOutboundScreen = useCallback(
        (): MediaStreamTrack | null =>
            screenStreamRef.current?.getVideoTracks()[0] ?? null,
        [screenStreamRef],
    );

    const getOutboundCamera = useCallback(
        (): MediaStreamTrack | null => cameraTrackRef.current,
        [cameraTrackRef],
    );

    const getOutboundVideo = useCallback(
        (): MediaStreamTrack | null =>
            getOutboundScreen() ?? getOutboundCamera(),
        [getOutboundCamera, getOutboundScreen],
    );

    const refreshPreview = useCallback(() => {
        const screen = getOutboundScreen();
        const camera = getOutboundCamera();
        const screenAudio = getOutboundScreenAudio();

        const tracks: MediaStreamTrack[] = [];

        if (screen) tracks.push(screen);
        if (camera) tracks.push(camera);
        if (screenAudio) tracks.push(screenAudio);

        if (tracks.length === 0) {
            setLocalStream(null);
            return;
        }

        const preview = new MediaStream(tracks) as PreviewStream;

        if (screen) {
            preview.screenStream = new MediaStream([
                screen,
                ...(screenAudio ? [screenAudio] : []),
            ]);
        }

        if (camera) {
            preview.cameraStream = new MediaStream([camera]);
        }

        setLocalStream(preview);
    }, [
        getOutboundCamera,
        getOutboundScreen,
        getOutboundScreenAudio,
        setLocalStream,
    ]);

    const syncPeerTracks = useCallback(
        async (peerConnection: RTCPeerConnection) => {
            const screen = getOutboundScreen();
            const camera = getOutboundCamera();
            const micAudio = getOutboundMicAudio();
            const screenAudio = getOutboundScreenAudio();

            // Mantém a ordem dos transceivers de vídeo:
            // 0 = tela; 1 = câmera.
            const videoTransceivers = peerConnection
                .getTransceivers()
                .filter(
                    transceiver =>
                        transceiver.receiver.track.kind === "video" &&
                        transceiver.direction !== "stopped",
                );

            while (videoTransceivers.length < 2) {
                videoTransceivers.push(
                    peerConnection.addTransceiver("video", {
                        direction: "recvonly",
                    }),
                );
            }

            const videoTracks: Array<MediaStreamTrack | null> = [
                screen,
                camera,
            ];

            for (let index = 0; index < 2; index++) {
                const transceiver = videoTransceivers[index];
                const track = videoTracks[index] ?? null;

                if (!transceiver) continue;

                if (transceiver.sender.track !== track) {
                    await transceiver.sender.replaceTrack(track);
                }

                const direction: RTCRtpTransceiverDirection = track
                    ? "sendrecv"
                    : "recvonly";

                if (transceiver.direction !== direction) {
                    transceiver.direction = direction;
                }
            }

            // Mantém dois transceivers de áudio:
            // 0 = microfone; 1 = áudio compartilhado da tela.
            // Não reutilize uma única faixa para as duas fontes.
            const audioTransceivers = peerConnection
                .getTransceivers()
                .filter(
                    transceiver =>
                        transceiver.receiver.track.kind === "audio" &&
                        transceiver.direction !== "stopped",
                );

            while (audioTransceivers.length < 2) {
                audioTransceivers.push(
                    peerConnection.addTransceiver("audio", {
                        direction: "recvonly",
                    }),
                );
            }

            const audioTracks: Array<MediaStreamTrack | null> = [
                micAudio,
                screenAudio,
            ];

            for (let index = 0; index < 2; index++) {
                const transceiver = audioTransceivers[index];
                const track = audioTracks[index] ?? null;

                if (!transceiver) continue;

                if (transceiver.sender.track !== track) {
                    await transceiver.sender.replaceTrack(track);
                }

                const direction: RTCRtpTransceiverDirection = track
                    ? "sendrecv"
                    : "recvonly";

                if (transceiver.direction !== direction) {
                    transceiver.direction = direction;
                }
            }

            await applyQualityToSenders(streamQualityRef.current);

            void logAudioSendStats(
                peerConnection,
                "Microfone",
                audioTransceivers[0]?.sender.track ?? null,
            );

            void logAudioSendStats(
                peerConnection,
                "Áudio da tela",
                audioTransceivers[1]?.sender.track ?? null,
            );
        },
        [
            applyQualityToSenders,
            getOutboundMicAudio,
            getOutboundScreenAudio,
            getOutboundCamera,
            getOutboundScreen,
            streamQualityRef,
        ],
    );

    const publishToPeers = useCallback(async () => {
        for (const peerConnection of peerConnectionsRef.current.values()) {
            try {
                await syncPeerTracks(peerConnection);
            } catch (error) {
                console.warn(
                    "[WebRTC] Falha ao atualizar faixas:",
                    error,
                );
            }
        }

        refreshPreview();
        sendMediaState();
    }, [
        peerConnectionsRef,
        refreshPreview,
        sendMediaState,
        syncPeerTracks,
    ]);

    return {
        getOutboundVideo,
        refreshPreview,
        syncPeerTracks,
        publishToPeers,
    };
}