import mongoose from "mongoose";

import config from "./config.js";

async function connect(): Promise<void> {
    if (!config.mongodb.uri) {
        throw new Error(
            "MONGODB_URI não configurada."
        );
    }

    try {
        await mongoose.connect(
            config.mongodb.uri
        );

        console.log(
            "[MONGODB] Conectado ao MongoDB."
        );
    } catch (error) {
        console.error(
            "[MONGODB] Erro ao conectar:",
            error
        );

        throw error;
    }
}

async function disconnect(): Promise<void> {
    await mongoose.disconnect();

    console.log(
        "[MONGODB] Desconectado."
    );
}

export default {
    connect,
    disconnect
};