import mongoose from "mongoose";

import config from "./config.js";

let connectionPromise: Promise<void> | null = null;

async function connect(): Promise<void> {
    if (!config.mongodb.uri) {
        throw new Error("MONGODB_URI não configurada.");
    }

    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (connectionPromise) {
        await connectionPromise;
        return;
    }

    connectionPromise = mongoose
        .connect(config.mongodb.uri, {
            dbName: "open-chat-broadcast",
            serverSelectionTimeoutMS: 10_000,
        })
        .then(() => {
            console.log("[MONGODB] Conectado ao MongoDB.");
            console.log(
                `[MONGODB] Database: ${mongoose.connection.name}`,
            );
        })
        .catch((error: unknown) => {
            connectionPromise = null;
            console.error("[MONGODB] Erro ao conectar:", error);
            throw error;
        });

    try {
        await connectionPromise;
    } finally {
        if (mongoose.connection.readyState !== 2) {
            connectionPromise = null;
        }
    }
}

async function disconnect(): Promise<void> {
    connectionPromise = null;
    await mongoose.disconnect();
    console.log("[MONGODB] Desconectado.");
}

export default {
    connect,
    disconnect,
};
