import { ParticipantsPanel } from "./ParticipantsPanel"
import { RoomPanel } from "./RoomPanel"

import type { Participant, RoomInfo } from "@/lib/types"

interface RoomParticipantsSidebarProps {
participants: Participant[]
liveIds: string[]
room: RoomInfo
}

export function RoomParticipantsSidebar({
participants,
liveIds,
room,
}: RoomParticipantsSidebarProps) {
return ( <aside className="flex w-72 shrink-0 flex-col overflow-hidden border border-border bg-card"> <ParticipantsPanel
     participants={participants}
     liveIds={liveIds}
   > <RoomPanel room={room} /> </ParticipantsPanel> </aside>
)
}
