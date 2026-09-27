// Espelha os schemas em user_model.ts / room_model.ts / message_model.ts / media_model.ts
// para tipar o front. Mantenha isso em sincronia se o schema do backend mudar.

export type UserStatus = "online" | "offline" | "away" | "busy";

export interface User {
    _id: string;
    username: string;
    nickname: string;
    avatar: string | null;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export type RoomStatus = "waiting" | "active" | "closed";

export interface RoomParticipant {
    user: string; // User._id
    joinedAt: string;
}

export interface Room {
    _id: string;
    name: string;
    broadcast: string | null;
    owner: string; // User._id
    participants: RoomParticipant[];
    maxParticipants: number;
    status: RoomStatus;
    createdAt: string;
    updatedAt: string;
}

export type MessageType = "text" | "image" | "video" | "audio" | "document" | "system";

export interface Message {
    _id: string;
    room: string;
    user: string;
    content: string;
    type: MessageType;
    media: string | null;
    replyTo: string | null;
    createdAt: string;
    updatedAt: string;
}

export type MediaType = "image" | "video" | "audio" | "document" | "archive";

export interface Media {
    _id: string;
    user: string;
    room: string | null;
    message: string | null;
    type: MediaType;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    width: number | null;
    height: number | null;
    duration: number | null;
    resolution: "360p" | "720p" | "1080p" | "1440p" | "2160p" | null;
}

/**
 * O modelo `Room` do banco não guarda um "tipo visual" de sala — isso é uma
 * necessidade só da UI (ícone/cor do avatar da sala na home). Enquanto o
 * backend não expõe esse campo, ele é derivado/mockado no front. Se for
 * persistir de verdade, o ideal é adicionar algo como `room.icon` no schema.
 */
export type RoomIconType = "code" | "people" | "game";

export interface RecentRoomView {
    id: string;
    name: string;
    shortCode: string;
    status: RoomStatus;
    icon: RoomIconType;
    iconColorClass: string;
    lastAccessedAt: string; // ISO date
}