
import { useCallback } from "react";

import type { StreamQuality } from "./webrtc.types";

interface UseWebRTCCameraOptions {
    cameraTrackRef: React.MutableRefObject<MediaStreamTrack | null>;
    streamQualityRef: React.MutableRefObject<StreamQuality>;

    applyQualityToTrack: (
        track: MediaStreamTrack | null,
        quality: StreamQuality
    ) => Promise<void>;

    applyQualityToSenders: (
        quality: StreamQuality
    ) => Promise<void>;

    publishToPeers: () => Promise<void>;
    reportMediaError: (
        what: string,
        error: unknown
    ) => void;

    requireSecureContext: () => boolean;
    setIsCameraOn: (enabled: boolean) => void;
}

export function useWebRTCCamera({
    cameraTrackRef,
    streamQualityRef,
    applyQualityToTrack,
    applyQualityToSenders,
    publishToPeers,
    reportMediaError,
    requireSecureContext,
    setIsCameraOn
}: UseWebRTCCameraOptions) {
    const stopCamera = useCallback(() => {
        const track = cameraTrackRef.current;

        if (!track) {
            return;
        }

        track.onended = null;
        track.stop();

        cameraTrackRef.current = null;
        setIsCameraOn(false);

        void publishToPeers();
    }, [
        cameraTrackRef,
        publishToPeers,
        setIsCameraOn
    ]);

    const startCamera = useCallback(async () => {
        if (cameraTrackRef.current) {
            return;
        }

        if (!requireSecureContext()) {
            return;
        }

        try {
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });

            const track = stream.getVideoTracks()[0];

            if (!track) {
                return;
            }

            track.onended = () => {
                stopCamera();
            };

            cameraTrackRef.current = track;

            await applyQualityToTrack(
                track,
                streamQualityRef.current
            );

            setIsCameraOn(true);

            await publishToPeers();

            await applyQualityToSenders(
                streamQualityRef.current
            );
        } catch (error) {
            reportMediaError("a câmera", error);
        }
    }, [
        cameraTrackRef,
        streamQualityRef,
        applyQualityToSenders,
        applyQualityToTrack,
        publishToPeers,
        reportMediaError,
        requireSecureContext,
        setIsCameraOn,
        stopCamera
    ]);

    return {
        startCamera,
        stopCamera
    };
}