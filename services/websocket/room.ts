
import { WebSocket } from "ws";

import userModel from "../../models/user_model.ts";
import roomModel from "../../models/room_model.ts";
import realtimeBus from "./realtime_bus.js";

export type ConnectedClient = {
    socket: WebSocket;
    userId: string | null;
    roomId: string | null;
};

type RoomParticipant = {
    user:
        | string
        | {
              _id: string;
              email?: string;
              nickname?: string;
              avatar?: string | null;
              status?: string;
          };
    joinedAt: Date;
};

type RoomJoinData = {
    user: string;
    room: string;
};


type ParticipantUser = {
    _id: string;
    email?: string | undefined;
    nickname?: string | undefined;
    avatar?: string | null | undefined;
    status?: string | undefined;
};


function getParticipantUserId(
    user: string | { _id: string }
): string {
    if (typeof user === "string") {
        return user;
    }

    return user._id.toString();
}

function serializeUser(
    user:
        | string
        | {
              _id: string;
              email?: string;
              nickname?: string;
              avatar?: string | null;
              status?: string;
          }
): ParticipantUser | string {
    if (typeof user === "string") {
        return user;
    }

    return {
        _id: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar ?? null,
        status: user.status,
    };
}

function buildParticipantsPayload(
    participants: RoomParticipant[],
    clients: Set<ConnectedClient>,
    roomId: string
) {
    return participants.map((participant) => {
        const userId = getParticipantUserId(
            participant.user
        );

        return {
            user: serializeUser(participant.user),
            joinedAt: participant.joinedAt,
            online: [...clients].some(
                (other) =>
                    other.userId === userId &&
                    other.roomId === roomId &&
                    other.socket.readyState === WebSocket.OPEN
            ),
        };
    });
}

function send(
    socket: WebSocket,
    event: string,
    data: unknown
): void {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify({ event, data }));
}

/**
 * Envia uma atualização da sala para os clientes conectados nela.
 */
function broadcastRoomUpdated(
    roomId: string,
    clients: Set<ConnectedClient>
): void {
    for (const connectedClient of clients) {
        if (connectedClient.roomId !== roomId) {
            continue;
        }

        send(connectedClient.socket, "room:updated", {
            room: roomId,
        });
    }
}

/**
 * Atualiza a lista de participantes da sala.
 */
export async function broadcastRoomParticipants(
    roomId: string,
    clients: Set<ConnectedClient>
): Promise<void> {
    const populatedRoom = await roomModel
        .findById(roomId)
        .populate(
            "participants.user",
            "_id email nickname avatar status"
        );

    if (!populatedRoom) {
        return;
    }

    const participantsPayload = buildParticipantsPayload(
        populatedRoom.participants as unknown as RoomParticipant[],
        clients,
        roomId
    );

    for (const client of clients) {
        if (client.roomId !== roomId) {
            continue;
        }

        send(client.socket, "room:participants", {
            room: roomId,
            participants: participantsPayload,
        });
    }

    broadcastRoomUpdated(roomId, clients);

    void realtimeBus.publish({ event: "room:participants", data: { room: roomId, participants: participantsPayload }, roomId }).catch((error: unknown) => console.error("[REALTIME BUS] Falha ao publicar participantes:", error));
    void realtimeBus.publish({ event: "room:updated", data: { room: roomId }, roomId }).catch((error: unknown) => console.error("[REALTIME BUS] Falha ao publicar atualização da sala:", error));
}

/**
 * Entra na sala.
 */
export async function joinRoom(
    client: ConnectedClient,
    data: RoomJoinData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.room) {
        send(client.socket, "room:error", {
            message: "User e room são obrigatórios.",
        });
        return;
    }

    const room = await roomModel.findById(data.room);

    if (!room) {
        send(client.socket, "room:error", {
            message: "Sala não encontrada.",
        });
        return;
    }

    const participant = room.participants.some(
        (item: RoomParticipant) =>
            getParticipantUserId(item.user) === data.user
    );

    if (!participant) {
        send(client.socket, "room:error", {
            message: "Usuário não participa da sala.",
        });
        return;
    }

    client.userId = data.user;
    client.roomId = data.room;

    await userModel.findByIdAndUpdate(data.user, {
        status: "online",
    });

    const populatedRoom = await roomModel
        .findById(data.room)
        .populate(
            "participants.user",
            "_id email nickname avatar status"
        );

    const joinedUser = await userModel.findById(data.user);

    const serializedJoinedUser = joinedUser
        ? {
              _id: joinedUser._id.toString(),
              email: joinedUser.email,
              nickname: joinedUser.nickname,
              avatar: joinedUser.avatar ?? null,
              status: joinedUser.status,
          }
        : undefined;

    send(client.socket, "room:joined", {
        room: data.room,
        user: serializedJoinedUser ?? data.user,
    });

    const participantsPayload = populatedRoom
        ? buildParticipantsPayload(
              populatedRoom.participants as unknown as RoomParticipant[],
              clients,
              data.room
          )
        : [];

    for (const connectedClient of clients) {
        if (connectedClient.roomId !== data.room) {
            continue;
        }

        send(connectedClient.socket, "room:participants", {
            room: data.room,
            participants: participantsPayload,
        });
    }

    const alreadyPresent = [...clients].some(
        (other) =>
            other !== client &&
            other.userId === data.user &&
            other.roomId === data.room &&
            other.socket.readyState === WebSocket.OPEN
    );

    if (!alreadyPresent) {
        broadcastParticipant(
            client,
            data,
            clients,
            "participant:join",
            serializedJoinedUser
        );
    }

    broadcastRoomUpdated(data.room, clients);

    console.log(
        `[WEBSOCKET] Usuário ${data.user} entrou na sala ${data.room}.`
    );
}

