import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { RoomLayout } from "@/components/broadcast/RoomLayout";
import { getCurrentUserId } from "@/lib/current-user";
import { API_BASE_URL } from "@/lib/config";
import { BroadcastWebSocket } from "@/lib/websocket";
import type {
    ChatMessageData,
    Participant,
    RoomInfo,
} from "@/lib/types";

type ApiUser = {
    _id: string;
    email?: string;
    nickname?: string;
    avatar?: string | null;
    status?: string;
    isGuest?: boolean;
};

type ApiParticipant = {
    user: string | ApiUser;
    joinedAt: string;
    online?: boolean;
    muted?: boolean;
};

type ApiRoom = {
    _id: string;
    name: string;

    owner:
        | string
        | ApiUser;

    participants: ApiParticipant[];

    status: "waiting" | "active" | "closed";
    inviteCode?: string;
};

type ApiMessage = {
    _id: string;

    user:
        | string
        | ApiUser;

    content: string;

    type:
        | "text"
        | "image"
        | "video"
        | "audio"
        | "document"
        | "system";

    createdAt: string;

    room?: string;
};

type ApiResponse<T> = {
    success: boolean;
    data: T;
    error?: {
        status: number;
        message: string;
    };
};

export const Route = createFileRoute("/rooms/$id")({
    component: RoomPage,
});

function normalizeParticipants(
    rawParticipants: ApiParticipant[] | undefined,
    currentUserId: string,
    ownerId?: string | null
): Participant[] {
    if (!rawParticipants) {
        return [];
    }

    return rawParticipants.map((participant) => {
        const user =
            typeof participant.user === "string"
                ? null
                : participant.user;

        const userId =
            typeof participant.user === "string"
                ? participant.user
                : participant.user._id;

        const baseName =
            user?.nickname ??
            user?.email ??
            `Usuário ${userId.slice(-4)}`;
        const participantName = user?.isGuest ? `${baseName} (convidado)` : baseName;

        return {
            id: userId,

            name: participantName,

            isYou:
                userId === currentUserId,

            isHost:
                !!ownerId && userId === ownerId,

            status:
                user?.status === "offline"
                    ? "ausente"
                    : "assistindo",

            avatarColor: "bg-primary",

            micMuted: participant.muted === true,

            isSharingScreen: false,
        };
    });
}

function getUserId(
    user: string | ApiUser | undefined
): string | null {
    if (!user) {
        return null;
    }

    if (typeof user === "string") {
        return user;
    }

    return user._id;
}

function getUserName(
    user: string | ApiUser | undefined,
    fallbackId?: string
): string {
    if (
        user &&
        typeof user !== "string"
    ) {
        return (
            user.isGuest && user.nickname
                ? `${user.nickname} (convidado)`
                : user.nickname ??
            user.email ??
            (fallbackId
                ? `Usuário ${fallbackId.slice(-4)}`
                : "Usuário")
        );
    }

    if (fallbackId) {
        return `Usuário ${fallbackId.slice(-4)}`;
    }

    return "Usuário";
}

