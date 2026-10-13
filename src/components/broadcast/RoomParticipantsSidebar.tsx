import { ParticipantsPanel } from "./ParticipantsPanel"
import { RoomPanel } from "./RoomPanel"

import type { Participant, RoomInfo } from "@/lib/types"

interface RoomParticipantsSidebarProps {
participants: Participant[]
liveIds: string[]
room: RoomInfo
canManageParticipants?: boolean
onKickParticipant?: (participantId: string) => void
onTransferOwnership?: (participantId: string) => void
onToggleMuteParticipant?: (participantId: string, muted: boolean) => void
}

export function RoomParticipantsSidebar({
participants,
liveIds,
room,
canManageParticipants = false,
onKickParticipant,
onTransferOwnership,
onToggleMuteParticipant,
}: RoomParticipantsSidebarProps) {
return ( <aside className="flex w-72 shrink-0 flex-col overflow-hidden border border-border bg-card"> <ParticipantsPanel
     participants={participants}
     liveIds={liveIds}
     canManageParticipants={canManageParticipants}
     onKickParticipant={onKickParticipant}
     onTransferOwnership={onTransferOwnership}
     onToggleMuteParticipant={onToggleMuteParticipant}
   > <RoomPanel room={room} /> </ParticipantsPanel> </aside>
)
}
