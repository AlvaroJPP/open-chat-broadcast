import { useState } from "react";
import { Users, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParticipantItem } from "./ParticipantItem";
import type { Participant } from "@/lib/types";

interface ParticipantsPanelProps {
    participants: Participant[];
}

export function ParticipantsPanel({ participants }: ParticipantsPanelProps) {
    const [open, setOpen] = useState(true);

    if (!open) return null;

    return (
        <section className="flex flex-col rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
                <Users className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Participantes</h2>
                <Badge className="px-1.5 py-0 text-[10px]">{participants.length}</Badge>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Fechar painel de participantes"
                >
                    <X className="size-4" />
                </button>
            </div>

            <ScrollArea className="max-h-72">
                <div className="flex flex-col gap-0.5 p-2">
                    {participants.map((participant) => (
                        <ParticipantItem key={participant.id} participant={participant} />
                    ))}
                </div>
            </ScrollArea>
        </section>
    );
}