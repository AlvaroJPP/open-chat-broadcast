import { useEffect } from "react";

import {
  BroadcastWebSocket,
  type WebSocketMessage,
} from "../../lib/websocket";

type MutableRef<T> = {
  current: T;
};

type UseWebRTCConnectionOptions = {
  userId: string;
  roomId: string;

  websocketRef: MutableRef<BroadcastWebSocket | null>;

  peerConnectionsRef: MutableRef<Map<string, RTCPeerConnection>>;
  remoteStreamsRef: MutableRef<Map<string, MediaStream>>;
  pendingIceCandidatesRef: MutableRef<Map<string, RTCIceCandidateInit[]>>;
  negotiationInProgressRef: MutableRef<Set<string>>;

  screenStreamRef: MutableRef<MediaStream | null>;
  cameraTrackRef: MutableRef<MediaStreamTrack | null>;
  micTrackRef: MutableRef<MediaStreamTrack | null>;
  sharingUsersRef: MutableRef<Set<string>>;

  handleMessage: (message: WebSocketMessage) => void;
  cleanupAudio: () => void;

  setConnected: (connected: boolean) => void;
  setRemoteStreams: (
    streams: Map<string, MediaStream>,
  ) => void;
  setLocalStream: (
    stream: MediaStream | null,
  ) => void;
  setIsScreenSharing: (enabled: boolean) => void;
  setIsCameraOn: (enabled: boolean) => void;
  setIsMicOn: (enabled: boolean) => void;
  setSharingUsers: (users: string[]) => void;
  setMediaStates: (
    states: Record<string, { camera: boolean; screen: boolean; mic: boolean }>,
  ) => void;
  setPeerStates: (states: Record<string, string>) => void;
};

export function useWebRTCConnection({
  userId,
  roomId,
  websocketRef,
  peerConnectionsRef,
  remoteStreamsRef,
  pendingIceCandidatesRef,
  negotiationInProgressRef,
  screenStreamRef,
  cameraTrackRef,
  micTrackRef,
  sharingUsersRef,
  handleMessage,
  cleanupAudio,
  setConnected,
  setRemoteStreams,
  setLocalStream,
  setIsScreenSharing,
  setIsCameraOn,
  setIsMicOn,
  setSharingUsers,
  setMediaStates,
  setPeerStates,
}: UseWebRTCConnectionOptions) {
  useEffect(() => {
    if (!userId || !roomId) {
      setConnected(false);
      setRemoteStreams(new Map());
      return;
    }

    const websocket = new BroadcastWebSocket();
    websocketRef.current = websocket;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    async function initialize() {
      try {
        await websocket.connect();

        if (cancelled) {
          websocket.disconnect();
          return;
        }

        setConnected(true);

        unsubscribe = websocket.onMessage(handleMessage);

        websocket.send("room:join", {
          user: userId,
          room: roomId,
        });
      } catch (error) {
        if (!cancelled) {
          console.error("[WebRTC] Falha ao iniciar:", error);
          setConnected(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;

      unsubscribe?.();
      websocket.disconnect();

      if (websocketRef.current === websocket) {
        websocketRef.current = null;
      }

      for (const peerConnection of peerConnectionsRef.current.values()) {
        peerConnection.close();
      }

      peerConnectionsRef.current.clear();
      pendingIceCandidatesRef.current.clear();
      negotiationInProgressRef.current.clear();

      screenStreamRef.current?.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });

      cameraTrackRef.current?.stop();
      micTrackRef.current?.stop();

      screenStreamRef.current = null;
      cameraTrackRef.current = null;
      micTrackRef.current = null;

      cleanupAudio();

      remoteStreamsRef.current.clear();
      sharingUsersRef.current.clear();

      setConnected(false);
      setRemoteStreams(new Map());
      setLocalStream(null);
      setIsScreenSharing(false);
      setIsCameraOn(false);
      setIsMicOn(false);
      setSharingUsers([]);
      setMediaStates({});
      setPeerStates({});
    };
  }, [
    userId,
    roomId,
    websocketRef,
    peerConnectionsRef,
    remoteStreamsRef,
    pendingIceCandidatesRef,
    negotiationInProgressRef,
    screenStreamRef,
    cameraTrackRef,
    micTrackRef,
    sharingUsersRef,
    handleMessage,
    cleanupAudio,
    setConnected,
    setRemoteStreams,
    setLocalStream,
    setIsScreenSharing,
    setIsCameraOn,
    setIsMicOn,
    setSharingUsers,
    setMediaStates,
    setPeerStates,
  ]);
}
