import type { ReactNode } from "react";
import { Maximize2, MonitorUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Participant } from "@/lib/types";

interface StreamViewProps {
    presenter: Participant;
    isLive: boolean;
    onExpand?: () => void;
    children: ReactNode;
}

export function StreamView({ presenter, isLive, onExpand, children }: StreamViewProps) {
    return (
        <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                {isLive && (
                    <Badge variant="live" className="gap-1.5 pl-2">
                        <span className="size-1.5 rounded-full bg-destructive-foreground" />
                        AO VIVO
                    </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{presenter.name}</span> está transmitindo sua tela
                </span>
                <button
                    type="button"
                    onClick={onExpand}
                    className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label="Expandir transmissão"
                >
                    <Maximize2 className="size-4" />
                </button>
            </div>

            <div className="min-h-0 flex-1 p-4">{children}</div>

            <div className="border-t border-border px-4 py-3">
                <span className="inline-flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground">
                    <MonitorUp className="size-4 text-muted-foreground" />
                    Tela de {presenter.name}
                </span>
            </div>
        </section>
    );
}