/**
 * Sai da sala manualmente.
 * A saída manual continua imediata.
 */
export async function leaveRoom(
    client: ConnectedClient,
    data: RoomJoinData,
    clients: Set<ConnectedClient>
): Promise<void> {
    if (!data?.user || !data?.room) {
        send(client.socket, "room:error", {
            message: "User e room são obrigatórios.",
        });
        return;
    }

    if (
        client.userId !== data.user ||
        client.roomId !== data.room
    ) {
        send(client.socket, "room:error", {
            message: "Usuário não está conectado a esta sala.",
        });
        return;
    }

    const room = await roomModel.findById(data.room);

    if (!room) {
        send(client.socket, "room:error", {
            message: "Sala não encontrada.",
        });
        return;
    }

    const leavingUser = await userModel.findById(data.user);

    await removeParticipant(data.user, data.room);

    client.roomId = null;

    const serializedLeavingUser = leavingUser
        ? {
              _id: leavingUser._id.toString(),
              email: leavingUser.email,
              nickname: leavingUser.nickname,
              avatar: leavingUser.avatar ?? null,
              status: leavingUser.status,
          }
        : undefined;

    send(client.socket, "room:left", {
        room: data.room,
        user: serializedLeavingUser ?? data.user,
    });

    const updatedRoom = await roomModel
        .findById(data.room)
        .populate(
            "participants.user",
            "_id email nickname avatar status"
        );

    const participantsPayload = updatedRoom
        ? buildParticipantsPayload(
              updatedRoom.participants as unknown as RoomParticipant[],
              clients,
              data.room
          )
        : [];

    for (const connectedClient of clients) {
        if (connectedClient.roomId !== data.room) {
            continue;
        }

        send(connectedClient.socket, "room:participants", {
            room: data.room,
            participants: participantsPayload,
        });
    }

    broadcastParticipant(
        client,
        data,
        clients,
        "participant:leave",
        serializedLeavingUser
    );

    broadcastRoomUpdated(data.room, clients);

    console.log(
        `[WEBSOCKET] Usuário ${data.user} saiu da sala ${data.room}.`
    );
}

/**
 * Envia eventos de entrada/saída aos outros participantes.
 */
function broadcastParticipant(
    client: ConnectedClient,
    data: RoomJoinData,
    clients: Set<ConnectedClient>,
    event: "participant:join" | "participant:leave",
    user?: ParticipantUser
): void {
    for (const connectedClient of clients) {
        if (
            connectedClient === client ||
            connectedClient.roomId !== data.room
        ) {
            continue;
        }

        send(connectedClient.socket, event, {
            user: user ?? data.user,
            room: data.room,
        });
    }

    void realtimeBus.publish({
        event,
        data: { user: user ?? data.user, room: data.room },
        roomId: data.room,
    }).catch((error: unknown) => {
        console.error("[REALTIME BUS] Falha ao publicar evento de participante:", error);
    });
}

/**
 * Remove um participante da sala no MongoDB.
 * Preserva a conta e o histórico de mensagens.
 */
