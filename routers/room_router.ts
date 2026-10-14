import { Router } from "express";
import roomController from "../controllers/room_controller.ts";
import { requireAuth } from "../middleware/require_auth.ts";

const roomRouter = Router();

// Entrada pública para convidados temporários; as demais rotas exigem sessão.
roomRouter.post("/guest-join", roomController.guestJoin);

roomRouter.use(requireAuth);

roomRouter.post("/", roomController.create);
roomRouter.get("/", roomController.findAll);
roomRouter.get("/code/:code", roomController.findByCode);
roomRouter.get("/:id", roomController.findById);
roomRouter.post("/:id/join", roomController.join);
roomRouter.post("/:id/leave", roomController.leave);
roomRouter.patch("/:id", roomController.update);
roomRouter.delete("/:id", roomController.delete);

export default roomRouter;
