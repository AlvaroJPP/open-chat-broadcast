import { Server as HttpServer } from "http";

import userModel from "../models/user_model.ts";

import {
    WebSocketServer,
    WebSocket
} from "ws";

import {
    ConnectedClient,
    joinRoom,
    leaveRoom
} from "./room.js";

import {
    sendMessage
} from "./message.js";

import {
    startTyping,
    stopTyping
} from "./typing.js";

import {
    startBroadcast,
    endBroadcast
} from "./broadcast.js";

import {
    startScreen,
    stopScreen
} from "./screen.js";

import {
    sendOffer,
    sendAnswer,
    sendIceCandidate
} from "./webrtc.js";

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

async function handleMessage(
    client: ConnectedClient,
    message: string,
    clients: Set<ConnectedClient>
): Promise<void> {
    try {
        const payload =
            JSON.parse(message);

        switch (payload.event) {
            case "room:join":
                await joinRoom(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "room:leave":
                await leaveRoom(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "message:send":
                await sendMessage(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "typing:start":
                await startTyping(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "typing:stop":
                await stopTyping(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "broadcast:start":
                await startBroadcast(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "broadcast:end":
                await endBroadcast(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "screen:start":
                await startScreen(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "screen:stop":
                await stopScreen(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "webrtc:offer":
                await sendOffer(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "webrtc:answer":
                await sendAnswer(
                    client,
                    payload.data,
                    clients
                );

                break;

            case "webrtc:ice:candidate":
                await sendIceCandidate(
                    client,
                    payload.data,
                    clients
                );

                break;

            default:
                send(
                    client.socket,
                    "error",
                    {
                        message:
                            "Evento não reconhecido."
                    }
                );
        }
    } catch (error) {
        console.error(
            "[WEBSOCKET] Erro ao processar mensagem:",
            error
        );

        send(
            client.socket,
            "error",
            {
                message:
                    "Mensagem WebSocket inválida."
            }
        );
    }
}

function start(
    server: HttpServer
): WebSocketServer {
    const websocketServer =
        new WebSocketServer({
            server,
            path: "/ws"
        });

    const clients =
        new Set<ConnectedClient>();

    websocketServer.on(
        "connection",
        (socket: WebSocket) => {
            const client: ConnectedClient = {
                socket,
                userId: null,
                roomId: null
            };

            clients.add(client);

            console.log(
                `[WEBSOCKET] Cliente conectado. Clientes: ${clients.size}`
            );

            send(
                socket,
                "connected",
                {
                    message:
                        "Conexão WebSocket estabelecida."
                }
            );

            socket.on(
                "message",
                async (message) => {
                    await handleMessage(
                        client,
                        message.toString(),
                        clients
                    );
                }
            );

            socket.on(
                "close",
                async () => {
                    const userId =
                        client.userId;

                    const roomId =
                        client.roomId;

                    /*
                     * A desconexão do WebSocket
                     * NÃO remove o usuário da sala.
                     *
                     * room.participants representa
                     * a associação persistente à sala.
                     *
                     * clients representa apenas
                     * a presença/conexão atual.
                     */

                    if (userId) {
                        await userModel.findByIdAndUpdate(
                            userId,
                            {
                                status: "offline"
                            }
                        );
                    }

                    clients.delete(client);

                    /*
                     * Avisa os usuários que estavam
                     * conectados à mesma sala.
                     */
                    if (userId && roomId) {
                        for (const connectedClient of clients) {
                            if (
                                connectedClient.roomId !==
                                roomId
                            ) {
                                continue;
                            }

                            send(
                                connectedClient.socket,
                                "participant:leave",
                                {
                                    user: userId,
                                    room: roomId
                                }
                            );
                        }

                        console.log(
                            `[WEBSOCKET] Usuário ${userId} desconectado da sala ${roomId}.`
                        );
                    }

                    console.log(
                        `[WEBSOCKET] Cliente desconectado. Clientes: ${clients.size}`
                    );
                }
            );

            socket.on(
                "error",
                (error) => {
                    console.error(
                        "[WEBSOCKET] Erro:",
                        error
                    );
                }
            );
        }
    );

    console.log(
        "[WEBSOCKET] WebSocket iniciado em /ws"
    );

    return websocketServer;
}

export default {
    start
};