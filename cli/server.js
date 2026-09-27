import "dotenv/config";
import express from "express";
import websocket from "../services/websocket/index.ts";

import config from "../config/config.ts";
import dir from "../config/dir.ts";
import http from "../config/http.js";
import mongodb from "../config/mongodb.ts";
import { createServer } from "node:http";

import userRouter from "../routers/user_router.ts";
import broadcastRouter from "../routers/broadcast_router.ts";
import roomRouter from "../routers/room_router.ts";
import messageRouter from "../routers/message_router.ts";
import mediaRouter from "../routers/media_router.ts";
import cors from "cors";

const app = express();

app.use(express.json());
// Lidar com Body Parser
app.use(express.urlencoded({ extended: true }));

// ============================================================
// CORS
// ============================================================
/*
 * Quando `credentials: true` é usado no fetch do front (necessário para
 * enviar/receber cookies httpOnly, ex: token de sessão), o navegador exige
 * que o servidor responda com uma origem EXPLÍCITA em
 * `Access-Control-Allow-Origin` — o wildcard "*" é proibido nesse caso.
 *
 * Por isso mantemos uma lista de origens permitidas (via env) em vez de "*".
 */
const allowedOrigins = config.http.allowedOrigins ?? ["http://localhost:5173"];

app.use(
  cors({
    origin(origin, callback) {
      // Requisições sem origin (ex: curl, apps mobile, health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true, // permite cookies/credenciais nas respostas
  }),
);

// Criar servidor HTTP com Express e WebSocket

const server = createServer(app);

websocket.start(server);

async function startServer() {
  config.dns.configure();

  await mongodb.connect();

  if (config.directory.enabled) {
    dir.start();
  }

  // ============================================================
  // MIDDLEWARES DE SEGURANÇA (antes das rotas)
  // ============================================================

  // Filtro de IP — precisa vir ANTES das rotas, senão nunca bloqueia nada
  app.use(http.ipFilter);

  // ============================================================
  // ROTAS DA API
  // ============================================================

  // Usuários
  app.use("/api/users", userRouter);

  // Broadcasts
  app.use("/api/broadcasts", broadcastRouter);

  // Salas
  app.use("/api/rooms", roomRouter);

  // Mensagens
  app.use("/api", messageRouter);

  // Mídias
  app.use("/api/media", mediaRouter);

  // ============================================================
  // MIDDLEWARES FINAIS
  // ============================================================

  // Rota não encontrada
  app.use(http.notFoundHandler);

  // Tratamento de erros (sempre por último)
  app.use(http.errorHandler);

  // ============================================================
  // SERVIDOR
  // ============================================================

  server.listen(config.http.port, config.http.host, () => {
    console.log(`[SERVER] Servidor iniciado em ${config.http.host}:${config.http.port}`);
  });
}

startServer().catch((error) => {
  console.error("[SERVER] Falha ao iniciar o servidor:", error);

  process.exit(1);
});
