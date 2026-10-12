import { RemoteVideo } from "./RemoteVideo";
import { VolumeControl } from "./VolumeControl";

import type { Participant } from "@/lib/types";
import type { StreamEntry } from "./RoomStreamStage";

interface ScreenAudioSetting {
    volume: number;
    muted: boolean;
}

interface StreamThumbnailsProps {
    activeStreamEntries: StreamEntry[];
    participants: Participant[];
    primaryId: string | null;
    onSelectStream: (id: string) => void;
    screenAudioSettings: Record<string, ScreenAudioSetting>;
    defaultVolume: number;
    defaultMuted: boolean;
    onScreenVolumeChange: (id: string, volume: number) => void;
    onScreenMutedChange: (id: string, muted: boolean) => void;
}

export function StreamThumbnails({
    activeStreamEntries,
    participants,
    primaryId,
    onSelectStream,
    screenAudioSettings,
    defaultVolume,
    defaultMuted,
    onScreenVolumeChange,
    onScreenMutedChange,
}: StreamThumbnailsProps) {
    // Não mostrar nas miniaturas a transmissão que já está
    // sendo exibida na área principal.
    const thumbnailEntries = activeStreamEntries.filter(
        ({ id }) => id !== primaryId,
    );

    if (thumbnailEntries.length === 0) {
        return null;
    }

    return (
        <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {thumbnailEntries.map(
                ({ id, stream, isLocal, ownerId, source }) => {
                    const participantId = ownerId ?? id;

                    const participantName = isLocal
                        ? "Você"
                        : participants.find(
                              (participant) =>
                                  participant.id === participantId,
                          )?.name ?? "Participante";

                    const sourceLabel =
                        source === "camera"
                            ? "Câmera"
                            : source === "screen"
                              ? "Tela"
                              : "Transmissão";

                    const label = `${participantName} — ${sourceLabel}`;
                    const setting = screenAudioSettings[id];

                    const hasIndependentScreenAudio =
                        source === "screen" && !isLocal;

                    return (
                        <div
                            key={id}
                            className="min-w-0 space-y-2"
                            data-stream-id={id}
                        >
                            <button
                                type="button"
                                onClick={() => onSelectStream(id)}
                                className="group relative block aspect-video w-full overflow-hidden border border-border bg-black text-left hover:border-primary/60"
                                aria-label={`Exibir ${label} como transmissão principal`}
                                title={`Ver ${label}`}
                            >
                                <RemoteVideo
                                    stream={stream}
                                    audio={false}
                                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                />

                                <span className="absolute bottom-1 left-1 right-1 flex items-center gap-1.5 bg-black/70 px-1.5 py-1 text-[10px] font-semibold text-white">
                                    <span className="size-[7px] shrink-0 bg-destructive" />
                                    <span className="min-w-0 truncate">
                                        {label}
                                    </span>
                                </span>
                            </button>

                            {hasIndependentScreenAudio && (
                                <div
                                    className="flex min-w-0 flex-wrap items-center justify-between gap-2 border border-border px-2 py-2"
                                    aria-label={`Controle de áudio de ${label}`}
                                >
                                    <span className="text-xs font-medium">
                                        Áudio da tela
                                    </span>

                                    <VolumeControl
                                        volume={
                                            setting?.volume ?? defaultVolume
                                        }
                                        muted={
                                            setting?.muted ?? defaultMuted
                                        }
                                        onVolumeChange={(nextVolume) =>
                                            onScreenVolumeChange(
                                                id,
                                                nextVolume,
                                            )
                                        }
                                        onMutedChange={(nextMuted) =>
                                            onScreenMutedChange(
                                                id,
                                                nextMuted,
                                            )
                                        }
                                        label={`Volume de ${label}`}
                                    />
                                </div>
                            )}
                        </div>
                    );
                },
            )}
        </div>
    );
}