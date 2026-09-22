import "dotenv/config";
import express from "express";
import websocket from "../services/websocket/index.ts";

import config from "../services/config/config.ts";
import dir from "../services/config/dir.ts";
import http from "../services/config/http.js";
import mongodb from "../services/config/mongodb.ts";
import { createServer } from "node:http";

import userRouter from "../services/routers/user_router.ts";
import broadcastRouter from "../services/routers/broadcast_router.ts";
import roomRouter from "../services/routers/room_router.ts";
import messageRouter from "../services/routers/message_router.ts";
import mediaRouter from "../services/routers/media_router.ts";

const app = express();

app.use(express.json());

const server = createServer(app);

websocket.start(server);

async function startServer() {
    config.dns.configure();

    await mongodb.connect();

    if (config.directory.enabled) {
        dir.start();
    }

    // ============================================================
    // ROTAS DA API
    // ============================================================

    // Usuários
    app.use(
        "/api/users",
        userRouter
    );

    // Broadcasts
    app.use("/api/broadcasts", broadcastRouter);

    // Salas
    app.use("/api/rooms", roomRouter);

    // Mensagens
    app.use("/api", messageRouter);

    // Mídias
    app.use("/api/media", mediaRouter);

    // ============================================================
    // MIDDLEWARES
    // ============================================================

    // Filtro de IP
    app.use(http.ipFilter);

    // Rota não encontrada
    app.use(http.notFoundHandler);

    // Tratamento de erros
    app.use(http.errorHandler);

    // ============================================================
    // SERVIDOR
    // ============================================================

    server.listen(
    config.http.port,
    config.http.host,
    () => {
        console.log(
            `[SERVER] Servidor iniciado em ${config.http.host}:${config.http.port}`
        );
    }
);
}

startServer().catch((error) => {
    console.error(
        "[SERVER] Falha ao iniciar o servidor:",
        error
    );

    process.exit(1);
});