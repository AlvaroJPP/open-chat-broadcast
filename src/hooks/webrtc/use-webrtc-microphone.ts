
import { useCallback } from "react";

import type { StreamQuality } from "./webrtc.types";

interface UseWebRTCMicrophoneOptions {
    micTrackRef: React.MutableRefObject<MediaStreamTrack | null>;

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

    setIsMicOn: (enabled: boolean) => void;
}

export function useWebRTCMicrophone({
    micTrackRef,
    setAudioSource,
    publishToPeers,
    reportMediaError,
    requireSecureContext,
    setIsMicOn
}: UseWebRTCMicrophoneOptions) {
    const stopMic = useCallback(() => {
        const track = micTrackRef.current;

        if (!track) {
            return;
        }

        track.onended = null;
        track.stop();

        micTrackRef.current = null;

        setAudioSource("mic", null);

        setIsMicOn(false);

        void publishToPeers();
    }, [
        micTrackRef,
        publishToPeers,
        setAudioSource,
        setIsMicOn
    ]);

    const startMic = useCallback(async () => {
        if (micTrackRef.current) {
            return;
        }

        if (!requireSecureContext()) {
            return;
        }

        try {
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

            const track = stream.getAudioTracks()[0];

            if (!track) {
                return;
            }

            track.onended = () => {
                stopMic();
            };

            micTrackRef.current = track;

            setAudioSource("mic", track);

            setIsMicOn(true);

            await publishToPeers();
        } catch (error) {
            reportMediaError("o microfone", error);
        }
    }, [
        micTrackRef,
        publishToPeers,
        reportMediaError,
        requireSecureContext,
        setAudioSource,
        setIsMicOn,
        stopMic
    ]);

    return {
        startMic,
        stopMic
    };
}