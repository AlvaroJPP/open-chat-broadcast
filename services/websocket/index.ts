
import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

import userModel from "../../models/user_model.ts";

import {
  ConnectedClient,
  joinRoom,
  leaveRoom,
  removeOfflineParticipant,
  broadcastRoomParticipants,
} from "./room.js";

import { sendMessage } from "./message.js";
import { startTyping, stopTyping } from "./typing.js";
import { startBroadcast, endBroadcast } from "./broadcast.js";
import { startScreen, stopScreen } from "./screen.js";
import { relayMediaState } from "./media.js";

import {
  sendOffer,
  sendAnswer,
  sendIceCandidate,
} from "./webrtc.js";

type HeartbeatSocket = WebSocket & {
  isAlive?: boolean;
};

function send(
  socket: WebSocket,
  event: string,
  data: unknown,
): void {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify({ event, data }));
}

async function handleMessage(
  client: ConnectedClient,
  message: string,
  clients: Set<ConnectedClient>,
  cancelOfflineTimer: (
    userId: string,
    roomId: string,
  ) => void,
): Promise<void> {
  try {
    const payload = JSON.parse(message);

    switch (payload.event) {
      case "room:join": {
        const data = payload.data;

        await joinRoom(client, data, clients);

        // Só cancela se a entrada na sala foi validada.
        if (
          data?.user &&
          data?.room &&
          client.userId === data.user &&
          client.roomId === data.room
        ) {
          cancelOfflineTimer(data.user, data.room);
        }

        break;
      }

      case "room:leave": {
        const data = payload.data;

        await leaveRoom(client, data, clients);

        if (data?.user && data?.room) {
          cancelOfflineTimer(data.user, data.room);
        }

        break;
      }

      case "message:send":
        await sendMessage(client, payload.data, clients);
        break;

      case "typing:start":
        await startTyping(client, payload.data, clients);
        break;

      case "typing:stop":
        await stopTyping(client, payload.data, clients);
        break;

      case "broadcast:start":
        await startBroadcast(client, payload.data, clients);
        break;

      case "broadcast:end":
        await endBroadcast(client, payload.data, clients);
        break;

      case "screen:start":
        await startScreen(client, payload.data, clients);
        break;

      case "screen:stop":
        await stopScreen(client, payload.data, clients);
        break;

      case "media:state":
        relayMediaState(client, payload.data, clients);
        break;

      case "webrtc:offer":
        await sendOffer(client, payload.data, clients);
        break;

      case "webrtc:answer":
        await sendAnswer(client, payload.data, clients);
        break;

      case "webrtc:ice:candidate":
        await sendIceCandidate(client, payload.data, clients);
        break;

      default:
        send(client.socket, "error", {
          message: "Evento não reconhecido.",
        });
    }
  } catch (error) {
    console.error(
      "[WEBSOCKET] Erro ao processar mensagem:",
      error,
    );

    send(client.socket, "error", {
      message: "Mensagem WebSocket inválida.",
    });
  }
}

