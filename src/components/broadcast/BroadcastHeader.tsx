import { useState } from "react";
import {
    Cast,
    ChevronDown,
    Copy,
    Link2,
    Mic,
    MonitorUp,
    Phone,
    Settings,
    Users,
    Video,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HeaderIconButton } from "./HeaderIconButton";
import type { Participant, RoomInfo } from "@/lib/types";

interface BroadcastHeaderProps {
    room: RoomInfo;
    participantCount: number;
    currentUser: Participant;
}

export function BroadcastHeader({ room, participantCount, currentUser }: BroadcastHeaderProps) {
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [sharingScreen, setSharingScreen] = useState(currentUser.isSharingScreen ?? false);

    return (
        <TooltipProvider delayDuration={200}>
            <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-5">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Cast className="size-5" />
                    </span>
                    <span className="text-lg font-semibold text-foreground">
                        Open Chat <span className="text-success">Broadcast</span>
                    </span>
                </div>

                <div className="h-8 w-px bg-border" />

                {/* Room name + live status */}
                <div className="flex items-center gap-3">
                    <span className="text-base font-medium text-foreground">{room.name}</span>
                    {room.isLive && (
                        <Badge variant="success" className="pl-2">
                            <span className="size-1.5 rounded-full bg-success" />
                            Ao vivo
                        </Badge>
                    )}
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="size-4" />
                        {participantCount}
                    </span>
                </div>

                {/* Invite link */}
                <div className="ml-2 hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground md:flex">
                    <Link2 className="size-4 shrink-0" />
                    <span className="truncate">{room.inviteUrl}</span>
                    <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(room.inviteUrl)}
                        className="ml-auto shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Copiar link da sala"
                    >
                        <Copy className="size-4" />
                    </button>
                </div>

                {/* Controls */}
                <div className="ml-auto flex items-center gap-2">
                    <HeaderIconButton label="Configurações">
                        <Settings className="size-4" />
                    </HeaderIconButton>
                    <HeaderIconButton
                        label={sharingScreen ? "Parar transmissão de tela" : "Transmitir tela"}
                        active={sharingScreen}
                        onClick={() => setSharingScreen((v) => !v)}
                    >
                        <MonitorUp className="size-4" />
                    </HeaderIconButton>
                    <HeaderIconButton
                        label={micOn ? "Silenciar microfone" : "Ativar microfone"}
                        active={micOn}
                        onClick={() => setMicOn((v) => !v)}
                    >
                        <Mic className="size-4" />
                    </HeaderIconButton>
                    <HeaderIconButton
                        label={camOn ? "Desligar câmera" : "Ligar câmera"}
                        active={camOn}
                        onClick={() => setCamOn((v) => !v)}
                    >
                        <Video className="size-4" />
                    </HeaderIconButton>
                    <HeaderIconButton label="Encerrar chamada" variant="danger">
                        <Phone className="size-4 rotate-[135deg]" />
                    </HeaderIconButton>
                </div>

                {/* Account menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 py-1.5 pl-1.5 pr-3 outline-none transition-colors hover:bg-secondary">
                        <Avatar className="size-7">
                            <AvatarFallback className={currentUser.avatarColor}>
                                {currentUser.name.slice(0, 1)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
                        <ChevronDown className="size-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Meu perfil</DropdownMenuItem>
                        <DropdownMenuItem>Preferências</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Sair da sala</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
        </TooltipProvider>
    );
}