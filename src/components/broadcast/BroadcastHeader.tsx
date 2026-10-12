import { Cast, ChevronDown, Copy, Link2, Menu } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Participant, RoomInfo } from "@/lib/types";

interface BroadcastHeaderProps {
    room: RoomInfo;
    participantCount: number;
    currentUser: Participant;
    onLeave: () => void;
    /** Abre o menu lateral de participantes (celular). */
    onOpenParticipants?: () => void;
}

export function BroadcastHeader({
    room,
    participantCount,
    currentUser,
    onLeave,
    onOpenParticipants,
}: BroadcastHeaderProps) {
    return (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-2 sm:h-[60px] sm:gap-4 sm:px-5">
            {/* Menu de participantes (só no celular) */}
            <button
                type="button"
                onClick={onOpenParticipants}
                aria-label="Participantes"
                className="relative flex size-11 shrink-0 items-center justify-center md:hidden"
            >
                <Menu className="size-5" />
                <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center bg-destructive px-1 text-[10px] font-bold text-white">
                    {participantCount}
                </span>
            </button>

            {/* Logo e nome do app (desktop) */}
            <div className="hidden items-center gap-2.5 md:flex">
                <span className="flex size-8 items-center justify-center border border-foreground">
                    <Cast className="size-[18px]" />
                </span>
                <span className="text-base font-bold">
                    Open Chat <span className="text-primary">Broadcast</span>
                </span>
            </div>

            <div className="hidden h-6 w-px bg-border md:block" />

            {/* Sala */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5 md:flex-none">
                <div className="min-w-0">
                    <p className="truncate text-base font-bold leading-tight">{room.name}</p>
                    <p className="text-[11px] leading-tight text-muted-foreground md:hidden">
                        Open Chat <span className="text-primary">Broadcast</span>
                    </p>
                </div>

                {room.isLive && (
                    <span
                        role="img"
                        aria-label="Ao vivo"
                        title="Ao vivo"
                        className="size-2.5 shrink-0 rounded-full bg-destructive"
                    />
                )}
            </div>

            {/* Link da sala (desktop) */}
            <div className="ml-auto hidden h-10 min-w-0 max-w-sm flex-1 items-center gap-2 border border-border bg-card px-3 text-sm text-muted-foreground md:flex">
                <Link2 className="size-4 shrink-0" />
                <span className="truncate text-xs">{room.inviteUrl}</span>
                <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(room.inviteUrl)}
                    className="ml-auto shrink-0 transition-colors hover:text-foreground"
                    aria-label="Copiar link da sala"
                >
                    <Copy className="size-4" />
                </button>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger className="flex h-10 items-center gap-2 border border-border px-2 outline-none transition-colors hover:bg-secondary sm:px-3">
                    <Avatar className="size-6">
                        <AvatarFallback className={currentUser.avatarColor}>
                            {currentUser.name.slice(0, 1)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-semibold sm:inline">{currentUser.name}</span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Meu perfil</DropdownMenuItem>
                    <DropdownMenuItem>Preferências</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onSelect={onLeave}>
                        Sair da sala
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
