
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";

import websocket from "../services/websocket/index.ts";
import config from "../config/config.ts";
import dir from "../config/dir.ts";
import http from "../config/http.js";
import mongodb from "../config/mongodb.ts";
import roomCleanup from "../services/rooms/room_cleanup.ts";

import userRouter from "../routers/user_router.ts";
import broadcastRouter from "../routers/broadcast_router.ts";
import roomRouter from "../routers/room_router.ts";
import messageRouter from "../routers/message_router.ts";
import mediaRouter from "../routers/media_router.ts";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// CORS
// ============================================================

const allowedOrigins = config.http.allowedOrigins ?? [];


const lanOrigin =
    /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
    cors({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }

            if (
                allowedOrigins.includes(origin) ||
                lanOrigin.test(origin)
            ) {
                return callback(null, true);
            }

            return callback(
                new Error(`Origem não permitida pelo CORS: ${origin}`)
            );
        },
        credentials: true
    })
);

// ============================================================
// SERVIDOR HTTP E WEBSOCKET
// ============================================================

const server = createServer(app);

websocket.start(server);

// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function startServer() {
    config.dns.configure();

    await mongodb.connect();

    // Fecha salas que ficaram abertas de uma execução anterior.
    await roomCleanup.onStartup();

    if (config.directory.enabled) {
        dir.start();
    }

    // ========================================================
    // SEGURANÇA
    // ========================================================

    app.use(http.ipFilter);

    // ========================================================
    // ROTAS
    // ========================================================

    app.use("/api/users", userRouter);
    app.use("/api/broadcasts", broadcastRouter);
    app.use("/api/rooms", roomRouter);
    app.use("/api", messageRouter);
    app.use("/api/media", mediaRouter);

    // ========================================================
    // TRATAMENTO FINAL
    // ========================================================

    app.use(http.notFoundHandler);
    app.use(http.errorHandler);

    // ========================================================
    // LISTEN
    // ========================================================

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

// ============================================================
// DESLIGAMENTO SEGURO
// ============================================================

let shuttingDown = false;

async function shutdownServer(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(
        `[SERVER] Recebido ${signal}. Iniciando desligamento...`
    );

    // Para de aceitar novas conexões HTTP.
    server.close();

    try {
        // Fecha todas as salas, se a opção estiver ativada.
        await roomCleanup.onShutdown();

        console.log("[SERVER] Limpeza das salas concluída.");
    } catch (error) {
        console.error(
            "[SERVER] Erro ao limpar as salas:",
            error
        );
    }

    try {
        // A conexão com o banco só é encerrada após a limpeza.
        await mongodb.disconnect();
    } catch (error) {
        console.error(
            "[SERVER] Erro ao desconectar do MongoDB:",
            error
        );
    }

    console.log("[SERVER] Servidor encerrado.");

    process.exit(0);
}

process.on("SIGINT", () => {
    void shutdownServer("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdownServer("SIGTERM");
});

// ============================================================
// EXECUÇÃO
// ============================================================

startServer().catch((error) => {
    console.error(
        "[SERVER] Falha ao iniciar o servidor:",
        error
    );

    process.exit(1);
});
