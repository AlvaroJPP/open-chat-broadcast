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
};

type ApiParticipant = {
    user: string | ApiUser;
    joinedAt: string;
    online?: boolean;
};

type ApiRoom = {
    _id: string;
    name: string;

    owner:
        | string
        | ApiUser;

    participants: ApiParticipant[];

    status: "waiting" | "active" | "closed";
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

        const participantName =
            user?.nickname ??
            user?.email ??
            `Usuário ${userId.slice(-4)}`;

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

            micMuted: false,

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
            user.nickname ??
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

            const joinResponse =
                await fetch(
                    `${API_BASE_URL}/rooms/${id}/join`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            user: currentUserId,
                        }),
                    }
                );

            if (
                !joinResponse.ok &&
                joinResponse.status !== 409
            ) {
                const joinData =
                    (await joinResponse
                        .json()
                        .catch(() => null)) as
                        | ApiResponse<unknown>
                        | null;

                throw new Error(
                    joinData?.error?.message ??
                        `Não foi possível entrar na sala. HTTP ${joinResponse.status}`
                );
            }

            const roomResponse =
                await fetch(
                    `${API_BASE_URL}/rooms/${id}`
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
                    `${window.location.origin}/rooms/${data._id}`,
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
                    `${API_BASE_URL}/rooms/${id}/messages`
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
        />
    );
}