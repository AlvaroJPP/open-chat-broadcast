import { ParticipantsPanel } from "./ParticipantsPanel";
import { RoomPanel } from "./RoomPanel";

import type { Participant, RoomInfo } from "@/lib/types";

interface RoomParticipantsDrawerProps {
    room: RoomInfo;
    participants: Participant[];
    liveIds: string[];
    onClose: () => void;
    canManageParticipants?: boolean;
    onKickParticipant?: (participantId: string) => void;
    onTransferOwnership?: (participantId: string) => void;
    onToggleMuteParticipant?: (participantId: string, muted: boolean) => void;
}

export function RoomParticipantsDrawer({
    room,
    participants,
    liveIds,
    onClose,
    canManageParticipants = false,
    onKickParticipant,
    onTransferOwnership,
    onToggleMuteParticipant,
}: RoomParticipantsDrawerProps) {
    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/65"
                onClick={onClose}
                aria-hidden="true"
            />

            <nav
                aria-label="Participantes na sala"
                className="fixed inset-y-0 left-0 z-50 flex w-[304px] max-w-[84%] flex-col border-r border-border bg-background"
            >
                <ParticipantsPanel
                    participants={participants}
                    liveIds={liveIds}
                    onClose={onClose}
                    canManageParticipants={canManageParticipants}
                    onKickParticipant={onKickParticipant}
                    onTransferOwnership={onTransferOwnership}
                    onToggleMuteParticipant={onToggleMuteParticipant}
                >
                    <RoomPanel room={room} />
                </ParticipantsPanel>
            </nav>
        </>
    );
}