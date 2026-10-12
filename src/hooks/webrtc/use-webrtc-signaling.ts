import { useCallback, useRef } from "react"

import type { BroadcastWebSocket } from "../../lib/websocket"
import { getUserId } from "./webrtc.utils"
import type { WebRTCSignal } from "./webrtc.types"

type MutableRef<T> = {
  current: T
}

type UseWebRTCSignalingOptions = {
  userId: string
  roomId: string
  pendingIceCandidatesRef: MutableRef<Map<string, RTCIceCandidateInit[]>>
  websocketRef: MutableRef<BroadcastWebSocket | null>
  peerConnectionsRef: MutableRef<Map<string, RTCPeerConnection>>
  negotiationInProgressRef: MutableRef<Set<string>>
  createOfferRef: MutableRef<((target: string) => Promise<void>) | null>
  createPeerConnection: (
    targetUserId: string,
  ) => RTCPeerConnection | null
  flushPendingIceCandidates: (
    targetUserId: string,
    peerConnection: RTCPeerConnection,
  ) => Promise<void>
  syncPeerTracks: (
    peerConnection: RTCPeerConnection,
  ) => Promise<void>
}

export function useWebRTCSignaling({
  userId,
  roomId,
  pendingIceCandidatesRef,
  websocketRef,
  peerConnectionsRef,
  negotiationInProgressRef,
  createOfferRef,
  createPeerConnection,
  flushPendingIceCandidates,
  syncPeerTracks,
}: UseWebRTCSignalingOptions) {
  // Guarda pedidos de renegociação que chegam enquanto outra negociação ocorre.
  const pendingNegotiationRef = useRef(new Set<string>())

  const retryPendingOffer = useCallback(
    (targetUserId: string) => {
      const peerConnection =
        peerConnectionsRef.current.get(targetUserId)

      if (!pendingNegotiationRef.current.has(targetUserId)) {
        return
      }

      if (!peerConnection || peerConnection.signalingState !== "stable") {
        return
      }

      if (negotiationInProgressRef.current.has(targetUserId)) {
        return
      }

      pendingNegotiationRef.current.delete(targetUserId)

      queueMicrotask(() => {
        void createOfferRef.current?.(targetUserId)
      })
    },
    [createOfferRef, negotiationInProgressRef, peerConnectionsRef],
  )

  // ------------------------------------------------------------
  // Criar e enviar oferta
  // ------------------------------------------------------------

  const createOffer = useCallback(
    async (targetUserId: string) => {
      if (!userId || !roomId || !targetUserId) {
        return
      }

      if (targetUserId === userId) {
        console.warn(
          "[WebRTC] Ignorando oferta para o próprio usuário.",
        )
        return
      }

      if (negotiationInProgressRef.current.has(targetUserId)) {
        pendingNegotiationRef.current.add(targetUserId)
        return
      }

      const existingConnection =
        peerConnectionsRef.current.get(targetUserId)

      if (
        existingConnection &&
        existingConnection.signalingState !== "stable"
      ) {
        pendingNegotiationRef.current.add(targetUserId)
        return
      }

      negotiationInProgressRef.current.add(targetUserId)
      pendingNegotiationRef.current.delete(targetUserId)

      try {
        const peerConnection =
          createPeerConnection(targetUserId)

        if (!peerConnection) {
          return
        }

        if (peerConnection.signalingState !== "stable") {
          pendingNegotiationRef.current.add(targetUserId)
          return
        }

        await syncPeerTracks(peerConnection)

        // A conexão pode ter mudado de estado durante a sincronização.
        if (peerConnection.signalingState !== "stable") {
          pendingNegotiationRef.current.add(targetUserId)
          return
        }

        const offer = await peerConnection.createOffer()

        await peerConnection.setLocalDescription(offer)

        websocketRef.current?.send("webrtc:offer", {
          user: userId,
          room: roomId,
          target: targetUserId,
          sdp: offer,
        })
      } catch (error) {
        console.error(
          `[WebRTC] Falha ao criar oferta para ${targetUserId}:`,
          error,
        )
      } finally {
        negotiationInProgressRef.current.delete(targetUserId)
        retryPendingOffer(targetUserId)
      }
    },
    [
      createPeerConnection,
      negotiationInProgressRef,
      peerConnectionsRef,
      retryPendingOffer,
      roomId,
      syncPeerTracks,
      userId,
      websocketRef,
    ],
  )

  // Permite que onnegotiationneeded invoque a oferta atual.
  createOfferRef.current = createOffer

  // ------------------------------------------------------------
  // Receber oferta e responder
  // ------------------------------------------------------------

  const handleOffer = useCallback(
    async (data: WebRTCSignal) => {
      const remoteUserId = getUserId(data.user)

      if (!userId || !roomId || !remoteUserId || !data.sdp) {
        return
      }

      if (remoteUserId === userId) {
        console.warn(
          "[WebRTC] Ignorando oferta recebida do próprio usuário.",
        )
        return
      }

      const polite = userId > remoteUserId

      if (
        negotiationInProgressRef.current.has(remoteUserId) &&
        !polite
      ) {
        return
      }

      negotiationInProgressRef.current.add(remoteUserId)

      try {
        const peerConnection =
          createPeerConnection(remoteUserId)

        if (!peerConnection) {
          return
        }

        if (peerConnection.signalingState !== "stable") {
          if (!polite) {
            return
          }

          await peerConnection.setLocalDescription({
            type: "rollback",
          })
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.sdp),
        )

        await syncPeerTracks(peerConnection)

        await flushPendingIceCandidates(
          remoteUserId,
          peerConnection,
        )

        const answer = await peerConnection.createAnswer()

        await peerConnection.setLocalDescription(answer)

        websocketRef.current?.send("webrtc:answer", {
          user: userId,
          room: roomId,
          target: remoteUserId,
          sdp: answer,
        })
      } catch (error) {
        console.error(
          `[WebRTC] Falha ao responder oferta de ${remoteUserId}:`,
          error,
        )
      } finally {
        negotiationInProgressRef.current.delete(remoteUserId)
        retryPendingOffer(remoteUserId)
      }
    },
    [
      createPeerConnection,
      flushPendingIceCandidates,
      negotiationInProgressRef,
      retryPendingOffer,
      roomId,
      syncPeerTracks,
      userId,
      websocketRef,
    ],
  )

  // ------------------------------------------------------------
  // Receber resposta
  // ------------------------------------------------------------

  const handleAnswer = useCallback(
    async (data: WebRTCSignal) => {
      const remoteUserId = getUserId(data.user)

      if (!remoteUserId || remoteUserId === userId) {
        return
      }

      const peerConnection =
        peerConnectionsRef.current.get(remoteUserId)

      if (!peerConnection || !data.sdp) {
        return
      }

      if (peerConnection.signalingState !== "have-local-offer") {
        return
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.sdp),
        )

        await flushPendingIceCandidates(
          remoteUserId,
          peerConnection,
        )
      } catch (error) {
        console.error(
          `[WebRTC] Falha ao processar resposta de ${remoteUserId}:`,
          error,
        )
      } finally {
        retryPendingOffer(remoteUserId)
      }
    },
    [
      flushPendingIceCandidates,
      peerConnectionsRef,
      retryPendingOffer,
      userId,
    ],
  )

  // ------------------------------------------------------------
  // Receber candidato ICE
  // ------------------------------------------------------------

  const handleIceCandidate = useCallback(
    async (data: WebRTCSignal) => {
      const remoteUserId = getUserId(data.user)

      if (
        !data.candidate ||
        !remoteUserId ||
        remoteUserId === userId
      ) {
        return
      }

      const peerConnection =
        peerConnectionsRef.current.get(remoteUserId)

      if (!peerConnection || !peerConnection.remoteDescription) {
        const queued =
          pendingIceCandidatesRef.current.get(remoteUserId) ?? []

        queued.push(data.candidate)

        pendingIceCandidatesRef.current.set(
          remoteUserId,
          queued,
        )

        return
      }

      try {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        )
      } catch (error) {
        console.warn(
          "[WebRTC] Falha ao adicionar ICE:",
          error,
        )
      }
    },
    [peerConnectionsRef, pendingIceCandidatesRef, userId],
  )

  return {
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  }
}

