import { WebSocket } from "ws";

import broadcastModel from "../models/broadcast_model.ts";
import roomModel from "../models/room_model.ts";

import type { ConnectedClient } from "./room.ts";

type BroadcastData = {
    user: string;
    broadcast: string;
};

type RoomParticipant = {
    user: {
        toString(): string;
    };

    joinedAt: Date;
};

export async function startBroadcast(
    client: ConnectedClient,
    data: BroadcastData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.broadcast) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "User e broadcast são obrigatórios."
            }
        );

        return;
    }

    if (!client.userId) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "Usuário não está conectado."
            }
        );

        return;
    }

    const broadcast =
        await broadcastModel.findById(
            data.broadcast
        );

    if (!broadcast) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "Broadcast não encontrado."
            }
        );

        return;
    }

    if (
        broadcast.owner.toString() !==
        data.user
    ) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "Apenas o proprietário pode iniciar o broadcast."
            }
        );

        return;
    }

    if (broadcast.status === "live") {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "O broadcast já está ao vivo."
            }
        );

        return;
    }

    if (broadcast.status === "ended") {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "O broadcast já foi encerrado."
            }
        );

        return;
    }

    const roomId =
        broadcast.room?.toString();

    if (!roomId) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "O broadcast não possui uma sala."
            }
        );

        return;
    }

    const room =
        await roomModel.findById(roomId);

    if (!room) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "Sala do broadcast não encontrada."
            }
        );

        return;
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
            "broadcast:error",
            {
                message:
                    "Usuário não participa da sala."
            }
        );

        return;
    }

    broadcast.status = "live";
    broadcast.startedAt = new Date();
    broadcast.endedAt = null;

    await broadcast.save();

    for (const connectedClient of clients) {
        if (
            connectedClient.roomId !==
            roomId
        ) {
            continue;
        }

        send(
            connectedClient.socket,
            "broadcast:start",
            {
                broadcast: broadcast._id.toString(),
                room: roomId,
                user: data.user,
                startedAt:
                    broadcast.startedAt
            }
        );
    }

    console.log(
        `[WEBSOCKET] Broadcast ${data.broadcast} iniciado na sala ${roomId}.`
    );
}
export async function endBroadcast(
    client: ConnectedClient,
    data: BroadcastData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.broadcast) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "User e broadcast são obrigatórios."
            }
        );

        return;
    }

    const broadcast =
        await broadcastModel.findById(
            data.broadcast
        );

    if (!broadcast) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "Broadcast não encontrado."
            }
        );

        return;
    }

    if (
        broadcast.owner.toString() !==
        data.user
    ) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "Apenas o proprietário pode encerrar o broadcast."
            }
        );

        return;
    }

    if (broadcast.status !== "live") {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "O broadcast não está ao vivo."
            }
        );

        return;
    }

    const roomId =
        broadcast.room?.toString();

    if (!roomId) {
        send(
            client.socket,
            "broadcast:error",
            {
                message:
                    "O broadcast não possui uma sala."
            }
        );

        return;
    }

    broadcast.status = "ended";
    broadcast.endedAt = new Date();

    await broadcast.save();

    for (const connectedClient of clients) {
        if (
            connectedClient.roomId !==
            roomId
        ) {
            continue;
        }

        send(
            connectedClient.socket,
            "broadcast:end",
            {
                broadcast:
                    broadcast._id.toString(),
                room: roomId,
                user: data.user,
                endedAt:
                    broadcast.endedAt
            }
        );
    }

    console.log(
        `[WEBSOCKET] Broadcast ${data.broadcast} encerrado na sala ${roomId}.`
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