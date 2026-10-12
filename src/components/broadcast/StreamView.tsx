import type { ReactNode } from "react";

import type { Participant } from "@/lib/types";

interface StreamViewProps {
    presenter: Participant;
    isLive: boolean;
    onExpand?: () => void;
    onShareScreen?: () => void;
    onStopShareScreen?: () => void;
    isScreenSharing?: boolean;
    className?: string;
    children: ReactNode;
}

/**
 * Área da transmissão principal. Os botões de transmitir ficam
 * na barra inferior da sala (BroadcastControls).
 */
export function StreamView({
    presenter,
    isLive,
    className = "",
    children,
}: StreamViewProps) {
    return (
        <section className={`flex min-w-0 flex-1 flex-col border border-border bg-card ${className}`}>
            <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
                {isLive && (
                    <span className="bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
                        AO VIVO
                    </span>
                )}

                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    <span className="font-bold text-foreground">{presenter.name}</span>{" "}
                    <span className="hidden sm:inline">está transmitindo sua tela</span>
                </span>
            </div>

            <div className="min-h-0 flex-1 px-3 pb-3">{children}</div>
        </section>
    );
}
