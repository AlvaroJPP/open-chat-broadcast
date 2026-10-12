import {useCallback} from "react"

import {getUserId, normalizeTargetId} from "./webrtc.utils"

import type {MediaState, ParticipantPayload, WebRTCSignal} from "./webrtc.types"

import type {WebSocketMessage} from "../../lib/websocket"

type MutableRef<T> = {
  current: T
}

type UseWebRTCEventsOptions = {
  userId: string
  roomId: string

  peerConnectionsRef: MutableRef<Map<string, RTCPeerConnection>>
  sharingUsersRef: MutableRef<Set<string>>

  createOffer: (targetUserId: string) => Promise<void>
  closePeer: (targetUserId: string) => void

  handleOffer: (data: WebRTCSignal) => Promise<void>
  handleAnswer: (data: WebRTCSignal) => Promise<void>
  handleIceCandidate: (data: WebRTCSignal) => Promise<void>

  sendMediaState: () => void

  setLastError: (error: string | null) => void

  setSharingUsers: React.Dispatch<React.SetStateAction<string[]>>

  setMediaStates: React.Dispatch<React.SetStateAction<Record<string, MediaState>>>
}

export function useWebRTCEvents({
  userId,
  roomId,
  peerConnectionsRef,
  sharingUsersRef,
  createOffer,
  closePeer,
  handleOffer,
  handleAnswer,
  handleIceCandidate,
  sendMediaState,
  setLastError,
  setSharingUsers,
  setMediaStates,
}: UseWebRTCEventsOptions) {
  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      const data = message.data as Partial<WebRTCSignal> & {
        participants?: ParticipantPayload[]
        message?: string
        camera?: boolean
        screen?: boolean
        mic?: boolean
      }

      switch (message.event) {
        case "room:error":
        case "webrtc:error":
        case "screen:error": {
          console.error(`[WS] ${message.event}:`, message.data)

          setLastError(`${message.event}: ${data.message ?? "erro"}`)
          break
        }

        case "webrtc:offer":
          void handleOffer(data as WebRTCSignal)
          break

        case "webrtc:answer":
          void handleAnswer(data as WebRTCSignal)
          break

        case "webrtc:ice:candidate":
          void handleIceCandidate(data as WebRTCSignal)
          break

        case "room:participants": {
          const participants = Array.isArray(data.participants) ? data.participants : []

          for (const participant of participants) {
            const targetUserId = normalizeTargetId(participant.user) ?? participant.id ?? null

            if (
              !targetUserId ||
              targetUserId === userId ||
              participant.online !== true ||
              userId >= targetUserId ||
              peerConnectionsRef.current.has(targetUserId)
            ) {
              continue
            }

            void createOffer(targetUserId)
          }

          sendMediaState()
          break
        }

        case "participant:join": {
          const targetUserId = normalizeTargetId(data.user)

          if (!targetUserId || targetUserId === userId) {
            break
          }

          sendMediaState()

          if (userId < targetUserId) {
            const existing = peerConnectionsRef.current.get(targetUserId)

            if (existing && existing.signalingState === "have-local-offer") {
              closePeer(targetUserId)
            }

            void createOffer(targetUserId)
          }

          break
        }

        case "participant:leave": {
          const targetUserId = normalizeTargetId(data.user)

          if (!targetUserId || targetUserId === userId) {
            break
          }

          closePeer(targetUserId)
          sharingUsersRef.current.delete(targetUserId)

          setSharingUsers(Array.from(sharingUsersRef.current))

          setMediaStates(previous => {
            const next = {...previous}
            delete next[targetUserId]
            return next
          })

          break
        }

        case "media:state": {
          const remoteUserId = getUserId(data.user)

          if (!remoteUserId || remoteUserId === userId) {
            break
          }

          setMediaStates(previous => ({
            ...previous,
            [remoteUserId]: {
              camera: Boolean(data.camera),
              screen: Boolean(data.screen),
              mic: Boolean(data.mic),
            },
          }))

          break
        }

        case "screen:start": {
          const remoteUserId = getUserId(data.user)

          if (!remoteUserId || remoteUserId === userId) {
            break
          }

          sharingUsersRef.current.add(remoteUserId)
          setSharingUsers(Array.from(sharingUsersRef.current))

          break
        }

        case "screen:stop": {
          const remoteUserId = getUserId(data.user)

          if (!remoteUserId) {
            break
          }

          sharingUsersRef.current.delete(remoteUserId)
          setSharingUsers(Array.from(sharingUsersRef.current))

          break
        }
      }
    },
    [
      closePeer,
      createOffer,
      handleAnswer,
      handleIceCandidate,
      handleOffer,
      peerConnectionsRef,
      roomId,
      sendMediaState,
      setLastError,
      setMediaStates,
      setSharingUsers,
      sharingUsersRef,
      userId,
    ],
  )

  return {handleMessage}
}
