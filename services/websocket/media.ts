import { WebSocket } from "ws";

import type { ConnectedClient } from "./room.ts";

type MediaStateData = {
    user: string;
    room: string;
    camera?: boolean;
    screen?: boolean;
    mic?: boolean;
};

/*
 * Retransmite o estado de mídia (câmera / tela / microfone ligados ou não)
 * de um participante para os demais da sala. O front usa isso para saber
 * quando mostrar ou esconder o vídeo de cada pessoa.
 */
export function relayMediaState(
    client: ConnectedClient,
    data: MediaStateData,
    clients: Set<ConnectedClient>
): void {
    if (
        !data?.user ||
        !data?.room ||
        client.userId !== data.user ||
        client.roomId !== data.room
    ) {
        return;
    }

    const payload = JSON.stringify({
        event: "media:state",
        data: {
            user: data.user,
            room: data.room,
            camera: Boolean(data.camera),
            screen: Boolean(data.screen),
            mic: Boolean(data.mic)
        }
    });

    for (const connectedClient of clients) {
        if (
            connectedClient.roomId !== data.room ||
            connectedClient.userId === data.user
        ) {
            continue;
        }

        if (connectedClient.socket.readyState === WebSocket.OPEN) {
            connectedClient.socket.send(payload);
        }
    }
}