export async function removeParticipant(
    userId: string,
    roomId: string
): Promise<void> {
    const room = await roomModel.findById(roomId);

    if (!room) {
        return;
    }

    const nextParticipants = room.participants.filter(
        (participant: RoomParticipant) =>
            getParticipantUserId(participant.user) !== userId
    );

    // Não altera a sala se o participante já não estiver nela.
    if (nextParticipants.length === room.participants.length) {
        return;
    }

    let nextOwner = room.owner;
    let nextStatus = room.status;

    /**
     * Se o proprietário saiu, transfere a propriedade
     * para o participante mais antigo que permaneceu.
     */
    if (room.owner.toString() === userId) {
        const sortedParticipants = [...nextParticipants].sort(
            (a: RoomParticipant, b: RoomParticipant) =>
                new Date(a.joinedAt).getTime() -
                new Date(b.joinedAt).getTime()
        );

        const nextOwnerCandidate = sortedParticipants[0];

        if (nextOwnerCandidate) {
            nextOwner = nextOwnerCandidate.user;
        } else {
            nextStatus = "closed";
        }
    }

    if (nextParticipants.length === 0) {
        nextStatus = "closed";
    }

    await roomModel.findByIdAndUpdate(
        roomId,
        {
            participants: nextParticipants,
            owner: nextOwner,
            status: nextStatus,
        },
        {
            new: true,
            runValidators: true,
        }
    );
}


/** Expulsa um participante e valida no servidor se o solicitante é o proprietário. */
export async function kickParticipant(
    client: ConnectedClient,
    data: RoomJoinData,
    clients: Set<ConnectedClient>
): Promise<void> {
    const fail = (message: string) => send(client.socket, "room:kick:error", { message });
    if (!data?.room || !data?.user) return fail("Sala e participante são obrigatórios.");
    if (client.roomId !== data.room || !client.userId) return fail("Você não está conectado a esta sala.");
    const room = await roomModel.findById(data.room);
    if (!room) return fail("Sala não encontrada.");
    if (room.owner.toString() !== client.userId) return fail("Somente o proprietário pode remover participantes.");
    if (data.user === room.owner.toString()) return fail("O proprietário não pode remover a si mesmo.");
    const isParticipant = room.participants.some((p: RoomParticipant) => getParticipantUserId(p.user) === data.user);
    if (!isParticipant) return fail("Esse usuário não está mais na sala.");
    await removeParticipant(data.user, data.room);
    for (const target of clients) {
        if (target.userId !== data.user || target.roomId !== data.room) continue;
        send(target.socket, "room:kicked", { room: data.room, user: data.user, message: "Você foi removido desta sala pelo proprietário." });
        target.roomId = null;
        if (target.socket.readyState === WebSocket.OPEN) target.socket.close(4001, "Removido da sala");
    }
    for (const other of clients) {
        if (other.roomId === data.room) send(other.socket, "participant:leave", { room: data.room, user: data.user, reason: "kicked" });
    }
    void realtimeBus.publish({
        event: "participant:leave", data: { room: data.room, user: data.user, reason: "kicked" }, roomId: data.room,
    }).catch((error: unknown) => console.error("[REALTIME BUS] Falha ao publicar expulsão:", error));
    void realtimeBus.publish({
        event: "room:kicked",
        data: { room: data.room, user: data.user, message: "Você foi removido desta sala pelo proprietário." },
        roomId: data.room, targetUserId: data.user,
    }).catch((error: unknown) => console.error("[REALTIME BUS] Falha ao notificar usuário expulso:", error));
    await broadcastRoomParticipants(data.room, clients);
    send(client.socket, "room:kick:success", { room: data.room, user: data.user, message: "Participante removido da sala." });
    console.log(`[WEBSOCKET] Proprietário ${client.userId} removeu ${data.user} da sala ${data.room}.`);
}

/**
 * Remove um participante que ficou offline por 2 minutos.
 */
export async function removeOfflineParticipant(
    userId: string,
    roomId: string,
    clients: Set<ConnectedClient>
): Promise<void> {
    // Não remove se o usuário já tiver voltado à sala.
    const stillInRoom = [...clients].some(
        (client) =>
            client.userId === userId &&
            client.roomId === roomId &&
            client.socket.readyState === WebSocket.OPEN
    );

    if (stillInRoom) {
        return;
    }

    const room = await roomModel.findById(roomId);

    if (!room) {
        return;
    }

    const isParticipant = room.participants.some(
        (participant: RoomParticipant) =>
            getParticipantUserId(participant.user) === userId
    );

    if (!isParticipant) {
        return;
    }

    const leavingUser = await userModel.findById(userId);

    await removeParticipant(userId, roomId);

    const userPayload = leavingUser
        ? {
              _id: leavingUser._id.toString(),
              email: leavingUser.email,
              nickname: leavingUser.nickname,
              avatar: leavingUser.avatar ?? null,
              status: leavingUser.status,
          }
        : userId;

    for (const client of clients) {
        if (client.roomId !== roomId) {
            continue;
        }

        send(client.socket, "participant:leave", {
            user: userPayload,
            room: roomId,
            reason: "offline_timeout",
        });
    }

    await broadcastRoomParticipants(roomId, clients);

    console.log(
        `[WEBSOCKET] Usuário ${userId} removido da sala ${roomId} após 120 segundos offline.`
    );
}
