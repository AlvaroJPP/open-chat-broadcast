import { USE_MOCK_DATA } from "@/lib/config";
import { mockRecentRooms, mockRooms, toRecentRoomView } from "@/lib/mock-home-data";
import type { RecentRoomView, Room } from "@/lib/db-types";
import { apiCreateRoom, apiGetRecentRooms, apiJoinRoom, type CreateRoomPayload } from "./api";

function delay<T>(value: T, ms = 300): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getRecentRooms(): Promise<RecentRoomView[]> {
    if (USE_MOCK_DATA) return delay(mockRecentRooms);

    const rooms = await apiGetRecentRooms();
    return rooms.map(toRecentRoomView);
}

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
    if (USE_MOCK_DATA) {
        const newRoom: Room = {
            _id: `r${mockRooms.length + 1}`,
            name: payload.name,
            broadcast: null,
            owner: "u1",
            participants: [{ user: "u1", joinedAt: new Date().toISOString() }],
            maxParticipants: payload.maxParticipants ?? 100,
            status: "waiting",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return delay(newRoom);
    }

    return apiCreateRoom(payload);
}

export async function joinRoom(codeOrLink: string): Promise<Room> {
    if (USE_MOCK_DATA) {
        const code = codeOrLink.trim().split("/").pop() ?? codeOrLink;
        const found = mockRooms.find((room) => room._id.startsWith(code) || room.name === code);
        if (!found) {
            throw new Error("Sala não encontrada. Verifique o link ou número informado.");
        }
        return delay(found);
    }

    return apiJoinRoom(codeOrLink);
}