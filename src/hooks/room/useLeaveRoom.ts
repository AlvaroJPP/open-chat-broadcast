import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { API_BASE_URL } from "@/lib/config";

interface UseLeaveRoomProps {
    roomId: string;
    userId: string;
    stopAllMedia: () => void;
}

export function useLeaveRoom({
    roomId,
    userId,
    stopAllMedia,
}: UseLeaveRoomProps) {
    const navigate = useNavigate();
    const [isLeaving, setIsLeaving] = useState(false);

    const handleLeave = async () => {
        if (isLeaving) return;

        setIsLeaving(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/rooms/${roomId}/leave`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user: userId,
                    }),
                },
            );

            if (!response.ok && response.status !== 404) {
                const result = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    result?.error?.message ??
                        "Não foi possível sair da sala.",
                );
            }

            stopAllMedia();

            await navigate({ to: "/rooms" });
        } catch (error) {
            console.error(
                "[ROOM] Erro ao sair da sala:",
                error,
            );

            await navigate({ to: "/rooms" });
        } finally {
            setIsLeaving(false);
        }
    };

    return {
        handleLeave,
        isLeaving,
    };
}