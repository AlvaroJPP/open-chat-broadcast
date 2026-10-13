import { Router } from "express";
import mediaController from "../controllers/media_controller.ts";
import { requireAuth } from "../middleware/require_auth.ts";

const mediaRouter = Router();

mediaRouter.use(requireAuth);

mediaRouter.post("/", mediaController.create);
mediaRouter.get("/:id", mediaController.findById);
mediaRouter.delete("/:id", mediaController.delete);

export default mediaRouter;
