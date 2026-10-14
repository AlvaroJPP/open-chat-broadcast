import { Router } from "express";
import roomController from "../controllers/room_controller.ts";
import { requireAuth } from "../middleware/require_auth.ts";
import { requireRegisteredUser } from "../middleware/require_registered_user.ts";

const roomRouter = Router();

// Entrada pública para convidados temporários; as demais rotas exigem sessão.
roomRouter.post("/guest-join", roomController.guestJoin);

roomRouter.use(requireAuth);

roomRouter.post("/", requireRegisteredUser, roomController.create);
roomRouter.get("/", requireRegisteredUser, roomController.findAll);
roomRouter.get("/code/:code", requireRegisteredUser, roomController.findByCode);
roomRouter.get("/:id", roomController.findById);
roomRouter.post("/:id/join", requireRegisteredUser, roomController.join);
roomRouter.post("/:id/leave", roomController.leave);
roomRouter.patch("/:id", requireRegisteredUser, roomController.update);
roomRouter.delete("/:id", requireRegisteredUser, roomController.delete);

export default roomRouter;
