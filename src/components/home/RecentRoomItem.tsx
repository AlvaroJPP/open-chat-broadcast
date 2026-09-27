import { CalendarDays, ChevronRight, Gamepad2, MessageSquareCode, Users } from "lucide-react";

import type { RecentRoomView } from "@/lib/db-types";

const iconByType = {
    code: MessageSquareCode,
    people: Users,
    game: Gamepad2,
};

const statusLabel: Record<RecentRoomView["status"], string> = {
    active: "Ativa",
    waiting: "Aguardando",
    closed: "Encerrada",
};

const statusDotClass: Record<RecentRoomView["status"], string> = {
    active: "bg-success",
    waiting: "bg-accent",
    closed: "bg-muted-foreground",
};

function formatAccessDate(iso: string) {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (isSameDay(date, today)) return `Hoje, ${time}`;
    if (isSameDay(date, yesterday)) return `Ontem, ${time}`;
    return date.toLocaleDateString("pt-BR");
}

interface RecentRoomItemProps {
    room: RecentRoomView;
    onSelect?: (roomId: string) => void;
}

export function RecentRoomItem({ room, onSelect }: RecentRoomItemProps) {
    const Icon = iconByType[room.icon];

    return (
        <button
            type="button"
            onClick={() => onSelect?.(room.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3 py-3 text-left transition-colors hover:bg-secondary/50"
        >
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${room.iconColorClass}`}>
                <Icon className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{room.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{room.shortCode}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs">
                    <span className={`size-1.5 rounded-full ${statusDotClass[room.status]}`} />
                    <span className="text-muted-foreground">{statusLabel[room.status]}</span>
                </span>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {formatAccessDate(room.lastAccessedAt)}
                </span>
                <ChevronRight className="size-4" />
            </div>
        </button>
    );
}