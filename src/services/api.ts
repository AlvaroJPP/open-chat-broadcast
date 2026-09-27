import { API_BASE_URL } from "@/lib/config";
import type { Room } from "@/lib/db-types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...init?.headers },
        ...init,
    });

    if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        throw new Error(`Erro ${response.status} ao chamar ${path}: ${message}`);
    }

    return response.json() as Promise<T>;
}

export interface CreateRoomPayload {
    name: string;
    maxParticipants?: number;
}

// GET /api/rooms/recent — salas recentes do usuário autenticado
export function apiGetRecentRooms() {
    return request<Room[]>("/rooms/recent");
}

// POST /api/rooms — cria uma sala nova
export function apiCreateRoom(payload: CreateRoomPayload) {
    return request<Room>("/rooms", { method: "POST", body: JSON.stringify(payload) });
}

// POST /api/rooms/join — entra em uma sala por link ou código
export function apiJoinRoom(codeOrLink: string) {
    return request<Room>("/rooms/join", { method: "POST", body: JSON.stringify({ codeOrLink }) });
}