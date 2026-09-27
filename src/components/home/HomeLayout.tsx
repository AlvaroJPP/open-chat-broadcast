import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { CreateRoomCard } from "./CreateRoomCard";
import { HomeFooter } from "./HomeFooter";
import { HomeHeader } from "./HomeHeader";
import { JoinRoomCard } from "./JoinRoomCard";
import { RecentRoomsPanel } from "./RecentRoomsPanel";
import { WelcomeHero } from "./WelcomeHero";
import { createRoom, getRecentRooms, joinRoom } from "@/services/rooms-service";
import type { RecentRoomView } from "@/libs/db-types";

export function HomeLayout() {
    const navigate = useNavigate();

    const [recentRooms, setRecentRooms] = useState<RecentRoomView[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        getRecentRooms()
            .then((rooms) => {
                if (active) setRecentRooms(rooms);
            })
            .finally(() => {
                if (active) setLoadingRooms(false);
            });
        return () => {
            active = false;
        };
    }, []);

    async function handleCreateRoom() {
        setCreating(true);
        try {
            const room = await createRoom({ name: "Nova sala" });
            navigate({ to: "/rooms/$id", params: { id: room._id } });
        } finally {
            setCreating(false);
        }
    }

    async function handleJoinRoom(codeOrLink: string) {
        setJoining(true);
        setJoinError(null);
        try {
            const room = await joinRoom(codeOrLink);
            navigate({ to: "/rooms/$id", params: { id: room._id } });
        } catch (error) {
            setJoinError(error instanceof Error ? error.message : "Não foi possível entrar na sala.");
        } finally {
            setJoining(false);
        }
    }

    function handleSelectRecentRoom(roomId: string) {
        navigate({ to: "/rooms/$id", params: { id: roomId } });
    }

    return (
        <div className="flex h-screen flex-col bg-background">
            <HomeHeader />

            <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-8">
                    <WelcomeHero />

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <CreateRoomCard onCreate={handleCreateRoom} loading={creating} />
                        <JoinRoomCard onJoin={handleJoinRoom} loading={joining} error={joinError} />
                    </div>
                </div>

                <RecentRoomsPanel rooms={recentRooms} loading={loadingRooms} onSelectRoom={handleSelectRecentRoom} />
            </main>

            {/* <HomeFooter /> */}
        </div>
    );
}