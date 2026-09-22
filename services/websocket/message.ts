import { WebSocket } from "ws";

import messageModel from "../../models/message_model.js";
import roomModel from "../../models/room_model.js";

import type { ConnectedClient } from "./room.js";

type RoomParticipant = {
    user: {
        toString(): string;
    };

    joinedAt: Date;
};

type MessageSendData = {
    user: string;
    room: string;
    content?: string;
    type?: string;
    media?: string | null;
    replyTo?: string | null;
};

export async function sendMessage(
    client: ConnectedClient,
    data: MessageSendData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.room) {
        send(
            client.socket,
            "message:error",
            {
                message:
                    "User e room são obrigatórios."
            }
        );

        return;
    }

    if (
        client.userId !== data.user ||
        client.roomId !== data.room
    ) {
        send(
            client.socket,
            "message:error",
            {
                message:
                    "Usuário não está conectado a esta sala."
            }
        );

        return;
    }

    const room =
        await roomModel.findById(data.room);

    if (!room) {
        send(
            client.socket,
            "message:error",
            {
                message: "Sala não encontrada."
            }
        );

        return;
    }

    if (room.status === "closed") {
        send(
            client.socket,
            "message:error",
            {
                message: "A sala está fechada."
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
            "message:error",
            {
                message:
                    "Usuário não participa da sala."
            }
        );

        return;
    }

    if (!data.content && !data.media) {
        send(
            client.socket,
            "message:error",
            {
                message:
                    "A mensagem precisa possuir conteúdo ou mídia."
            }
        );

        return;
    }

    const message =
        await messageModel.create({
            room: data.room,
            user: data.user,
            content: data.content || "",
            type: data.type || "text",
            media: data.media || null,
            replyTo: data.replyTo || null
        });

    const messageData =
        message.toObject();

    for (const connectedClient of clients) {
        if (
            connectedClient.roomId ===
            data.room
        ) {
            send(
                connectedClient.socket,
                "message:new",
                messageData
            );
        }
    }

    console.log(
        `[WEBSOCKET] Mensagem enviada na sala ${data.room}.`
    );
}

function send(
    socket: WebSocket,
    event: string,
    data: unknown
): void {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(
        JSON.stringify({
            event,
            data
        })
    );
}