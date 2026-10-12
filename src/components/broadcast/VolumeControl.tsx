import { Volume1, Volume2, VolumeX } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VolumeControlProps {
    /** 0 a 1 */
    volume: number;
    muted: boolean;
    onVolumeChange: (volume: number) => void;
    onMutedChange: (muted: boolean) => void;
    className?: string;
    sliderClassName?: string;
    label?: string;
}

export function VolumeControl({
    volume,
    muted,
    onVolumeChange,
    onMutedChange,
    className,
    sliderClassName,
    label = "Volume"
}: VolumeControlProps) {
    const silent = muted || volume === 0;
    const Icon = silent ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <button
                type="button"
                onClick={() => {
                    // Se estava mudo por volume 0, devolve um volume audível.
                    if (silent && volume === 0) {
                        onVolumeChange(0.5);
                    }

                    onMutedChange(!silent);
                }}
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label={silent ? `Ativar som (${label})` : `Silenciar (${label})`}
                title={silent ? "Ativar som" : "Silenciar"}
            >
                <Icon className="size-4" />
            </button>

            <Slider
                value={[silent ? 0 : Math.round(volume * 100)]}
                min={0}
                max={100}
                step={1}
                aria-label={label}
                className={cn("w-24", sliderClassName)}
                onValueChange={([next]) => {
                    const value = (next ?? 0) / 100;

                    onVolumeChange(value);
                    onMutedChange(value === 0);
                }}
            />
        </div>
    );
}
