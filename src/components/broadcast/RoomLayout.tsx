import {useState} from "react"

import {BroadcastHeader} from "./BroadcastHeader"
import {BroadcastControls} from "./BroadcastControls"
import {RoomStreamStage} from "./RoomStreamStage"
import {RoomParticipantsDrawer} from "./RoomParticipantsDrawer"
import {StreamView} from "./StreamView"
import {RoomChatSection} from "./RoomChatSection"
import {RoomParticipantsSidebar} from "./RoomParticipantsSidebar"


import {useIsMobile} from "@/hooks/use-mobile"
import {useRoomMedia} from "@/hooks/room/useRoomMedia"
import {useRoomVolume} from "@/hooks/room/useRoomVolume"
import {useRoomFullscreen} from "@/hooks/room/useRoomFullscreen"
import {useRoomStreams} from "@/hooks/room/useRoomStreams"
import {useLeaveRoom} from "@/hooks/room/useLeaveRoom"
import {useRoomKeyboardShortcuts} from "@/hooks/room/useRoomKeyboardShortcuts"
import {useRoomControls} from "@/hooks/room/useRoomControls"
import type { StreamQuality } from "@/hooks/webrtc/webrtc.types"

import type {ChatMessageData, Participant, RoomInfo} from "@/lib/types"

interface RoomLayoutProps {
room: RoomInfo
participants: Participant[]
messages: ChatMessageData[]
}

export function RoomLayout({room, participants, messages}: RoomLayoutProps) {
const fallbackCurrentUser: Participant = {
id: "unknown",
name: "Participante",
isYou: false,
status: "assistindo",
avatarColor: "bg-primary",
micMuted: false,
isSharingScreen: false,
}

const currentUser =
participants.find(participant => participant.isYou) ??
participants[0] ??
fallbackCurrentUser

const isMobile = useIsMobile()

const [menuOpen, setMenuOpen] = useState(false)
const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null)

const {volume, muted, setMuted, handleVolumeChange} = useRoomVolume()

const {fullscreenRef, isFullscreen, handleToggleFullscreen} =
useRoomFullscreen()

useRoomKeyboardShortcuts({
enabled: menuOpen,
onEscape: () => setMenuOpen(false),
})

const {
connected,
localStream,
remoteStreams,
isScreenSharing,
isCameraOn,
isMicOn,
sharingUsers,
mediaStates,
peerStates,
lastError,
streamQuality,
setStreamQuality,
startCamera,
stopCamera,
startMic,
stopMic,
startScreenShare,
stopScreenShare,
stopAllMedia,
} = useRoomMedia({
userId: currentUser.id,
roomId: room.id,
})

const {
handleToggleScreen,
handleToggleCamera,
handleToggleMic,
} = useRoomControls({
isScreenSharing,
isCameraOn,
isMicOn,
startScreenShare,
stopScreenShare,
startCamera,
stopCamera,
startMic,
stopMic,
})

const handleStreamQualityChange = (nextQuality: StreamQuality) => {
void setStreamQuality(nextQuality)
}

const {handleLeave} = useLeaveRoom({
roomId: room.id,
userId: currentUser.id,
stopAllMedia,
})

const {
remoteStreamEntries,
activeStreamEntries,
primaryId,
primaryStream,
isPrimaryLocal,
primaryStreamLabel,
presenter,
liveIds,
} = useRoomStreams({
localStream,
remoteStreams,
isScreenSharing,
isCameraOn,
sharingUsers,
mediaStates,
participants,
currentUser,
selectedStreamId,
})

const mainClassName = isMobile
    ? "flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain p-2.5 pb-6"
    : "flex min-h-0 min-w-0 flex-1 gap-3 overflow-hidden p-3";

const streamClassName = isMobile
    ? "order-1 w-full min-w-0 shrink-0"
    : "min-w-0";

const peerDebugLabel =
Object.keys(peerStates).length === 0
? "nenhum"
: Object.entries(peerStates)
.map(([id, state]) => `${id.slice(-4)}=${state}`)
.join(", ")

return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
<BroadcastHeader
room={room}
participantCount={participants.length}
currentUser={currentUser}
onLeave={handleLeave}
onOpenParticipants={() => setMenuOpen(true)}
/>

  <main className={mainClassName}>
    {!isMobile && (
      <RoomParticipantsSidebar
        participants={participants}
        liveIds={liveIds}
        room={room}
      />
    )}

    <StreamView
      presenter={presenter}
      isLive={room.isLive}
      onShareScreen={startScreenShare}
      onStopShareScreen={stopScreenShare}
      isScreenSharing={isScreenSharing}
      className={streamClassName}
    >
      <RoomStreamStage
        fullscreenRef={fullscreenRef}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onSelectStream={setSelectedStreamId}
        primaryStream={primaryStream}
        primaryId={primaryId}
        primaryStreamLabel={primaryStreamLabel}
        isPrimaryLocal={isPrimaryLocal}
        volume={volume}
        muted={muted}
        onVolumeChange={handleVolumeChange}
        onMutedChange={setMuted}
        streamQuality={streamQuality}
        onStreamQualityChange={handleStreamQualityChange}
        remoteStreamEntries={remoteStreamEntries}
        activeStreamEntries={activeStreamEntries}
        participants={participants}
        currentUser={currentUser}
        connected={connected}
        peerDebugLabel={peerDebugLabel}
        lastError={lastError}
      />
    </StreamView>

    <RoomChatSection
      messages={messages}
      currentUser={currentUser}
      roomId={room.id}
      isMobile={isMobile}
    />
  </main>

  <BroadcastControls
    isScreenSharing={isScreenSharing}
    isCameraOn={isCameraOn}
    isMicOn={isMicOn}
    onToggleScreen={handleToggleScreen}
    onToggleCamera={handleToggleCamera}
    onToggleMic={handleToggleMic}
    onLeave={handleLeave}
  />

  {isMobile && menuOpen && (
    <RoomParticipantsDrawer
      room={room}
      participants={participants}
      liveIds={liveIds}
      onClose={() => setMenuOpen(false)}
    />
  )}
</div>

)
}
