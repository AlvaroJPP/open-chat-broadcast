import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatMessageData } from "@/lib/types";

interface ChatMessageProps {
    message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
    return (
        <div className="flex gap-2.5">
            <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-muted text-[13px] font-bold text-foreground">
                    {message.author.name.slice(0, 1).toLowerCase()}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold">{message.author.name}</span>
                    <span className="text-xs text-muted-foreground">{message.time}</span>
                </div>
                <p className="break-words text-sm">{message.text}</p>
            </div>
        </div>
    );
}