function start(server: HttpServer): WebSocketServer {
  const websocketServer = new WebSocketServer({
    server,
    path: "/ws",
  });

  const clients = new Set<ConnectedClient>();

  // Tempo máximo offline antes de remover o participante.
  const OFFLINE_TIMEOUT_MS = 60_000;

  const offlineTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  // Identifica unicamente a combinação usuário + sala.
  function getOfflineTimerKey(
    userId: string,
    roomId: string,
  ): string {
    return `${userId}:${roomId}`;
  }

  function cancelOfflineTimer(
    userId: string,
    roomId: string,
  ): void {
    const key = getOfflineTimerKey(userId, roomId);
    const timer = offlineTimers.get(key);

    if (timer) {
      clearTimeout(timer);
      offlineTimers.delete(key);

      console.log(
        `[WEBSOCKET] Temporizador cancelado para ${userId} na sala ${roomId}.`,
      );
    }
  }

  function scheduleOfflineRemoval(
    userId: string,
    roomId: string,
  ): void {
    const key = getOfflineTimerKey(userId, roomId);

    // Evita temporizadores duplicados.
    cancelOfflineTimer(userId, roomId);

    const timer = setTimeout(async () => {
      // Confirma que este ainda é o temporizador vigente.
      if (offlineTimers.get(key) !== timer) {
        return;
      }

      offlineTimers.delete(key);

      try {
        await removeOfflineParticipant(
          userId,
          roomId,
          clients,
        );
      } catch (error) {
        console.error(
          `[WEBSOCKET] Erro ao remover ${userId} da sala ${roomId}:`,
          error,
        );
      }
    }, OFFLINE_TIMEOUT_MS);

    offlineTimers.set(key, timer);

    console.log(
      `[WEBSOCKET] Remoção agendada para ${userId} na sala ${roomId}, em 120 segundos.`,
    );
  }

  /*
   * Heartbeat único para todos os clientes.
   * Detecta conexões que deixam de responder.
   */
  const heartbeatInterval = setInterval(() => {
    for (const client of clients) {
      const socket = client.socket as HeartbeatSocket;

      if (socket.readyState !== WebSocket.OPEN) {
        continue;
      }

      if (socket.isAlive === false) {
        console.warn(
          "[WEBSOCKET] Cliente sem resposta ao heartbeat; encerrando conexão.",
        );

        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, 30_000);

  websocketServer.on("close", () => {
    clearInterval(heartbeatInterval);

    for (const timer of offlineTimers.values()) {
      clearTimeout(timer);
    }

    offlineTimers.clear();
  });

  websocketServer.on("connection", (socket: WebSocket) => {
    const heartbeatSocket = socket as HeartbeatSocket;

    heartbeatSocket.isAlive = true;

    socket.on("pong", () => {
      heartbeatSocket.isAlive = true;
    });

    const client: ConnectedClient = {
      socket,
      userId: null,
      roomId: null,
    };

    clients.add(client);

    console.log(
      `[WEBSOCKET] Cliente conectado. Clientes: ${clients.size}`,
    );

    send(socket, "connected", {
      message: "Conexão WebSocket estabelecida.",
    });

    let messageQueue: Promise<void> = Promise.resolve();

    socket.on("message", (message) => {
      const text = message.toString();

      // Preserva o processamento sequencial das mensagens.
      messageQueue = messageQueue
        .then(() =>
          handleMessage(
            client,
            text,
            clients,
            cancelOfflineTimer,
          ),
        )
        .catch((error) => {
          console.error(
            "[WEBSOCKET] Erro na fila de mensagens:",
            error,
          );
        });
    });

    socket.on("close", async () => {
      const userId = client.userId;
      const roomId = client.roomId;

      // Remove somente a conexão que foi encerrada.
      clients.delete(client);

      const stillConnected = userId
        ? [...clients].some(
            (other) =>
              other.userId === userId &&
              other.socket.readyState === WebSocket.OPEN,
          )
        : false;

      const stillInRoom =
        userId && roomId
          ? [...clients].some(
              (other) =>
                other.userId === userId &&
                other.roomId === roomId &&
                other.socket.readyState === WebSocket.OPEN,
            )
          : false;

      // Só marca offline quando nenhuma conexão permanece ativa.
      if (userId && !stillConnected) {
        try {
          await userModel.findByIdAndUpdate(userId, {
            status: "offline",
          });
        } catch (error) {
          console.error(
            `[WEBSOCKET] Erro ao atualizar status offline do usuário ${userId}:`,
            error,
          );
        }
      }

      if (userId && roomId && !stillInRoom) {
        // Não remove do banco imediatamente.
        scheduleOfflineRemoval(userId, roomId);

        // Atualiza a presença sem remover o participante.
        try {
          await broadcastRoomParticipants(roomId, clients);
        } catch (error) {
          console.error(
            `[WEBSOCKET] Erro ao atualizar participantes da sala ${roomId}:`,
            error,
          );
        }

        console.log(
          `[WEBSOCKET] Usuário ${userId} offline na sala ${roomId}. Prazo: 120 segundos.`,
        );
      }

      console.log(
        `[WEBSOCKET] Cliente desconectado. Clientes: ${clients.size}`,
      );
    });

    socket.on("error", (error) => {
      console.error("[WEBSOCKET] Erro:", error);
    });
  });

  console.log("[WEBSOCKET] WebSocket iniciado em /ws");

  return websocketServer;
}

export default {
  start,
};
