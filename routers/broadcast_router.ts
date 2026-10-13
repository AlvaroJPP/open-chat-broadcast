import { Router } from "express";

import broadcastController from "../controllers/broadcast_controller.ts";

const broadcastRouter = Router();

broadcastRouter.post("/", broadcastController.create);
broadcastRouter.get("/", broadcastController.findAll);
broadcastRouter.get("/:id", broadcastController.findById);
broadcastRouter.patch("/:id", broadcastController.update);
broadcastRouter.delete("/:id", broadcastController.delete);

export default broadcastRouter;