function RoomPage() {
    // ID do dono da sala (anfitrião), usado para a coroa na lista.
    const ownerIdRef = useRef<string | null>(null);
    const websocketRef = useRef<BroadcastWebSocket | null>(null);

    const { id } = Route.useParams();

    const [room, setRoom] =
        useState<RoomInfo | null>(null);

    const [participants, setParticipants] =
        useState<Participant[]>([]);

    const [messages, setMessages] =
        useState<ChatMessageData[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadRoom = async () => {
        try {
            setLoading(true);
            setError(null);

            const currentUserId =
                getCurrentUserId();

            if (!currentUserId) {
                setLoading(false);
                setError(
                    "Faça login para acessar esta sala."
                );
                return;
            }

            // Participantes temporários já são adicionados à sala pelo endpoint
            // /rooms/guest-join. Não devem chamar /:id/join, reservado a contas registradas.
            const storedUser = JSON.parse(
                localStorage.getItem("currentUser") ?? "null"
            ) as { isGuest?: boolean } | null;
            const isGuest = storedUser?.isGuest === true;

            if (!isGuest) {
                const joinResponse = await fetch(
                    `${API_BASE_URL}/rooms/${id}/join`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            user: currentUserId,
                        }),
                    }
                );

                if (!joinResponse.ok && joinResponse.status !== 409) {
                    const joinData = (await joinResponse
                        .json()
                        .catch(() => null)) as ApiResponse<unknown> | null;

                    throw new Error(
                        joinData?.error?.message ??
                            `Não foi possível entrar na sala. HTTP ${joinResponse.status}`
                    );
                }
            }

            const roomResponse =
                await fetch(
                    `${API_BASE_URL}/rooms/${id}`,
                    { credentials: "include" }
                );

            if (!roomResponse.ok) {
                throw new Error(
                    `Não foi possível carregar a sala. HTTP ${roomResponse.status}`
                );
            }

            const roomResponseData =
                (await roomResponse.json()) as
                    ApiResponse<ApiRoom>;

            if (
                !roomResponseData.success ||
                !roomResponseData.data
            ) {
                throw new Error(
                    roomResponseData.error?.message ??
                        "Resposta inválida da API."
                );
            }

            const data =
                roomResponseData.data;

            const roomInfo: RoomInfo = {
                id: data._id,

                name: data.name,

                isLive:
                    data.status === "active",

                inviteUrl:
                    data.inviteCode ?? "",
            };

            const roomParticipants =
                normalizeParticipants(
                    data.participants,
                    currentUserId,
                    getUserId(data.owner)
                );

            ownerIdRef.current =
                getUserId(data.owner);

            const messagesResponse =
                await fetch(
                    `${API_BASE_URL}/rooms/${id}/messages`,
                    { credentials: "include" }
                );

            if (!messagesResponse.ok) {
                throw new Error(
                    `Não foi possível carregar as mensagens. HTTP ${messagesResponse.status}`
                );
            }

            const messagesResponseData =
                (await messagesResponse.json()) as
                    ApiResponse<ApiMessage[]>;

            if (
                !messagesResponseData.success
            ) {
                throw new Error(
                    messagesResponseData.error?.message ??
                        "Não foi possível carregar as mensagens."
                );
            }

            const apiMessages =
                messagesResponseData.data ?? [];

            const roomMessages: ChatMessageData[] =
                apiMessages.map(
                    (message) => {
                        const userId =
                            getUserId(
                                message.user
                            ) ??
                            "unknown-user";

                        const participant =
                            roomParticipants.find(
                                (item) =>
                                    item.id ===
                                    userId
                            );

                        const authorName =
                            getUserName(
                                message.user,
                                userId
                            );

                        return {
                            id: message._id,

                            author: {
                                id: userId,

                                name:
                                    authorName,

                                avatarColor:
                                    participant?.avatarColor ??
                                    "bg-primary",
                            },

                            time:
                                new Date(
                                    message.createdAt
                                ).toLocaleTimeString(
                                    "pt-BR",
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                ),

                            text:
                                message.content,
                        };
                    }
                );

            setRoom(roomInfo);

            setParticipants(
                roomParticipants
            );

            setMessages(
                roomMessages
            );
        } catch (err) {
            console.error(
                "[ROOM] Erro ao carregar sala:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Erro ao carregar a sala."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const runLoad = async () => {
            if (cancelled) {
                return;
            }

            await loadRoom();
        };

        void runLoad();

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        const currentUserId =
            getCurrentUserId();

        if (
            !currentUserId ||
            !id ||
            !room?.id
        ) {
            return;
        }

        const safeCurrentUserId =
            currentUserId;

        const websocket =
            new BroadcastWebSocket();
        websocketRef.current = websocket;

        let unsubscribe:
            | (() => void)
            | null = null;

        async function connect() {
            try {
                await websocket.connect();

                websocket.send(
                    "room:join",
                    {
                        user:
                            safeCurrentUserId,

                        room: id,
                    }
                );

                unsubscribe =
                    websocket.onMessage(
                        (message) => {
                            if (message.event === "room:joined") {
                                const payload = message.data as { room?: string; user?: { _id?: string } | string };
                                const authenticatedId = typeof payload.user === "string"
                                    ? payload.user
                                    : payload.user?._id;
                                if (payload.room === id && authenticatedId && authenticatedId !== safeCurrentUserId) {
                                    try {
                                        const stored = JSON.parse(localStorage.getItem("currentUser") ?? "null") as Record<string, unknown> | null;
                                        if (stored) {
                                            localStorage.setItem("currentUser", JSON.stringify({
                                                ...stored,
                                                _id: authenticatedId,
                                            }));
                                            // Recarrega os dados da sala com a identidade que o servidor autenticou.
                                            window.location.reload();
                                        }
                                    } catch (error) {
                                        console.error("[AUTH] Não foi possível sincronizar a identidade autenticada:", error);
                                    }
                                }
                                return;
                            }

                            if (message.event === "room:kicked") {
                                const payload = message.data as { room?: string; message?: string };
                                if (!payload.room || payload.room === id) {
                                    window.alert(payload.message ?? "Você foi removido desta sala.");
                                    window.location.assign("/rooms");
                                }
                                return;
                            }

                            if (message.event === "room:kick:success") {
                                const payload = message.data as { message?: string };
                                window.alert(payload.message ?? "Participante removido da sala.");
                                return;
                            }

                            if (message.event === "room:kick:error") {
                                const payload = message.data as { message?: string };
                                window.alert(payload.message ?? "Não foi possível remover o participante.");
                                return;
                            }

                            if (message.event === "room:owner:updated") {
                                const payload = message.data as { room?: string; owner?: string };
                                if (payload.room === id && payload.owner) {
                                    ownerIdRef.current = payload.owner;
                                    setParticipants(previous => previous.map(participant => ({
                                        ...participant,
                                        isHost: participant.id === payload.owner,
                                    })));
                                }
                                return;
                            }

                            if (message.event === "room:owner:success" || message.event === "room:mute:success") {
                                const payload = message.data as { message?: string };
                                window.alert(payload.message ?? "Alteração realizada.");
                                return;
                            }

                            if (message.event === "room:owner:error" || message.event === "room:mute:error") {
                                const payload = message.data as { message?: string };
                                window.alert(payload.message ?? "Não foi possível realizar a alteração.");
                                return;
                            }

                            /*
                             * Lista completa de participantes.
                             */
                            if (
                                message.event ===
                                "room:participants"
                            ) {
                                const payload =
                                    message.data as {
                                        participants?: ApiParticipant[];
                                    };

                                const nextParticipants =
                                    normalizeParticipants(
                                        payload.participants,
                                        safeCurrentUserId,
                                        ownerIdRef.current
                                    );

                                setParticipants(
                                    nextParticipants
                                );

                                return;
                            }

                            /*
                             * Novo participante.
                             *
                             * O backend agora pode
                             * enviar:
                             *
                             * user: {
                             *   _id,
                             *   nickname,
                             *   email
                             * }
                             *
                             * em vez de apenas o ID.
                             */
                            if (
                                message.event ===
                                "participant:join"
                            ) {
                                const payload =
                                    message.data as {
                                        user?:
                                            | string
                                            | ApiUser;

                                        room?: string;
                                    };

                                const rawUser =
                                    payload.user;

                                const targetUserId =
                                    getUserId(
                                        rawUser
                                    );

                                if (
                                    !targetUserId
                                ) {
                                    return;
                                }

                                const targetName =
                                    getUserName(
                                        rawUser,
                                        targetUserId
                                    );

                                setParticipants(
                                    (previous) => {
                                        const existing =
                                            previous.find(
                                                (
                                                    participant
                                                ) =>
                                                    participant.id ===
                                                    targetUserId
                                            );

                                        /*
                                         * Se o usuário já
                                         * existe, atualiza
                                         * o nome caso o
                                         * backend tenha
                                         * enviado o
                                         * nickname.
                                         */
                                        if (
                                            existing
                                        ) {
                                            return previous.map(
                                                (
                                                    participant
                                                ) =>
                                                    participant.id ===
                                                    targetUserId
                                                        ? {
                                                              ...participant,

                                                              name:
                                                                  targetName,
                                                          }
                                                        : participant
                                            );
                                        }

                                        return [
                                            ...previous,

                                            {
                                                id:
                                                    targetUserId,

                                                name:
                                                    targetName,

                                                isYou:
                                                    targetUserId ===
                                                    safeCurrentUserId,

                                                status:
                                                    "assistindo",

                                                avatarColor:
                                                    "bg-primary",

                                                micMuted:
                                                    false,

                                                isSharingScreen:
                                                    false,
                                            },
                                        ];
                                    }
                                );

                                return;
                            }

                            /*
                             * Participante saiu.
                             */
                            if (
                                message.event ===
                                "participant:leave"
                            ) {
                                const payload =
                                    message.data as {
                                        user?:
                                            | string
                                            | ApiUser;

                                        room?: string;
                                    };

                                const targetUserId =
                                    getUserId(
                                        payload.user
                                    );

                                if (
                                    !targetUserId
                                ) {
                                    return;
                                }

                                setParticipants(
                                    (previous) =>
                                        previous.filter(
                                            (
                                                participant
                                            ) =>
                                                participant.id !==
                                                targetUserId
                                        )
                                );
                            }
                        }
                    );
            } catch (error) {
                console.error(
                    "[ROOM] Falha ao conectar o WebSocket da sala:",
                    error
                );
            }
        }

        void connect();

        return () => {
            unsubscribe?.();

            if (websocketRef.current === websocket) websocketRef.current = null;
            websocket.disconnect();
        };
    }, [id, room?.id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Carregando sala...
                </p>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <h1 className="text-lg font-semibold text-foreground">
                        Não foi possível carregar a sala
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        {error ??
                            "Sala não encontrada."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <RoomLayout
            room={room}
            participants={participants}
            messages={messages}
            onKickParticipant={(participantId) => {
                websocketRef.current?.send("room:kick", { room: id, user: participantId });
            }}
            onTransferOwnership={(participantId) => {
                if (window.confirm("Transferir a propriedade da sala para este participante? Você deixará de ser o proprietário.")) {
                    websocketRef.current?.send("room:owner:transfer", { room: id, user: participantId });
                }
            }}
            onToggleMuteParticipant={(participantId, muted) => {
                websocketRef.current?.send("room:mute", { room: id, user: participantId, muted });
            }}
        />
    );
}