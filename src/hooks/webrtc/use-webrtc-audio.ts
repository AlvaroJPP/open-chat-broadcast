
import { useCallback, useRef } from "react";

type AudioSlot = "mic" | "screen";

export function useWebRTCAudio() {
    const micTrackRef = useRef<MediaStreamTrack | null>(null);
    const screenAudioTrackRef = useRef<MediaStreamTrack | null>(null);

    const setAudioSource = useCallback(
        (slot: AudioSlot, track: MediaStreamTrack | null) => {
            const sourceRef =
                slot === "mic"
                    ? micTrackRef
                    : screenAudioTrackRef;

            sourceRef.current =
                track && track.readyState !== "ended"
                    ? track
                    : null;

            console.log("[WebRTC Audio] Fonte atualizada:", {
                tipo: slot,
                trackId: sourceRef.current?.id ?? null,
                estado: sourceRef.current?.readyState ?? "sem faixa",
            });
        },
        [],
    );

    const getOutboundMicAudio = useCallback(
        (): MediaStreamTrack | null => {
            const track = micTrackRef.current;

            return track?.readyState === "live"
                ? track
                : null;
        },
        [],
    );

    const getOutboundScreenAudio = useCallback(
        (): MediaStreamTrack | null => {
            const track = screenAudioTrackRef.current;

            return track?.readyState === "live"
                ? track
                : null;
        },
        [],
    );

    const cleanupAudio = useCallback(() => {
        // Não encerra as faixas aqui: elas pertencem aos hooks
        // responsáveis por iniciar e parar o microfone e a tela.
        micTrackRef.current = null;
        screenAudioTrackRef.current = null;
    }, []);

    return {
        micSourceRef: micTrackRef,
        screenAudioSourceRef: screenAudioTrackRef,
        setAudioSource,
        getOutboundMicAudio,
        getOutboundScreenAudio,
        cleanupAudio,
    };
}