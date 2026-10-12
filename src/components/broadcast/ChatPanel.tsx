
import { useEffect, useRef, useState } from "react";

import { BroadcastWebSocket } from "@/lib/websocket";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessageData, Participant } from "@/lib/types";

interface ChatPanelProps {
    messages: ChatMessageData[];
    currentUser: Participant;
    roomId: string;
    userId: string;
    onClose?: () => void;
}

type IncomingMessage = {
    _id?: string;
    user?: string | {
        _id?: string;
        nickname?: string;
        email?: string;
        avatar?: string | null;
    };
    content?: string;
    createdAt?: string;
    room?: string;
};

function normalizeIncomingMessage(
    rawMessage: unknown,
): ChatMessageData | null {
    if (!rawMessage || typeof rawMessage !== "object") {
        return null;
    }

    const message = rawMessage as IncomingMessage;

    const user =
        typeof message.user === "string" ? null : message.user;

    const authorId =
        typeof message.user === "string"
            ? message.user
            : user?._id ?? "unknown";

    const authorName =
        user?.nickname ?? user?.email ?? "Usuário";

    const parsedDate = message.createdAt
        ? new Date(message.createdAt)
        : new Date();

    const time = Number.isNaN(parsedDate.getTime())
        ? "agora"
        : parsedDate.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
          });

    return {
        id: message._id ?? `incoming-${authorId}-${parsedDate.getTime()}`,
        author: {
            id: authorId,
            name: authorName,
            avatarColor: "bg-primary",
        },
        time,
        text: message.content ?? "",
    };
}

function mergeMessages(
    current: ChatMessageData[],
    incoming: ChatMessageData[],
): ChatMessageData[] {
    const result = [...current];
    const knownIds = new Set(result.map((message) => message.id));

    for (const message of incoming) {
        if (knownIds.has(message.id)) {
            continue;
        }

        /*
         * Substitui uma mensagem otimista enviada localmente
         * quando o servidor retorna a mensagem persistida.
         */
        const optimisticIndex = result.findIndex(
            (existing) =>
                existing.id.startsWith("local-") &&
                existing.author.id === message.author.id &&
                existing.text === message.text,
        );

        if (optimisticIndex !== -1) {
            const optimistic = result[optimisticIndex];

            result[optimisticIndex] = {
                ...message,
                author: {
                    ...message.author,
                    name:
                        message.author.name === "Usuário"
                            ? optimistic.author.name
                            : message.author.name,
                },
            };

            knownIds.add(message.id);
            continue;
        }

        result.push(message);
        knownIds.add(message.id);
    }

    return result;
}

export function ChatPanel({
    messages: initialMessages,
    currentUser,
    roomId,
    userId,
    onClose,
}: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessageData[]>(
        initialMessages,
    );

    const websocketRef = useRef<BroadcastWebSocket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const activeRoomRef = useRef(roomId);
    const activeUserRef = useRef(userId);

    useEffect(() => {
        activeRoomRef.current = roomId;
        activeUserRef.current = userId;
    }, [roomId, userId]);

    /*
     * Sincroniza o histórico sem apagar mensagens recebidas
     * pelo socket enquanto a requisição HTTP estava em andamento.
     */
    useEffect(() => {
        setMessages((current) =>
            mergeMessages(current, initialMessages),
        );
    }, [initialMessages]);

    useEffect(() => {
        if (!roomId || !userId) {
            return;
        }

        let disposed = false;
        let unsubscribe: (() => void) | undefined;

        const websocket = new BroadcastWebSocket();
        websocketRef.current = websocket;

        /*
         * O listener é registrado antes da conexão e antes
         * de enviar room:join, evitando perder eventos iniciais.
         */
        unsubscribe = websocket.onMessage((message) => {
            if (disposed) {
                return;
            }

            if (
                message.event === "message:error" ||
                message.event === "room:error"
            ) {
                const data = message.data as {
                    message?: string;
                };

                console.error(
                    "[CHAT] Erro do servidor:",
                    data?.message ?? message.event,
                );

                return;
            }

            if (message.event === "message:new") {
                const normalized = normalizeIncomingMessage(
                    message.data,
                );

                if (!normalized) {
                    console.warn(
                        "[CHAT] Mensagem recebida em formato inválido.",
                        message.data,
                    );
                    return;
                }

                setMessages((current) =>
                    mergeMessages(current, [normalized]),
                );
            }
        });

        async function connect() {
            try {
                await websocket.connect();

                if (disposed) {
                    return;
                }

                websocket.send("room:join", {
                    user: userId,
                    room: roomId,
                });

                console.log(
                    `[CHAT] Conectado à sala ${roomId}.`,
                );
            } catch (error) {
                if (!disposed) {
                    console.error(
                        "[CHAT] Falha ao conectar:",
                        error,
                    );
                }
            }
        }

        void connect();

        return () => {
            disposed = true;
            unsubscribe?.();

            websocket.disconnect();

            if (websocketRef.current === websocket) {
                websocketRef.current = null;
            }
        };
    }, [roomId, userId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            block: "end",
            behavior: "smooth",
        });
    }, [messages.length]);

    function handleSend(text: string) {
        const trimmedText = text.trim();

        if (!trimmedText) {
            return;
        }

        const websocket = websocketRef.current;

        if (!websocket?.connected) {
            console.error(
                "[CHAT] Mensagem não enviada: WebSocket desconectado.",
            );
            return;
        }

        const now = new Date();

        const optimisticMessage: ChatMessageData = {
            id: `local-${now.getTime()}-${Math.random()
                .toString(16)
                .slice(2)}`,
            author: {
                id: currentUser.id,
                name: currentUser.name,
                avatarColor: currentUser.avatarColor,
            },
            time: now.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            text: trimmedText,
        };

        /*
         * Mostra a mensagem imediatamente.
         * A versão persistida será recebida em message:new.
         */
        setMessages((current) => [
            ...current,
            optimisticMessage,
        ]);

        websocket.send("message:send", {
            user: activeUserRef.current,
            room: activeRoomRef.current,
            content: trimmedText,
            type: "text",
        });
    }

    return (
        <section className="flex min-h-0 w-full flex-col border border-border bg-card lg:w-80">
            <div className="px-3.5 pt-3.5">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Chat
                </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 p-3.5">
                    {messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                        />
                    ))}

                    <div ref={bottomRef} />
                </div>
            </div>

            <ChatInput onSend={handleSend} />
        </section>
    );
}