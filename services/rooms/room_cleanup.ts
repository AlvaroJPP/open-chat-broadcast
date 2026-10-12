
import config from "../../config/config.js";
import roomModel from "../../models/room_model.ts";

async function closeAllRooms(reason: string): Promise<void> {
    const result = await roomModel.updateMany(
        {},
        {
            $set: {
                participants: [],
                status: "closed"
            }
        }
    );

    console.log(
        `[ROOM CLEANUP] ${reason}: ` +
        `${result.modifiedCount} sala(s) atualizada(s).`
    );
}

async function onStartup(): Promise<void> {
    if (!config.rooms.closeAllOnStartup) {
        console.log(
            "[ROOM CLEANUP] Limpeza na inicialização desativada."
        );
        return;
    }

    await closeAllRooms("Inicialização do servidor");
}

async function onShutdown(): Promise<void> {
    if (!config.rooms.closeAllOnShutdown) {
        console.log(
            "[ROOM CLEANUP] Limpeza no desligamento desativada."
        );
        return;
    }

    await closeAllRooms("Desligamento do servidor");
}

export default {
    onStartup,
    onShutdown
};
