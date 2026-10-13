import "dotenv/config";

import { createServer } from "node:http";

import app from "../config/app.ts";
import websocket from "../services/websocket/index.ts";
import config from "../config/config.ts";
import dir from "../config/dir.ts";
import mongodb from "../config/mongodb.ts";
import roomCleanup from "../services/rooms/room_cleanup.ts";

const server = createServer(app);

// ============================================================
// WEBSOCKET
// ============================================================

websocket.start(server);

// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function startServer() {
  config.dns.configure();

  await mongodb.connect();

  // Limpeza de salas de execuções anteriores.
  await roomCleanup.onStartup();

  if (config.directory.enabled) {
    dir.start();
  }

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

  server.close();

  try {
    await roomCleanup.onShutdown();
    console.log("[SERVER] Limpeza das salas concluída.");
  } catch (error) {
    console.error(
      "[SERVER] Erro ao limpar as salas:",
      error
    );
  }

  try {
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