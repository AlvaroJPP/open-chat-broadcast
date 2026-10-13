import { randomUUID } from "node:crypto";
import type { ChangeStream, ChangeStreamDocument } from "mongoose";
import mongoose from "mongoose";

import realtimeEventModel from "../../models/realtime_event_model.ts";

export type RealtimeEventPayload = {
  event: string;
  data: unknown;
  roomId?: string | null;
  targetUserId?: string | null;
};

type RealtimeListener = (event: RealtimeEventPayload) => void;

const instanceId = randomUUID();
const listeners = new Set<RealtimeListener>();
let changeStream: ChangeStream | null = null;
let starting: Promise<void> | null = null;

/**
 * Assina eventos inseridos no MongoDB para retransmiti-los aos sockets
 * conectados a esta instância. A conexão precisa estar aberta antes de start().
 */
async function start(): Promise<void> {
  if (changeStream) return;
  if (starting) return starting;

  starting = (async () => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB precisa estar conectado antes de iniciar o realtime bus.");
    }

    const stream = realtimeEventModel.watch([], {
      fullDocument: "default",
    });

    stream.on("change", (change: ChangeStreamDocument) => {
      if (change.operationType !== "insert" || !("fullDocument" in change)) {
        return;
      }

      const document = change.fullDocument as {
        event?: string;
        data?: unknown;
        roomId?: string | null;
        targetUserId?: string | null;
        origin?: string;
      };

      if (!document.event || document.origin === instanceId) return;

      const payload: RealtimeEventPayload = {
        event: document.event,
        data: document.data,
        roomId: document.roomId ?? null,
        targetUserId: document.targetUserId ?? null,
      };

      for (const listener of listeners) {
        try {
          listener(payload);
        } catch (error) {
          console.error("[REALTIME BUS] Listener falhou:", error);
        }
      }
    });

    stream.on("error", (error: unknown) => {
      console.error("[REALTIME BUS] Change Stream falhou:", error);
      if (changeStream === stream) changeStream = null;
    });

    changeStream = stream;
  })().finally(() => {
    starting = null;
  });

  return starting;
}

function subscribe(listener: RealtimeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function publish(payload: RealtimeEventPayload): Promise<void> {
  await realtimeEventModel.create({
    event: payload.event,
    data: payload.data,
    roomId: payload.roomId ?? null,
    targetUserId: payload.targetUserId ?? null,
    origin: instanceId,
    expiresAt: new Date(Date.now() + 60_000),
  });
}

async function stop(): Promise<void> {
  const stream = changeStream;
  changeStream = null;
  if (stream) await stream.close();
  listeners.clear();
}

export default { start, subscribe, publish, stop };
