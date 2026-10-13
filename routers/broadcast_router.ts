import { Router } from "express";
import broadcastController from "../controllers/broadcast_controller.ts";
import { requireAuth } from "../middleware/require_auth.ts";

const broadcastRouter = Router();

broadcastRouter.use(requireAuth);

broadcastRouter.post("/", broadcastController.create);
broadcastRouter.get("/", broadcastController.findAll);
broadcastRouter.get("/:id", broadcastController.findById);
broadcastRouter.patch("/:id", broadcastController.update);
broadcastRouter.delete("/:id", broadcastController.delete);

export default broadcastRouter;
