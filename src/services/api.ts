import { API_BASE_URL } from "@/lib/config";
import { getCurrentUserId } from "@/lib/current-user";
import type { Room } from "@/lib/db-types";

type ApiEnvelope<T> = {
    success: boolean;
    data?: T;
    error?: { status?: number; message?: string };
};

class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

// O backend responde sempre { success, data } ou { success:false, error }.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
    });

    const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

    if (!response.ok || !body?.success) {
        throw new ApiError(
            body?.error?.message ?? `Erro ${response.status} ao chamar ${path}`,
            response.status,
        );
    }

    return body.data as T;
}

function requireUserId(): string {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("Faça login para continuar.");
    }

    return userId;
}

export interface CreateRoomPayload {
    name: string;
    maxParticipants?: number;
}

// GET /api/rooms — salas em que o usuário logado participa
export async function apiGetRecentRooms() {
    const userId = requireUserId();
    const rooms = await request<Room[]>("/rooms");

    return rooms.filter((room) =>
        room.participants.some((participant) => {
            const participantUser = participant.user as unknown as string | { _id?: string };
            const id = typeof participantUser === "string" ? participantUser : participantUser?._id;
            return id === userId;
        }),
    );
}

// POST /api/rooms — o backend exige `owner`
export function apiCreateRoom(payload: CreateRoomPayload) {
    return request<Room>("/rooms", {
        method: "POST",
        body: JSON.stringify({ ...payload, owner: requireUserId() }),
    });
}

// POST /api/rooms/:id/join — aceita link (…/rooms/<id>) ou o próprio id
export async function apiJoinRoom(codeOrLink: string) {
    const userId = requireUserId();

    const roomId = codeOrLink
        .trim()
        .split(/[?#]/)[0]!
        .replace(/\/+$/, "")
        .split("/")
        .pop();

    if (!roomId) {
        throw new Error("Informe o link ou número da sala.");
    }

    try {
        await request<Room>(`/rooms/${roomId}/join`, {
            method: "POST",
            body: JSON.stringify({ user: userId }),
        });
    } catch (error) {
        // 409 "já está na sala" não é erro para quem quer entrar de novo.
        const alreadyIn = error instanceof ApiError && error.status === 409 && /já está/i.test(error.message);
        if (!alreadyIn) throw error;
    }

    return request<Room>(`/rooms/${roomId}`);
}
