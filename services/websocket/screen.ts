import { WebSocket } from "ws";

import roomModel from "../../models/room_model.ts";

import type { ConnectedClient } from "./room.ts";

type ScreenData = {
    user: string;
    room: string;
};

export async function startScreen(
    client: ConnectedClient,
    data: ScreenData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.room) {
        send(
            client.socket,
            "screen:error",
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
            "screen:error",
            {
                message:
                    "Usuário não está conectado a esta sala."
            }
        );

        return;
    }

    const room =
        await roomModel.findById(
            data.room
        );

    if (!room) {
        send(
            client.socket,
            "screen:error",
            {
                message:
                    "Sala não encontrada."
            }
        );

        return;
    }

    if (room.status === "closed") {
        send(
            client.socket,
            "screen:error",
            {
                message:
                    "A sala está fechada."
            }
        );

        return;
    }

    broadcastScreen(
        client,
        data,
        clients,
        "screen:start"
    );

    console.log(
        `[WEBSOCKET] Usuário ${data.user} iniciou compartilhamento de tela na sala ${data.room}.`
    );
}

export async function stopScreen(
    client: ConnectedClient,
    data: ScreenData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.room) {
        send(
            client.socket,
            "screen:error",
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
            "screen:error",
            {
                message:
                    "Usuário não está conectado a esta sala."
            }
        );

        return;
    }

    broadcastScreen(
        client,
        data,
        clients,
        "screen:stop"
    );

    console.log(
        `[WEBSOCKET] Usuário ${data.user} encerrou compartilhamento de tela na sala ${data.room}.`
    );
}

function broadcastScreen(
    client: ConnectedClient,
    data: ScreenData,
    clients: Set<ConnectedClient>,
    event: "screen:start" | "screen:stop"
): void {
    for (const connectedClient of clients) {
        if (
            connectedClient === client
        ) {
            continue;
        }

        if (
            connectedClient.roomId !== data.room
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
}

function send(
    socket: WebSocket,
    event: string,
    data: unknown
): void {
    if (
        socket.readyState !== WebSocket.OPEN
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