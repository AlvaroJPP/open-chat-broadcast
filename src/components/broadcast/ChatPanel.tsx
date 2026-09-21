import { useEffect, useRef, useState } from "react";
import { Bell, MessageCircle, PanelRightClose } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessageData, Participant } from "@/lib/types";

interface ChatPanelProps {
    messages: ChatMessageData[];
    currentUser: Participant;
    onClose?: () => void;
}

export function ChatPanel({ messages: initialMessages, currentUser, onClose }: ChatPanelProps) {
    const [messages, setMessages] = useState(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [messages.length]);

    function handleSend(text: string) {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

        setMessages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                author: { id: currentUser.id, name: currentUser.name, avatarColor: currentUser.avatarColor },
                time,
                text,
            },
        ]);
    }

    return (
        <section className="flex w-full flex-col rounded-2xl border border-border bg-card lg:w-96">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
                <MessageCircle className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Chat</h2>
                <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                    <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label="Notificações"
                    >
                        <Bell className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label="Recolher chat"
                    >
                        <PanelRightClose className="size-4" />
                    </button>
                </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-4 p-4">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            <ChatInput onSend={handleSend} />
        </section>
    );
}