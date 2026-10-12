import { useWebRTC } from "@/hooks/webrtc/use-webrtc";

interface UseRoomMediaProps {
    userId: string;
    roomId: string;
}

export function useRoomMedia({
    userId,
    roomId,
}: UseRoomMediaProps) {
    const media = useWebRTC({
        userId,
        roomId,
    });

    return {
        connected: media.connected,
        localStream: media.localStream,
        remoteStreams: media.remoteStreams,

        isScreenSharing: media.isScreenSharing,
        isCameraOn: media.isCameraOn,
        isMicOn: media.isMicOn,

        sharingUsers: media.sharingUsers,
        mediaStates: media.mediaStates,
        peerStates: media.peerStates,
        lastError: media.lastError,

        streamQuality: media.streamQuality,
        setStreamQuality: media.setStreamQuality,

        startCamera: media.startCamera,
        stopCamera: media.stopCamera,
        startMic: media.startMic,
        stopMic: media.stopMic,
        startScreenShare: media.startScreenShare,
        stopScreenShare: media.stopScreenShare,
        stopAllMedia: media.stopAllMedia,
    };
}

