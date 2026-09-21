export type ParticipantStatus = "transmitindo" | "assistindo" | "ausente";

export interface Participant {
    id: string;
    name: string;
    isYou?: boolean;
    status: ParticipantStatus;
    avatarColor: string; // tailwind bg-* class for the avatar fallback
    micMuted?: boolean;
    isSharingScreen?: boolean;
}

export interface ChatMessageData {
    id: string;
    author: Pick<Participant, "id" | "name" | "avatarColor">;
    time: string;
    text: string;
}

export interface RoomInfo {
    id: string;
    name: string;
    isLive: boolean;
    inviteUrl: string;
}