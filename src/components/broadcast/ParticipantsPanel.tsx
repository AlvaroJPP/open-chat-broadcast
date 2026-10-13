import type { ReactNode } from "react";
import { X } from "lucide-react";

import { ParticipantItem } from "./ParticipantItem";
import type { Participant } from "@/lib/types";

interface ParticipantsPanelProps {
    participants: Participant[];
    /** IDs de quem está transmitindo a tela agora. */
    liveIds?: string[];
    /** Mostra o botão de fechar (menu lateral no celular). */
    onClose?: () => void;
    /** Conteúdo extra no fim da lista (ex.: link da sala). */
    children?: ReactNode;
    canManageParticipants?: boolean;
    onKickParticipant?: (participantId: string) => void;
    onTransferOwnership?: (participantId: string) => void;
    onToggleMuteParticipant?: (participantId: string, muted: boolean) => void;
}

export function ParticipantsPanel({
    participants,
    liveIds = [],
    onClose,
    children,
    canManageParticipants = false,
    onKickParticipant,
    onTransferOwnership,
    onToggleMuteParticipant,
}: ParticipantsPanelProps) {
    const isLive = (p: Participant) =>
        liveIds.includes(p.id) || !!p.isSharingScreen || p.status === "transmitindo";

    const broadcasting = participants.filter(isLive);
    const watching = participants.filter((p) => !isLive(p));

    return (
        <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start justify-between border-b border-border py-4 pl-4 pr-2">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Participantes
                    </p>
                    <h2 className="mt-0.5 text-xl font-bold">
                        Na sala · <span className="text-red-400">{participants.length}</span>
                    </h2>
                </div>

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar lista de participantes"
                        className="flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                        <X className="size-5" />
                    </button>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="px-4 pb-4 pt-3.5">
                    {broadcasting.length > 0 && (
                        <>
                            <p className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                <span>Transmitindo</span>
                                <span>{broadcasting.length}</span>
                            </p>
                            {broadcasting.map((participant) => (
                                <ParticipantItem key={participant.id} participant={participant} live canKick={canManageParticipants} onKick={onKickParticipant} canManage={canManageParticipants} onTransferOwnership={onTransferOwnership} onToggleMute={onToggleMuteParticipant} />
                            ))}
                        </>
                    )}

                    {watching.length > 0 && (
                        <>
                            <p
                                className={`mb-1 flex justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground ${
                                    broadcasting.length > 0 ? "mt-6" : ""
                                }`}
                            >
                                <span>Assistindo</span>
                                <span>{watching.length}</span>
                            </p>
                            {watching.map((participant) => (
                                <ParticipantItem key={participant.id} participant={participant} canKick={canManageParticipants} onKick={onKickParticipant} canManage={canManageParticipants} onTransferOwnership={onTransferOwnership} onToggleMute={onToggleMuteParticipant} />
                            ))}
                        </>
                    )}

                    {children}
                </div>
            </div>
        </section>
    );
}
