import { useState } from "react";

const VOLUME_STORAGE_KEY = "broadcast.volume";

function readStoredVolume(): number {
    try {
        const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
        const value = raw === null ? Number.NaN : Number(raw);

        return Number.isFinite(value)
            ? Math.min(1, Math.max(0, value))
            : 1;
    } catch {
        return 1;
    }
}

export function useRoomVolume() {
    const [volume, setVolume] = useState<number>(() =>
        readStoredVolume(),
    );

    const [muted, setMuted] = useState(false);

    const handleVolumeChange = (nextVolume: number) => {
        const normalizedVolume = Math.min(
            1,
            Math.max(0, nextVolume),
        );

        setVolume(normalizedVolume);

        try {
            localStorage.setItem(
                VOLUME_STORAGE_KEY,
                String(normalizedVolume),
            );
        } catch {
            // O armazenamento pode estar indisponível.
        }
    };

    return {
        volume,
        muted,
        setMuted,
        handleVolumeChange,
    };
}
