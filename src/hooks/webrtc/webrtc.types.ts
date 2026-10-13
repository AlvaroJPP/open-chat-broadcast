
export type UseWebRTCOptions = {
    userId: string;
    roomId: string;
};

export type WebRTCUser = {
    _id: string;
    email?: string;
    nickname?: string;
    avatar?: string | null;
    status?: string;
};

export type WebRTCSignal = {
    user: string | WebRTCUser;
    room: string;
    target: string | WebRTCUser;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
};

export type MediaState = {
    camera: boolean;
    screen: boolean;
    mic: boolean;
};

export type StreamQuality =
    | "auto"
    | "360p"
    | "720p"
    | "1080p"
    | "1080p60";

export type QualityConfig = {
    width: number;
    height: number;
    frameRate: number;
    maxBitrate: number;
};

export type ParticipantPayload = {
    user?: string | WebRTCUser;
    id?: string;
    online?: boolean;
    muted?: boolean;
};