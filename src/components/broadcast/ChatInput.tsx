import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
    onSend: (text: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
    const [value, setValue] = useState("");

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setValue("");
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 px-3.5 pb-3.5 pt-2">
            <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Digite uma mensagem…"
                aria-label="Mensagem"
                className="h-11 min-w-0 flex-1 border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
                type="submit"
                aria-label="Enviar mensagem"
                className="flex size-11 shrink-0 items-center justify-center bg-primary text-primary-foreground hover:opacity-90"
            >
                <Send className="size-5" />
            </button>
        </form>
    );
}
