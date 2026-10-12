
import { useState, type RefObject } from "react";

import { PrimaryStreamView } from "./PrimaryStreamView";
import { StreamThumbnails } from "./StreamThumbnails";
import type { Participant } from "@/lib/types";
import { HiddenStreamAudio } from "./HiddenStreamAudio";
import type { StreamQuality } from "@/hooks/webrtc/webrtc.types";

export interface StreamEntry {
    id: string;
    stream: MediaStream;
    isLocal: boolean;
    ownerId?: string;
    source?: "screen" | "camera";
}

interface ScreenAudioSetting {
    volume: number;
    muted: boolean;
}

interface RoomStreamStageProps {
    fullscreenRef: RefObject<HTMLDivElement | null>;
    isFullscreen: boolean;
    onToggleFullscreen: () => void | Promise<void>;
    onSelectStream: (id: string) => void;

    primaryStream: MediaStream | null;
    primaryId: string | null;
    primaryStreamLabel: string;
    isPrimaryLocal: boolean;

    volume: number;
    muted: boolean;
    onVolumeChange: (volume: number) => void;
    onMutedChange: (muted: boolean) => void;

    streamQuality: StreamQuality;
    onStreamQualityChange: (quality: StreamQuality) => void;

    remoteStreamEntries: [string, MediaStream][];
    activeStreamEntries: StreamEntry[];
    participants: Participant[];

    currentUser: Participant;
    connected: boolean;
    peerDebugLabel: string;
    lastError: string | null | undefined;
}

export function RoomStreamStage({
    fullscreenRef,
    isFullscreen,
    onToggleFullscreen,
    onSelectStream,
    primaryStream,
    primaryId,
    primaryStreamLabel,
    isPrimaryLocal,
    volume,
    muted,
    onVolumeChange,
    onMutedChange,
    streamQuality,
    onStreamQualityChange,
    remoteStreamEntries,
    activeStreamEntries,
    participants,
}: RoomStreamStageProps) {
    const [screenAudioSettings, setScreenAudioSettings] =
        useState<Record<string, ScreenAudioSetting>>({});

    const selectedEntry =
        activeStreamEntries.find((entry) => entry.id === primaryId) ??
        null;

    const activeSetting =
        primaryId !== null
            ? screenAudioSettings[primaryId]
            : undefined;

    const activeVolume = activeSetting?.volume ?? volume;
    const activeMuted = activeSetting?.muted ?? muted;

    const handleVolumeChange = (nextVolume: number) => {
        if (primaryId === null || selectedEntry?.source !== "screen" || selectedEntry.isLocal) {
            onVolumeChange(nextVolume);
            return;
        }

        const normalizedVolume = Math.max(0, Math.min(1, nextVolume));

        setScreenAudioSettings((previous) => ({
            ...previous,
            [primaryId]: {
                volume: normalizedVolume,
                muted: previous[primaryId]?.muted ?? muted,
            },
        }));
    };

    const handleMutedChange = (nextMuted: boolean) => {
        if (primaryId === null || selectedEntry?.source !== "screen" || selectedEntry.isLocal) {
            onMutedChange(nextMuted);
            return;
        }

        setScreenAudioSettings((previous) => ({
            ...previous,
            [primaryId]: {
                volume: previous[primaryId]?.volume ?? volume,
                muted: nextMuted,
            },
        }));
    };

    const handleScreenVolumeChange = (
        id: string,
        nextVolume: number,
    ) => {
        setScreenAudioSettings((previous) => ({
            ...previous,
            [id]: {
                volume: Math.max(0, Math.min(1, nextVolume)),
                muted: previous[id]?.muted ?? muted,
            },
        }));
    };

    const handleScreenMutedChange = (
        id: string,
        nextMuted: boolean,
    ) => {
        setScreenAudioSettings((previous) => ({
            ...previous,
            [id]: {
                volume: previous[id]?.volume ?? volume,
                muted: nextMuted,
            },
        }));
    };

    return (
        <div className="relative flex h-full min-h-0 flex-col gap-4">
            <PrimaryStreamView
                fullscreenRef={fullscreenRef}
                isFullscreen={isFullscreen}
                onToggleFullscreen={onToggleFullscreen}
                primaryStream={primaryStream}
                primaryStreamLabel={primaryStreamLabel}
                isPrimaryLocal={isPrimaryLocal}
                volume={activeVolume}
                muted={activeMuted}
                onVolumeChange={handleVolumeChange}
                onMutedChange={handleMutedChange}
                streamQuality={streamQuality}
                onStreamQualityChange={onStreamQualityChange}
            />

            <HiddenStreamAudio
                remoteStreamEntries={remoteStreamEntries}
                screenAudioSettings={screenAudioSettings}
                volume={volume}
                muted={muted}
                onMicVolumeChange={onVolumeChange}
                onMicMutedChange={onMutedChange}
            />

            <StreamThumbnails
                activeStreamEntries={activeStreamEntries}
                participants={participants}
                primaryId={primaryId}
                onSelectStream={onSelectStream}
                screenAudioSettings={screenAudioSettings}
                defaultVolume={volume}
                defaultMuted={muted}
                onScreenVolumeChange={handleScreenVolumeChange}
                onScreenMutedChange={handleScreenMutedChange}
            />
        </div>
    );
}