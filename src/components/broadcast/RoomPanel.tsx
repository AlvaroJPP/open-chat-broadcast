import { useState } from "react";
import { Check, Copy, Link2, Settings2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable — ignore silently
        }
    }

    return (
        <section className="flex flex-col rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
                <Settings2 className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Sala</h2>
                <Link2 className="ml-auto size-4 text-muted-foreground" />
            </div>

            <div className="flex flex-col gap-2 p-4">
                <span className="text-sm font-medium text-foreground">Link da sala</span>

                <div className="flex items-center gap-2 rounded-lg border border-input bg-secondary/40 px-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{room.inviteUrl}</span>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Copiar link da sala"
                    >
                        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                    </button>
                </div>

                <Button variant="success" size="lg" className="mt-1 w-full" onClick={onInvite}>
                    <UserPlus className="size-4" />
                    Convidar pessoas
                </Button>
            </div>
        </section>
    );
}