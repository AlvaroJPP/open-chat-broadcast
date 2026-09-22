import { useState, type FormEvent } from "react";
import { ArrowRight, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface JoinRoomCardProps {
    onJoin: (codeOrLink: string) => Promise<void> | void;
    loading?: boolean;
    error?: string | null;
}

export function JoinRoomCard({ onJoin, loading, error }: JoinRoomCardProps) {
    const [value, setValue] = useState("");

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!value.trim()) return;
        onJoin(value.trim());
    }

    return (
        <section className="flex flex-1 flex-col rounded-2xl border border-border bg-card p-6">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Link2 className="size-6" />
            </span>

            <h2 className="mt-4 text-lg font-semibold text-foreground">Entrar em uma sala</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Já tem um link ou número de sala? Digite abaixo para entrar.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col justify-end gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-input bg-secondary/40 px-3 py-2.5">
                    <Link2 className="size-4 shrink-0 text-muted-foreground" />
                    <input
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder="Link ou número da sala"
                        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <Button type="submit" size="lg" className="w-full bg-[oklch(0.55_0.16_255)] text-white hover:bg-[oklch(0.55_0.16_255)]/90" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar na sala"}
                    <ArrowRight className="size-4" />
                </Button>
            </form>
        </section>
    );
}