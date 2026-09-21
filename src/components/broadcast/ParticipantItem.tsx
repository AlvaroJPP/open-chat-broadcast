import { MicOff, MonitorUp, MoreVertical } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
}

export function ParticipantItem({ participant }: ParticipantItemProps) {
    return (
        <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/50">
            <Avatar className="size-10">
                <AvatarFallback className={participant.avatarColor}>
                    {participant.name.slice(0, 1)}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{participant.name}</span>
                    {participant.isYou && (
                        <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                            Você
                        </Badge>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">{statusLabel[participant.status]}</span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                {participant.isSharingScreen && (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-success/15 text-success">
                        <MonitorUp className="size-3.5" />
                    </span>
                )}
                {participant.micMuted && (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <MicOff className="size-3.5" />
                    </span>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="flex size-7 items-center justify-center rounded-lg outline-none transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label={`Mais opções de ${participant.name}`}
                    >
                        <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        {!participant.isYou && <DropdownMenuItem>Silenciar</DropdownMenuItem>}
                        {!participant.isYou && (
                            <DropdownMenuItem className="text-destructive">Remover da sala</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}