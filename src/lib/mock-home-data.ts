import type { Room, RoomIconType, RecentRoomView, User } from "./db-types";

export const mockCurrentUser: User = {
    _id: "u1",
    username: "yshdev",
    nickname: "Yshdev",
    avatar: null,
    status: "online",
    createdAt: "2025-01-10T12:00:00.000Z",
    updatedAt: "2025-01-10T12:00:00.000Z",
};

// Enquanto o backend não tem um campo de "tipo visual" da sala (ver nota em
// db-types.ts), mapeamos aqui por id só para alimentar o ícone/cor na home.
const roomVisuals: Record<string, { icon: RoomIconType; iconColorClass: string }> = {
    r1: { icon: "code", iconColorClass: "bg-accent" },
    r2: { icon: "people", iconColorClass: "bg-[oklch(0.5_0.15_265)]" },
    r3: { icon: "game", iconColorClass: "bg-success" },
    r4: { icon: "code", iconColorClass: "bg-accent" },
    r5: { icon: "people", iconColorClass: "bg-[oklch(0.5_0.18_310)]" },
};

export const mockRooms: Room[] = [
    {
        _id: "r1",
        name: "Sala do Dev",
        broadcast: "b1",
        owner: "u1",
        participants: [
            { user: "u1", joinedAt: "2026-09-22T14:32:00.000Z" },
            { user: "u2", joinedAt: "2026-09-22T14:33:00.000Z" },
        ],
        maxParticipants: 100,
        status: "active",
        createdAt: "2026-09-20T10:00:00.000Z",
        updatedAt: "2026-09-22T14:32:00.000Z",
    },
    {
        _id: "r2",
        name: "Estudos",
        broadcast: null,
        owner: "u1",
        participants: [{ user: "u1", joinedAt: "2026-09-21T21:17:00.000Z" }],
        maxParticipants: 20,
        status: "closed",
        createdAt: "2026-09-15T09:00:00.000Z",
        updatedAt: "2026-09-21T21:17:00.000Z",
    },
    {
        _id: "r3",
        name: "Jogos",
        broadcast: "b3",
        owner: "u2",
        participants: [
            { user: "u1", joinedAt: "2026-09-21T16:03:00.000Z" },
            { user: "u2", joinedAt: "2026-09-21T15:59:00.000Z" },
        ],
        maxParticipants: 10,
        status: "active",
        createdAt: "2026-09-18T09:00:00.000Z",
        updatedAt: "2026-09-21T16:03:00.000Z",
    },
    {
        _id: "r4",
        name: "Projetos",
        broadcast: null,
        owner: "u1",
        participants: [{ user: "u1", joinedAt: "2025-09-12T00:00:00.000Z" }],
        maxParticipants: 50,
        status: "closed",
        createdAt: "2025-09-01T09:00:00.000Z",
        updatedAt: "2025-09-12T00:00:00.000Z",
    },
    {
        _id: "r5",
        name: "Reunião",
        broadcast: null,
        owner: "u3",
        participants: [
            { user: "u1", joinedAt: "2025-09-10T00:00:00.000Z" },
            { user: "u3", joinedAt: "2025-09-10T00:00:00.000Z" },
        ],
        maxParticipants: 30,
        status: "active",
        createdAt: "2025-09-01T09:00:00.000Z",
        updatedAt: "2025-09-10T00:00:00.000Z",
    },
];

export function toRecentRoomView(room: Room): RecentRoomView {
    const visual = roomVisuals[room._id] ?? { icon: "people" as RoomIconType, iconColorClass: "bg-secondary" };
    return {
        id: room._id,
        name: room.name,
        shortCode: room._id.padEnd(6, "0").slice(0, 6),
        status: room.status,
        icon: visual.icon,
        iconColorClass: visual.iconColorClass,
        lastAccessedAt: room.updatedAt,
    };
}

export const mockRecentRooms: RecentRoomView[] = mockRooms.map(toRecentRoomView);