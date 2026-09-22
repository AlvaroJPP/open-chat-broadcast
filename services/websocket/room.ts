import { WebSocket } from "ws";
import userModel from "../models/user_model.ts";
import roomModel from "../models/room_model.ts";

export type ConnectedClient = {
    socket: WebSocket;
    userId: string | null;
    roomId: string | null;
};

type RoomParticipant = {
    user: {
        toString(): string;
    };

    joinedAt: Date;
};

type RoomJoinData = {
    user: string;
    room: string;
};

export async function joinRoom(
    client: ConnectedClient,
    data: RoomJoinData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.room) {
        send(
            client.socket,
            "room:error",
            {
                message:
                    "User e room são obrigatórios."
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
            "room:error",
            {
                message:
                    "Sala não encontrada."
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
            "room:error",
            {
                message:
                    "Usuário não participa da sala."
            }
        );

        return;
    }



    client.userId = data.user;
    client.roomId = data.room;

    await userModel.findByIdAndUpdate(
        data.user,
        {
            status: "online"
        }
    );

    send(
        client.socket,
        "room:joined",
        {
            room: data.room,
            user: data.user
        }
    );

    send(
        client.socket,
        "room:participants",
        {
            room: data.room,
            participants: room.participants.map(
                (participant: RoomParticipant) => ({
                    user: participant.user.toString(),
                    joinedAt: participant.joinedAt
                })
            )
        }
    );

    broadcastParticipant(
        client,
        data,
        clients,
        "participant:join"
    );

    console.log(
        `[WEBSOCKET] Usuário ${data.user} entrou na sala ${data.room}.`
    );
}

export async function leaveRoom(
    client: ConnectedClient,
    data: RoomJoinData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.room) {
        send(
            client.socket,
            "room:error",
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
            "room:error",
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
            "room:error",
            {
                message:
                    "Sala não encontrada."
            }
        );

        return;
    }

    await removeParticipant(
        data.user,
        data.room
    );
    client.roomId = null;

    send(
        client.socket,
        "room:left",
        {
            room: data.room,
            user: data.user
        }
    );

    broadcastParticipant(
        client,
        data,
        clients,
        "participant:leave"
    );

    console.log(
        `[WEBSOCKET] Usuário ${data.user} saiu da sala ${data.room}.`
    );
}

function broadcastParticipant(
    client: ConnectedClient,
    data: RoomJoinData,
    clients: Set<ConnectedClient>,
    event:
        | "participant:join"
        | "participant:leave"
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

export async function removeParticipant(
    userId: string,
    roomId: string
): Promise<void> {
    const room =
        await roomModel.findById(roomId);

    if (!room) {
        return;
    }

    room.participants =
        room.participants.filter(
            (participant: RoomParticipant) =>
                participant.user.toString() !== userId
        );

    if (
        room.owner.toString() === userId
    ) {
        const nextOwner =
            room.participants
                .sort(
                    (
                        a: RoomParticipant,
                        b: RoomParticipant
                    ) =>
                        a.joinedAt.getTime() -
                        b.joinedAt.getTime()
                )[0];

        if (nextOwner) {
            room.owner = nextOwner.user;
        } else {
            room.status = "closed";
        }
    }

    if (
        room.participants.length === 0
    ) {
        room.status = "closed";
    }

    await room.save();
}