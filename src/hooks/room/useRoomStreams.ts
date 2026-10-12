import {useMemo} from "react"

import type {Participant} from "@/lib/types"
import type {StreamEntry} from "@/components/broadcast/RoomStreamStage"

interface UseRoomStreamsProps {
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  isScreenSharing: boolean
  isCameraOn: boolean
  sharingUsers: string[]
  mediaStates: Record<
    string,
    {
      screen?: boolean
      camera?: boolean
    }
  >
  participants: Participant[]
  currentUser: Participant
  selectedStreamId: string | null
}

interface ExtendedStreamEntry extends StreamEntry {
  ownerId: string
  source: "screen" | "camera"
}

type StreamWithSources = MediaStream & {
  screenStream?: MediaStream
  cameraStream?: MediaStream
}

export function useRoomStreams({
  localStream,
  remoteStreams,
  isScreenSharing,
  isCameraOn,
  sharingUsers,
  mediaStates,
  participants,
  currentUser,
  selectedStreamId,
}: UseRoomStreamsProps) {
  const remoteStreamEntries = useMemo(() => Array.from(remoteStreams.entries()), [remoteStreams])

  const activeRemoteStreamEntries = useMemo(
    () =>
      remoteStreamEntries.filter(([userId]) =>
        Boolean(
          mediaStates[userId]?.screen ||
          mediaStates[userId]?.camera ||
          sharingUsers.includes(userId),
        ),
      ),
    [remoteStreamEntries, mediaStates, sharingUsers],
  )

  const activeStreamEntries = useMemo<ExtendedStreamEntry[]>(() => {
    const entries: ExtendedStreamEntry[] = []

    // As propriedades locais da câmera e da tela ainda não são
    // expostas separadamente pelo hook useWebRTC. Por enquanto,
    // a prévia local permanece como uma única entrada.
    if (localStream && (isScreenSharing || isCameraOn)) {
      const local = localStream as StreamWithSources

      if (isScreenSharing) {
        const screenStream =
          local.screenStream ?? new MediaStream(localStream.getVideoTracks().slice(0, 1))

        if (screenStream.getVideoTracks().length > 0) {
          entries.push({
            id: `${currentUser.id}:screen`,
            ownerId: currentUser.id,
            source: "screen",
            stream: screenStream,
            isLocal: true,
          })
        }
      }

      if (isCameraOn && local.cameraStream) {
        entries.push({
          id: `${currentUser.id}:camera`,
          ownerId: currentUser.id,
          source: "camera",
          stream: local.cameraStream,
          isLocal: true,
        })
      } else if (isCameraOn && !isScreenSharing) {
        entries.push({
          id: `${currentUser.id}:camera`,
          ownerId: currentUser.id,
          source: "camera",
          stream: localStream,
          isLocal: true,
        })
      }
    }

    for (const [userId, stream] of activeRemoteStreamEntries) {
      const streamWithSources = stream as StreamWithSources
      const state = mediaStates[userId]

      const screenStream = streamWithSources.screenStream ?? (state?.screen ? stream : undefined)

      const cameraStream =
        streamWithSources.cameraStream ?? (state?.camera && !state?.screen ? stream : undefined)

      if (state?.screen && screenStream) {
        entries.push({
          id: `${userId}:screen`,
          ownerId: userId,
          source: "screen",
          stream: screenStream,
          isLocal: false,
        })
      }

      if (state?.camera && cameraStream) {
        entries.push({
          id: `${userId}:camera`,
          ownerId: userId,
          source: "camera",
          stream: cameraStream,
          isLocal: false,
        })
      }

      // Compatibilidade temporária com transmissões antigas,
      // que enviavam apenas uma faixa de vídeo por participante.
      if (!state?.screen && !state?.camera && sharingUsers.includes(userId)) {
        entries.push({
          id: `${userId}:screen`,
          ownerId: userId,
          source: "screen",
          stream,
          isLocal: false,
        })
      }
    }

    return entries
  }, [
    localStream,
    isScreenSharing,
    isCameraOn,
    currentUser.id,
    activeRemoteStreamEntries,
    mediaStates,
    sharingUsers,
  ])

  const selectedStreamIsActive =
    selectedStreamId !== null && activeStreamEntries.some(entry => entry.id === selectedStreamId)

  const defaultScreenId =
    activeStreamEntries.find(
      entry =>
        entry.source === "screen" &&
        (entry.isLocal
          ? isScreenSharing
          : mediaStates[entry.ownerId]?.screen || sharingUsers.includes(entry.ownerId)),
    )?.id ?? null

  const primaryId =
    (selectedStreamIsActive ? selectedStreamId : null) ??
    defaultScreenId ??
    activeStreamEntries[0]?.id ??
    null

  const primaryEntry = activeStreamEntries.find(entry => entry.id === primaryId) ?? null

  const presenter =
    participants.find(participant => participant.id === primaryEntry?.ownerId) ??
    participants.find(participant => participant.isSharingScreen) ??
    currentUser

  const liveIds = [
    ...new Set([
      ...sharingUsers,
      ...Object.entries(mediaStates)
        .filter(([, state]) => state?.screen)
        .map(([userId]) => userId),
      ...(isScreenSharing ? [currentUser.id] : []),
    ]),
  ]

  const sourceLabel = primaryEntry?.source === "camera" ? "Câmera" : "Tela"

  return {
    remoteStreamEntries,
    activeRemoteStreamEntries,
    activeStreamEntries,
    primaryId,
    primaryStream: primaryEntry?.stream ?? null,
    isPrimaryLocal: primaryEntry?.isLocal === true,
    primaryStreamLabel: primaryEntry
      ? primaryEntry.isLocal
        ? `Sua ${sourceLabel.toLowerCase()}`
        : `${presenter.name} — ${sourceLabel.toLowerCase()}`
      : "Aguardando transmissão",
    presenter,
    liveIds,
  }
}
