import { WebSocket } from "ws";

import roomModel from "../../models/room_model.ts";

import type { ConnectedClient } from "./room.ts";

type TypingData = {
    user: string;
    room: string;
};

type RoomParticipant = {
    user: {
        toString(): string;
    };

    joinedAt: Date;
};

export async function startTyping(
    client: ConnectedClient,
    data: TypingData,
    clients: Set<ConnectedClient>
): Promise<void> {
    const valid =
        await validateTyping(
            client,
            data
        );

    if (!valid) {
        return;
    }

    broadcastTyping(
        client,
        data,
        clients,
        "typing:start"
    );
}

export async function stopTyping(
    client: ConnectedClient,
    data: TypingData,
    clients: Set<ConnectedClient>
): Promise<void> {
    const valid =
        await validateTyping(
            client,
            data
        );

    if (!valid) {
        return;
    }

    broadcastTyping(
        client,
        data,
        clients,
        "typing:stop"
    );
}

async function validateTyping(
    client: ConnectedClient,
    data: TypingData
): Promise<boolean> {
    if (!data?.user || !data?.room) {
        send(
            client.socket,
            "typing:error",
            {
                message:
                    "User e room são obrigatórios."
            }
        );

        return false;
    }

    if (
        client.userId !== data.user ||
        client.roomId !== data.room
    ) {
        send(
            client.socket,
            "typing:error",
            {
                message:
                    "Usuário não está conectado a esta sala."
            }
        );

        return false;
    }

    const room =
        await roomModel.findById(
            data.room
        );

    if (!room) {
        send(
            client.socket,
            "typing:error",
            {
                message:
                    "Sala não encontrada."
            }
        );

        return false;
    }

    if (room.status === "closed") {
        send(
            client.socket,
            "typing:error",
            {
                message:
                    "A sala está fechada."
            }
        );

        return false;
    }

    const participant =
        room.participants.some(
            (participant: RoomParticipant) =>
                participant.user.toString() ===
                data.user
        );

    if (!participant) {
        send(
            client.socket,
            "typing:error",
            {
                message:
                    "Usuário não participa da sala."
            }
        );

        return false;
    }

    return true;
}

function broadcastTyping(
    client: ConnectedClient,
    data: TypingData,
    clients: Set<ConnectedClient>,
    event: "typing:start" | "typing:stop"
): void {
    for (const connectedClient of clients) {
        if (
            connectedClient === client
        ) {
            continue;
        }

        if (
            connectedClient.roomId !==
            data.room
        ) {
            continue;
        }

        send(
            connectedClient.socket,
            event,
            {
                user: data.user,
                room: data.room
            }
        );
    }

    console.log(
        `[WEBSOCKET] ${event} - Usuário ${data.user} na sala ${data.room}.`
    );
}

function send(
    socket: WebSocket,
    event: string,
    data: unknown
): void {
    if (
        socket.readyState !==
        WebSocket.OPEN
    ) {
        return;
    }

    socket.send(
        JSON.stringify({
            event,
            data
        })
    );
}