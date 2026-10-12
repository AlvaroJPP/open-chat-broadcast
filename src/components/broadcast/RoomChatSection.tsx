import { ChatPanel } from "./ChatPanel"

import type { ChatMessageData, Participant } from "@/lib/types"

interface RoomChatSectionProps {
messages: ChatMessageData[]
currentUser: Participant
roomId: string
isMobile: boolean
}

export function RoomChatSection({
messages,
currentUser,
roomId,
isMobile,
}: RoomChatSectionProps) {
const chat = ( <ChatPanel
   messages={messages}
   currentUser={currentUser}
   roomId={roomId}
   userId={currentUser.id}
 />
)

if (isMobile) {
return ( <div className="order-2 flex min-h-[240px] w-full flex-1 flex-col">
{chat} </div>
)
}

return chat
}
