import { ParticipantsPanel } from "./ParticipantsPanel"
import { RoomPanel } from "./RoomPanel"

import type { Participant, RoomInfo } from "@/lib/types"

interface RoomParticipantsSidebarProps {
participants: Participant[]
liveIds: string[]
room: RoomInfo
canManageParticipants?: boolean
onKickParticipant?: (participantId: string) => void
}

export function RoomParticipantsSidebar({
participants,
liveIds,
room,
canManageParticipants = false,
onKickParticipant,
}: RoomParticipantsSidebarProps) {
return ( <aside className="flex w-72 shrink-0 flex-col overflow-hidden border border-border bg-card"> <ParticipantsPanel
     participants={participants}
     liveIds={liveIds}
     canManageParticipants={canManageParticipants}
     onKickParticipant={onKickParticipant}
     canManageParticipants={canManageParticipants}
     onKickParticipant={onKickParticipant}
   > <RoomPanel room={room} /> </ParticipantsPanel> </aside>
)
}
