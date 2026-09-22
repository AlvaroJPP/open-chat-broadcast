import { Plus, ScreenShare } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CreateRoomCardProps {
    onCreate: () => Promise<void> | void;
    loading?: boolean;
}

export function CreateRoomCard({ onCreate, loading }: CreateRoomCardProps) {
    return (
        <section className="flex flex-1 flex-col rounded-2xl border border-border bg-card p-6">
            <span className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
                <Plus className="size-6" />
            </span>

            <h2 className="mt-4 text-lg font-semibold text-foreground">Criar uma sala</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">
                Inicie uma nova sala de transmissão e convide seus amigos.
            </p>

            <Button variant="success" size="lg" className="mt-5 w-full" onClick={onCreate} disabled={loading}>
                <ScreenShare className="size-4" />
                {loading ? "Criando..." : "Criar sala"}
            </Button>
        </section>
    );
}