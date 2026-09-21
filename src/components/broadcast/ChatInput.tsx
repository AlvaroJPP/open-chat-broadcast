import { useState, type FormEvent } from "react";
import { Send, Smile } from "lucide-react";

import { Button } from "@/components/ui/button";

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
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-input bg-secondary/40 px-3 py-2.5">
                <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                    type="button"
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Inserir emoji"
                >
                    <Smile className="size-4" />
                </button>
            </div>
            <Button type="submit" variant="success" size="icon" className="rounded-xl" aria-label="Enviar mensagem">
                <Send className="size-4" />
            </Button>
        </form>
    );
}