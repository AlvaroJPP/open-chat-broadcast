import { BroadcastHeader } from "./BroadcastHeader";
import { ChatPanel } from "./ChatPanel";
import { CodeEditorPreview } from "./CodeEditorPreview";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { RoomPanel } from "./RoomPanel";
import { StreamView } from "./StreamView";
import type { ChatMessageData, Participant, RoomInfo } from "@/lib/types";

interface RoomLayoutProps {
    room: RoomInfo;
    participants: Participant[];
    messages: ChatMessageData[];
}

export function RoomLayout({ room, participants, messages }: RoomLayoutProps) {
    const currentUser = participants.find((p) => p.isYou) ?? participants[0];
    const presenter = participants.find((p) => p.isSharingScreen) ?? currentUser;

    return (
        <div className="flex h-screen flex-col bg-background">
            <BroadcastHeader room={room} participantCount={participants.length} currentUser={currentUser} />

            <main className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
                <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
                    <ParticipantsPanel participants={participants} />
                    <RoomPanel room={room} />
                </aside>

                <StreamView presenter={presenter} isLive={room.isLive}>
                    <CodeEditorPreview />
                </StreamView>

                <ChatPanel messages={messages} currentUser={currentUser} />
            </main>
        </div>
    );
}