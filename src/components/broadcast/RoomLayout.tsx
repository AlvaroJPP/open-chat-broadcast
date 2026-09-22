import { BroadcastHeader } from "./BroadcastHeader";
import { ChatPanel } from "./ChatPanel";
import { CodeEditorPreview } from "./CodeEditorPreview";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { RoomPanel } from "./RoomPanel";
import { StreamView } from "./StreamView";
import type { ChatMessageData, Participant, RoomInfo } from "@/lib/types";
import { useWebRTC } from "@/hooks/use-webrtc";

interface RoomLayoutProps {
    room: RoomInfo;
    participants: Participant[];
    messages: ChatMessageData[];
}

export function RoomLayout({
    room,
    participants,
    messages
}: RoomLayoutProps) {
    const currentUser =
    participants.find((p) => p.isYou) ??
    participants[0];

if (!currentUser) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <p className="text-muted-foreground">
                Nenhum participante encontrado.
            </p>
        </div>
    );
}

const presenter =
    participants.find((p) => p.isSharingScreen) ??
    currentUser;

    const {
        connected,
        localStream,
        remoteStreams,
        createOffer
    } = useWebRTC({
        userId: currentUser.id,
        roomId: room.id
    });

    return (
        <div className="flex h-screen flex-col bg-background">
            <BroadcastHeader
                room={room}
                participantCount={participants.length}
                currentUser={currentUser}
            />

            <main className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
                <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
                    <ParticipantsPanel
                        participants={participants}
                    />

                    <RoomPanel room={room} />
                </aside>

                <StreamView
                    presenter={presenter}
                    isLive={room.isLive}
                >
                    <div className="relative flex h-full min-h-0 flex-col gap-4">
                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black">
                            {Array.from(
                                remoteStreams.entries()
                            ).map(
                                ([userId, stream]) => (
                                    <video
                                        key={userId}
                                        ref={(element) => {
                                            if (element) {
                                                element.srcObject =
                                                    stream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        className="h-full w-full object-contain"
                                    />
                                )
                            )}

                            {remoteStreams.size === 0 && (
                                <CodeEditorPreview />
                            )}
                        </div>

                        {localStream && (
                            <video
                                ref={(element) => {
                                    if (element) {
                                        element.srcObject =
                                            localStream;
                                    }
                                }}
                                autoPlay
                                muted
                                playsInline
                                className="absolute bottom-4 right-4 z-10 h-32 w-48 rounded-xl border border-border bg-black object-cover shadow-lg"
                            />
                        )}

                        {!connected && (
                            <div className="absolute left-4 top-4 rounded-lg bg-black/70 px-3 py-2 text-xs text-white">
                                Conectando ao servidor...
                            </div>
                        )}
                    </div>
                </StreamView>

                <ChatPanel
                    messages={messages}
                    currentUser={currentUser}
                />
            </main>
        </div>
    );
}