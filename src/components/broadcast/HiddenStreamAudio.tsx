
import { useState } from "react";

import { RemoteVideo } from "./RemoteVideo";
import { VolumeControl } from "./VolumeControl";

interface ScreenAudioSetting {
    volume: number;
    muted: boolean;
}

interface HiddenStreamAudioProps {
    remoteStreamEntries: [string, MediaStream][];
    screenAudioSettings: Record<string, ScreenAudioSetting>;
    volume: number;
    muted: boolean;
    onMicVolumeChange?: (volume: number) => void;
    onMicMutedChange?: (muted: boolean) => void;
}

type RemoteStreamWithAudio = MediaStream & {
    micAudioStream?: MediaStream;
    screenAudioStream?: MediaStream;
};

export function HiddenStreamAudio({
    remoteStreamEntries,
    screenAudioSettings,
    volume,
    muted,
    onMicVolumeChange,
    onMicMutedChange,
}: HiddenStreamAudioProps) {
    const [micVolume, setMicVolume] = useState(volume);
    const [micMuted, setMicMuted] = useState(muted);

    const audioSources = remoteStreamEntries.flatMap(
        ([userId, remoteStream]) => {
            const stream = remoteStream as RemoteStreamWithAudio;

            const micStream = stream.micAudioStream;
            const screenStream = stream.screenAudioStream;

            return [
                ...(micStream &&
                micStream.getAudioTracks().some(
                    (track) => track.readyState === "live",
                )
                    ? [
                          {
                              id: `${userId}:mic`,
                              stream: micStream,
                              source: "mic" as const,
                          },
                      ]
                    : []),

                ...(screenStream &&
                screenStream.getAudioTracks().some(
                    (track) => track.readyState === "live",
                )
                    ? [
                          {
                              id: `${userId}:screen`,
                              stream: screenStream,
                              source: "screen" as const,
                          },
                      ]
                    : []),
            ];
        },
    );

    if (audioSources.length === 0) {
        return null;
    }

    const hasMicAudio = audioSources.some(
        (source) => source.source === "mic",
    );

    return (
        <>
            {hasMicAudio && (
                <section
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-background/80 px-3 py-2"
                    aria-label="Controles dos microfones remotos"
                >
                    <span className="text-xs font-medium">
                        Microfones
                    </span>

                    <VolumeControl
                        volume={micVolume}
                        muted={micMuted}
                        onVolumeChange={(nextVolume) => {
                            setMicVolume(nextVolume);
                            onMicVolumeChange?.(nextVolume);
                        }}
                        onMutedChange={(nextMuted) => {
                            setMicMuted(nextMuted);
                            onMicMutedChange?.(nextMuted);
                        }}
                        label="Volume dos microfones remotos"
                    />
                </section>
            )}

            <div
                className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
                aria-hidden="true"
            >
                {audioSources.map(({ id, stream, source }) => {
                    const setting = screenAudioSettings[id];

                    return (
                        <RemoteVideo
                            key={id}
                            stream={stream}
                            volume={
                                source === "mic"
                                    ? micVolume
                                    : (setting?.volume ?? volume)
                            }
                            muted={
                                source === "mic"
                                    ? micMuted
                                    : (setting?.muted ?? muted)
                            }
                            audio
                            hideVideo
                        />
                    );
                })}
            </div>
        </>
    );
}