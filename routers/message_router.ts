import { Router } from "express";
import messageController from "../controllers/message_controller.ts";
import { requireAuth } from "../middleware/require_auth.ts";

const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.get("/rooms/:roomId/messages", messageController.findByRoom);
messageRouter.post("/rooms/:roomId/messages", messageController.create);
messageRouter.delete("/messages/:id", messageController.delete);

export default messageRouter;
