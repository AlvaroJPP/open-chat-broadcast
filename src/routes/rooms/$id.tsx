import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RoomLayout } from "@/components/broadcast/RoomLayout";
import { mockMessages } from "@/lib/mock-data";
import { getCurrentUserId } from "@/lib/current-user";
import type { Participant, RoomInfo } from "@/lib/types";

type ApiParticipant = {
  user: string | {
    _id: string;
    username?: string;
    nickname?: string;
    avatar?: string | null;
    status?: string;
  };
  joinedAt: string;
};

type ApiRoom = {
  _id: string;
  name: string;
  owner: string | {
    _id: string;
    username?: string;
    nickname?: string;
    avatar?: string | null;
  };
  participants: ApiParticipant[];
  status: "waiting" | "active" | "closed";
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    status: number;
    message: string;
  };
};

export const Route = createFileRoute("/rooms/$id")({
  component: RoomPage,
});

function RoomPage() {
  const { id } = Route.useParams();

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);

        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
          throw new Error(
            "Usuário atual não definido."
          );
        }

        const response = await fetch(
          `/api/rooms/${id}`
        );

        if (!response.ok) {
          throw new Error(
            `Não foi possível carregar a sala. HTTP ${response.status}`
          );
        }

        const responseData =
          (await response.json()) as ApiResponse<ApiRoom>;

        if (!responseData.success || !responseData.data) {
          throw new Error(
            responseData.error?.message ??
            "Resposta inválida da API."
          );
        }

        const data = responseData.data;

        if (cancelled) {
          return;
        }

        const ownerId =
          typeof data.owner === "string"
            ? data.owner
            : data.owner._id;

        const roomInfo: RoomInfo = {
          id: data._id,
          name: data.name,
          isLive: data.status === "active",
          inviteUrl:
            `${window.location.origin}/rooms/${data._id}`,
        };

        const roomParticipants: Participant[] =
          data.participants.map((participant) => {
            const user =
              typeof participant.user === "string"
                ? null
                : participant.user;

            const userId =
              typeof participant.user === "string"
                ? participant.user
                : participant.user._id;

            return {
              id: userId,

              name:
                user?.nickname ??
                user?.username ??
                `Usuário ${userId.slice(-4)}`,

              isYou:
                userId === currentUserId,

              status:
                userId === ownerId
                  ? "transmitindo"
                  : "assistindo",

              avatarColor: "bg-primary",

              micMuted: false,

              isSharingScreen:
                userId === ownerId,
            };
          });

        setRoom(roomInfo);
        setParticipants(roomParticipants);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "[ROOM] Erro ao carregar sala:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar a sala."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRoom();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Carregando sala...
        </p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Não foi possível carregar a sala
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? "Sala não encontrada."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoomLayout
      room={room}
      participants={participants}
      messages={mockMessages}
    />
  );
}