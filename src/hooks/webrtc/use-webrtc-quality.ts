import { useCallback, useRef, useState } from "react";

import { STREAM_QUALITY_CONFIG } from "./webrtc.config";

import type { StreamQuality } from "./webrtc.types";

interface UseWebRTCQualityOptions {
    peerConnectionsRef: React.MutableRefObject<
        Map<string, RTCPeerConnection>
    >;

    cameraTrackRef: React.MutableRefObject<
        MediaStreamTrack | null
    >;

    screenStreamRef: React.MutableRefObject<
        MediaStream | null
    >;
}

export function useWebRTCQuality({
    peerConnectionsRef,
    cameraTrackRef,
    screenStreamRef,
}: UseWebRTCQualityOptions) {
    const [streamQuality, setStreamQualityState] =
        useState<StreamQuality>("auto");

    const streamQualityRef =
        useRef<StreamQuality>("auto");

    const applyQualityToTrack = useCallback(
        async (
            track: MediaStreamTrack | null,
            quality: StreamQuality
        ) => {
            if (!track || track.kind !== "video") {
                return;
            }

            if (quality === "auto") {
                console.log(
                    "[WebRTC] Qualidade automática ativada."
                );

                return;
            }

            const config = STREAM_QUALITY_CONFIG[quality];

            try {
                await track.applyConstraints({
                    width: {
                        ideal: config.width,
                        max: config.width,
                    },
                    height: {
                        ideal: config.height,
                        max: config.height,
                    },
                    frameRate: {
                        ideal: config.frameRate,
                        max: config.frameRate,
                    },
                });

                console.log(
                    "[WebRTC] Qualidade aplicada:",
                    quality,
                    `${config.width}x${config.height}`,
                    `${config.frameRate} FPS`
                );
            } catch (error) {
                console.warn(
                    "[WebRTC] Não foi possível aplicar completamente a resolução/FPS:",
                    error
                );
            }
        },
        []
    );

    const applyQualityToSenders = useCallback(
        async (quality: StreamQuality) => {
            for (
                const peerConnection of
                peerConnectionsRef.current.values()
            ) {
                const videoSenders = peerConnection
                    .getSenders()
                    .filter(
                        sender => sender.track?.kind === "video"
                    );

                for (const sender of videoSenders) {
                    try {
                        const parameters = sender.getParameters();

                        if (!parameters.encodings?.length) {
                            parameters.encodings = [{}];
                        }

                        for (
                            const encoding of parameters.encodings
                        ) {
                            if (quality === "auto") {
                                delete encoding.maxBitrate;
                                delete encoding.maxFramerate;
                                continue;
                            }

                            const config =
                                STREAM_QUALITY_CONFIG[quality];

                            encoding.maxBitrate = config.maxBitrate;
                            encoding.maxFramerate = config.frameRate;
                        }

                        await sender.setParameters(parameters);
                    } catch (error) {
                        console.warn(
                            "[WebRTC] Não foi possível aplicar o bitrate:",
                            error
                        );
                    }
                }
            }
        },
        [peerConnectionsRef]
    );

    const setStreamQuality = useCallback(
        async (quality: StreamQuality) => {
            streamQualityRef.current = quality;
            setStreamQualityState(quality);

            console.log(
                "[WebRTC] Alterando qualidade da transmissão para:",
                quality
            );

            const video =
                screenStreamRef.current?.getVideoTracks()[0] ??
                cameraTrackRef.current;

            if (!video) {
                console.log(
                    "[WebRTC] Qualidade salva. Será aplicada quando uma transmissão começar."
                );

                return;
            }

            await applyQualityToTrack(video, quality);
            await applyQualityToSenders(quality);
        },
        [
            applyQualityToSenders,
            applyQualityToTrack,
            cameraTrackRef,
            screenStreamRef,
        ]
    );

    return {
        streamQuality,
        streamQualityRef,
        applyQualityToTrack,
        applyQualityToSenders,
        setStreamQuality,
    };
}

