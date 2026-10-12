import { useCallback } from "react";

import type { StreamQuality } from "./webrtc.types";
import type { BroadcastWebSocket } from "../../lib/websocket";

interface UseWebRTCScreenOptions {
    userId: string;
    roomId: string;

    screenStreamRef: React.MutableRefObject<MediaStream | null>;
    websocketRef: React.MutableRefObject<BroadcastWebSocket | null>;
    streamQualityRef: React.MutableRefObject<StreamQuality>;

    applyQualityToTrack: (
        track: MediaStreamTrack | null,
        quality: StreamQuality
    ) => Promise<void>;

    applyQualityToSenders: (
        quality: StreamQuality
    ) => Promise<void>;

    setAudioSource: (
        source: "mic" | "screen",
        track: MediaStreamTrack | null
    ) => void;

    publishToPeers: () => Promise<void>;
    reportMediaError: (
        what: string,
        error: unknown
    ) => void;

    requireSecureContext: () => boolean;
    setIsScreenSharing: (enabled: boolean) => void;
}

export function useWebRTCScreen({
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
}: UseWebRTCScreenOptions) {
    const stopScreenShare = useCallback(() => {
        const stream = screenStreamRef.current;

        if (!stream) {
            return;
        }

        stream.getTracks().forEach((track) => {
            track.onended = null;
            track.stop();
        });

        screenStreamRef.current = null;

        setAudioSource("screen", null);
        setIsScreenSharing(false);

        void publishToPeers();

        websocketRef.current?.send("screen:stop", {
            user: userId,
            room: roomId,
        });

        console.log("[WebRTC] Compartilhamento de tela encerrado.");
    }, [
        publishToPeers,
        roomId,
        screenStreamRef,
        setAudioSource,
        setIsScreenSharing,
        userId,
        websocketRef,
    ]);

    const startScreenShare = useCallback(async () => {
        if (!userId || !roomId) {
            console.warn(
                "[WebRTC] Impossível compartilhar sem usuário ou sala."
            );

            return;
        }

        if (screenStreamRef.current) {
            return;
        }

        if (
            !requireSecureContext() ||
            !navigator.mediaDevices?.getDisplayMedia
        ) {
            return;
        }

        try {
            const stream =
                await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                });

            const video = stream.getVideoTracks()[0];

            if (!video) {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });

                return;
            }

            video.onended = () => {
                stopScreenShare();
            };

            screenStreamRef.current = stream;

            await applyQualityToTrack(
                video,
                streamQualityRef.current
            );

            setAudioSource(
                "screen",
                stream.getAudioTracks()[0] ?? null
            );

            setIsScreenSharing(true);

            await publishToPeers();

            await applyQualityToSenders(
                streamQualityRef.current
            );

            websocketRef.current?.send("screen:start", {
                user: userId,
                room: roomId,
            });

            console.log(
                "[WebRTC] Compartilhamento de tela iniciado.",
                stream.getAudioTracks().length > 0
                    ? "(com áudio)"
                    : "(sem áudio: marque 'Compartilhar áudio' na janela do navegador)"
            );
        } catch (error) {
            reportMediaError(
                "o compartilhamento de tela",
                error
            );
        }
    }, [
        applyQualityToSenders,
        applyQualityToTrack,
        publishToPeers,
        reportMediaError,
        requireSecureContext,
        roomId,
        screenStreamRef,
        setAudioSource,
        setIsScreenSharing,
        stopScreenShare,
        streamQualityRef,
        userId,
        websocketRef,
    ]);

    return {
        startScreenShare,
        stopScreenShare,
    };
}
