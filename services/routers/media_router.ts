import { Router } from "express";

import mediaController from "../controllers/media_controller.ts";

const mediaRouter = Router();

mediaRouter.post(
    "/",
    mediaController.create
);

mediaRouter.get(
    "/:id",
    mediaController.findById
);

mediaRouter.delete(
    "/:id",
    mediaController.delete
);

export default mediaRouter;