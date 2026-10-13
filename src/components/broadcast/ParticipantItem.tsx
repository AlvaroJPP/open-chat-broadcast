import { Crown, MicOff, MoreVertical } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Participant } from "@/lib/types";

const statusLabel: Record<Participant["status"], string> = {
    transmitindo: "Transmitindo",
    assistindo: "Assistindo",
    ausente: "Ausente",
};

interface ParticipantItemProps {
    participant: Participant;
    /** Está transmitindo a tela agora. */
    live?: boolean;
    canKick?: boolean;
    onKick?: (participantId: string) => void;
}

export function ParticipantItem({ participant, live = false, canKick = false, onKick }: ParticipantItemProps) {
    return (
        <div className="flex h-[60px] items-center gap-3 border-b border-border">
            <div className="relative shrink-0">
                <Avatar className="size-10">
                    <AvatarFallback className="bg-muted text-sm font-bold text-foreground">
                        {participant.name.slice(0, 1).toLowerCase()}
                    </AvatarFallback>
                </Avatar>
                <span
                    className={`absolute -bottom-0.5 -right-0.5 size-2.5 border-2 border-background ${
                        live ? "bg-primary" : "bg-muted-foreground"
                    }`}
                />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{participant.name}</span>
                    {participant.isHost && (
                        <Crown
                            aria-label="Anfitrião"
                            className="size-4 shrink-0 fill-[#f5b301] text-[#f5b301]"
                        />
                    )}
                    {participant.isYou && (
                        <span className="text-[11px] font-semibold text-primary">VOCÊ</span>
                    )}
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {participant.isHost && <span>Anfitrião</span>}
                    {live ? (
                        <span className="bg-destructive px-1.5 py-px text-[9px] font-bold tracking-wide text-white">
                            AO VIVO
                        </span>
                    ) : (
                        !participant.isHost && <span>{statusLabel[participant.status]}</span>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
                {participant.micMuted && <MicOff className="size-4" />}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="flex size-8 items-center justify-center outline-none transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label={`Mais opções de ${participant.name}`}
                    >
                        <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        {!participant.isYou && <DropdownMenuItem>Silenciar</DropdownMenuItem>}
                        {canKick && !participant.isYou && (
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => onKick?.(participant.id)}
                            >
                                Remover da sala
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
