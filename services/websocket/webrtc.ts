import { WebSocket } from "ws";

import roomModel from "../../models/room_model.ts";

import type { ConnectedClient } from "./room.ts";

type WebRTCData = {
    user: string;
    room: string;
    target: string;
    sdp?: unknown;
    candidate?: unknown;
};

type RoomParticipant = {
    user:
        | string
        | {
              _id?: string;
              toString(): string;
          };

    joinedAt: Date;
};

export async function sendOffer(
    client: ConnectedClient,
    data: WebRTCData,
    clients: Set<ConnectedClient>
): Promise<void> {
    const valid = await validate(
        client,
        data
    );

    if (!valid) {
        return;
    }

    sendToTarget(
        client,
        data,
        clients,
        "webrtc:offer",
        {
            user: data.user,
            room: data.room,
            sdp: data.sdp
        }
    );
}

export async function sendAnswer(
    client: ConnectedClient,
    data: WebRTCData,
    clients: Set<ConnectedClient>
): Promise<void> {
    const valid = await validate(
        client,
        data
    );

    if (!valid) {
        return;
    }

    sendToTarget(
        client,
        data,
        clients,
        "webrtc:answer",
        {
            user: data.user,
            room: data.room,
            sdp: data.sdp
        }
    );
}

export async function sendIceCandidate(
    client: ConnectedClient,
    data: WebRTCData,
    clients: Set<ConnectedClient>
): Promise<void> {
    const valid = await validate(
        client,
        data
    );

    if (!valid) {
        return;
    }

    sendToTarget(
        client,
        data,
        clients,
        "webrtc:ice:candidate",
        {
            user: data.user,
            room: data.room,
            candidate: data.candidate
        }
    );
}

async function validate(
    client: ConnectedClient,
    data: WebRTCData
): Promise<boolean> {
    if (
        !data?.user ||
        !data?.room ||
        !data?.target
    ) {
        send(
            client.socket,
            "webrtc:error",
            {
                message:
                    "User, room e target são obrigatórios."
            }
        );

        return false;
    }

    /*
     * Confirma que o socket que enviou
     * a sinalização pertence ao usuário
     * informado e está conectado à sala.
     */
    if (
        client.userId !== data.user ||
        client.roomId !== data.room
    ) {
        send(
            client.socket,
            "webrtc:error",
            {
                message:
                    "Usuário não está conectado a esta sala."
            }
        );

        return false;
    }

    /*
     * Busca a sala.
     */
    const room =
        await roomModel.findById(
            data.room
        );

    if (!room) {
        send(
            client.socket,
            "webrtc:error",
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
            "webrtc:error",
            {
                message:
                    "A sala está fechada."
            }
        );

        return false;
    }

    /*
     * Verifica o usuário alvo.
     *
     * NÃO usamos populate aqui.
     * O roomModel retorna o ObjectId original
     * do participante.
     */
    const participant =
        room.participants.some(
            (
                participant: RoomParticipant
            ) => {
                const participantUserId =
                    typeof participant.user ===
                    "string"
                        ? participant.user
                        : participant.user
                              ._id
                            ? participant.user._id.toString()
                            : participant.user.toString();

                return (
                    participantUserId ===
                    data.target
                );
            }
        );

    if (!participant) {
        console.error(
            "[WEBRTC] Usuário alvo não participa da sala:",
            {
                target: data.target,
                room: data.room,
                sender: data.user
            }
        );

        send(
            client.socket,
            "webrtc:error",
            {
                message:
                    "O usuário alvo não participa da sala."
            }
        );

        return false;
    }

    return true;
}

function sendToTarget(
    client: ConnectedClient,
    data: WebRTCData,
    clients: Set<ConnectedClient>,
    event: string,
    payload: unknown
): void {
    /*
     * Um mesmo usuário pode possuir
     * várias conexões WebSocket:
     *
     * - página da sala
     * - chat
     * - WebRTC
     *
     * Por isso enviamos a sinalização
     * para TODAS as conexões do usuário alvo.
     */

    let delivered = false;

    for (const connectedClient of clients) {
        if (
            connectedClient.userId !==
            data.target
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
            payload
        );

        delivered = true;
    }

    if (delivered) {
        return;
    }

    send(
        client.socket,
        "webrtc:error",
        {
            message:
                "Usuário alvo não está conectado."
        }
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