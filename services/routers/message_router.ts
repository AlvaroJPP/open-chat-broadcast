import { Router } from "express";

import messageController from "../controllers/message_controller.js";

const messageRouter = Router();

// Buscar mensagens de uma sala
messageRouter.get(
    "/rooms/:roomId/messages",
    messageController.findByRoom
);

// Criar mensagem em uma sala
messageRouter.post(
    "/rooms/:roomId/messages",
    messageController.create
);

// Excluir mensagem
messageRouter.delete(
    "/messages/:id",
    messageController.delete
);

export default messageRouter;