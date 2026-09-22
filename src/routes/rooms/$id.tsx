import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RoomLayout } from "@/components/broadcast/RoomLayout";
import { getCurrentUserId } from "@/lib/current-user";
import type {
  ChatMessageData,
  Participant,
  RoomInfo,
} from "@/lib/types";

type ApiParticipant = {
  user:
    | string
    | {
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

  owner:
    | string
    | {
        _id: string;
        username?: string;
        nickname?: string;
        avatar?: string | null;
      };

  participants: ApiParticipant[];

  status: "waiting" | "active" | "closed";
};

type ApiMessage = {
  _id: string;

  user:
    | string
    | {
        _id: string;
        username?: string;
        nickname?: string;
        avatar?: string | null;
      };

  content: string;

  type:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "document"
    | "system";

  createdAt: string;

  room?: string;
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

  const [room, setRoom] =
    useState<RoomInfo | null>(null);

  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [messages, setMessages] =
    useState<ChatMessageData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);

        const currentUserId =
          getCurrentUserId();

        if (!currentUserId) {
          throw new Error(
            "Usuário atual não definido."
          );
        }

        /*
         * ==========================
         * CARREGAR SALA
         * ==========================
         */

        const roomResponse =
          await fetch(`/api/rooms/${id}`);

        if (!roomResponse.ok) {
          throw new Error(
            `Não foi possível carregar a sala. HTTP ${roomResponse.status}`
          );
        }

        const roomResponseData =
          (await roomResponse.json()) as ApiResponse<ApiRoom>;

        if (
          !roomResponseData.success ||
          !roomResponseData.data
        ) {
          throw new Error(
            roomResponseData.error?.message ??
              "Resposta inválida da API."
          );
        }

        const data =
          roomResponseData.data;

        if (cancelled) {
          return;
        }

        /*
         * ==========================
         * DONO DA SALA
         * ==========================
         */

        const ownerId =
          typeof data.owner === "string"
            ? data.owner
            : data.owner._id;

        /*
         * ==========================
         * DADOS DA SALA
         * ==========================
         */

        const roomInfo: RoomInfo = {
          id: data._id,
          name: data.name,
          isLive:
            data.status === "active",
          inviteUrl:
            `${window.location.origin}/rooms/${data._id}`,
        };

        /*
         * ==========================
         * PARTICIPANTES
         * ==========================
         */

        const roomParticipants:
          Participant[] =
          data.participants.map(
            (participant) => {
              const user =
                typeof participant.user ===
                "string"
                  ? null
                  : participant.user;

              const userId =
                typeof participant.user ===
                "string"
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
                  user?.status === "offline"
                    ? "ausente"
                    : "assistindo",

                avatarColor:
                  "bg-primary",

                micMuted: false,

                /*
                 * Não vamos mais fingir que
                 * o dono está transmitindo.
                 *
                 * O estado real de compartilhamento
                 * será controlado pelo WebRTC.
                 */
                isSharingScreen:
                  false,
              };
            }
          );

        /*
         * ==========================
         * CARREGAR MENSAGENS
         * ==========================
         */

        const messagesResponse =
          await fetch(
            `/api/rooms/${id}/messages`
          );

        if (!messagesResponse.ok) {
          throw new Error(
            `Não foi possível carregar as mensagens. HTTP ${messagesResponse.status}`
          );
        }

        const messagesResponseData =
          (await messagesResponse.json()) as ApiResponse<
            ApiMessage[]
          >;

        if (
          !messagesResponseData.success
        ) {
          throw new Error(
            messagesResponseData.error?.message ??
              "Não foi possível carregar as mensagens."
          );
        }

        const apiMessages =
          messagesResponseData.data ?? [];

        /*
         * ==========================
         * CONVERTER MENSAGENS
         * API → FRONTEND
         * ==========================
         */

        const roomMessages:
          ChatMessageData[] =
          apiMessages.map(
            (message) => {
              const messageUser =
                typeof message.user ===
                "string"
                  ? null
                  : message.user;

              const userId =
                typeof message.user ===
                "string"
                  ? message.user
                  : message.user._id;

              const participant =
                roomParticipants.find(
                  (item) =>
                    item.id === userId
                );

              const authorName =
                messageUser?.nickname ??
                messageUser?.username ??
                participant?.name ??
                `Usuário ${userId.slice(-4)}`;

              const avatarColor =
                participant?.avatarColor ??
                "bg-primary";

              return {
                id: message._id,

                author: {
                  id: userId,
                  name: authorName,
                  avatarColor,
                },

                time: new Date(
                  message.createdAt
                ).toLocaleTimeString(
                  "pt-BR",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),

                text:
                  message.content,
              };
            }
          );

        if (cancelled) {
          return;
        }

        setRoom(roomInfo);
        setParticipants(
          roomParticipants
        );
        setMessages(roomMessages);
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

  /*
   * ==========================
   * LOADING
   * ==========================
   */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Carregando sala...
        </p>
      </div>
    );
  }

  /*
   * ==========================
   * ERRO
   * ==========================
   */

  if (error || !room) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Não foi possível carregar a sala
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ??
              "Sala não encontrada."}
          </p>
        </div>
      </div>
    );
  }

  /*
   * ==========================
   * SALA
   * ==========================
   */

  return (
    <RoomLayout
      room={room}
      participants={participants}
      messages={messages}
    />
  );
}