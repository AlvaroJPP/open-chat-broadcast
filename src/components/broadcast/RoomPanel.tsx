import { useState } from "react";
import { Check, Copy, Link2, Plus } from "lucide-react";

import type { RoomInfo } from "@/lib/types";

interface RoomPanelProps {
    room: RoomInfo;
    onInvite?: () => void;
}

export function RoomPanel({ room, onInvite }: RoomPanelProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(room.inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard unavailable — ignore silently
        }
    }

    return (
        <section className="mt-6 flex flex-col gap-2.5 border border-border bg-card p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Código da sala
            </span>

            <button
                type="button"
                onClick={handleCopy}
                aria-label="Copiar código da sala"
                className="flex h-11 items-center gap-2 border border-border bg-background px-3 text-left"
            >
                <Link2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{room.inviteUrl}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copiado" : "Copiar"}
                </span>
            </button>

            <button
                type="button"
                onClick={onInvite ?? handleCopy}
                className="flex h-12 items-center justify-center gap-2 bg-primary text-sm font-bold text-primary-foreground hover:opacity-90"
            >
                <Plus className="size-5" />
                {copied ? "Código copiado" : "Convidar pessoas"}
            </button>
        </section>
    );
}
