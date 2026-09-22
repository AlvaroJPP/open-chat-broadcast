import { Clock } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { RecentRoomItem } from "./RecentRoomItem";
import type { RecentRoomView } from "@/lib/db-types";

interface RecentRoomsPanelProps {
    rooms: RecentRoomView[];
    loading?: boolean;
    onSelectRoom?: (roomId: string) => void;
}

export function RecentRoomsPanel({ rooms, loading, onSelectRoom }: RecentRoomsPanelProps) {
    return (
        <section className="flex w-full flex-col rounded-2xl border border-border bg-card lg:w-[26rem]">
            <div className="flex items-start gap-3 border-b border-border px-5 py-4">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Minhas salas recentes</h2>
                    <p className="text-xs text-muted-foreground">Acesse rapidamente as salas que você participou.</p>
                </div>
            </div>

            <ScrollArea className="max-h-[30rem]">
                <div className="flex flex-col gap-2 p-4">
                    {loading && <p className="px-1 text-sm text-muted-foreground">Carregando salas...</p>}

                    {!loading && rooms.length === 0 && (
                        <p className="px-1 text-sm text-muted-foreground">Você ainda não participou de nenhuma sala.</p>
                    )}

                    {!loading &&
                        rooms.map((room) => <RecentRoomItem key={room.id} room={room} onSelect={onSelectRoom} />)}
                </div>
            </ScrollArea>
        </section>
    );
}