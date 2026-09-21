import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatMessageData } from "@/lib/types";

interface ChatMessageProps {
    message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
    return (
        <div className="flex gap-3 px-1">
            <Avatar className="size-9 shrink-0">
                <AvatarFallback className={message.author.avatarColor}>
                    {message.author.name.slice(0, 1)}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">{message.author.name}</span>
                    <span className="text-xs text-muted-foreground">{message.time}</span>
                </div>
                <p className="break-words text-sm text-foreground/90">{message.text}</p>
            </div>
        </div>
    );
}