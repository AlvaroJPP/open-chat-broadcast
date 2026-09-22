import { Router } from "express";

import roomController from "../controllers/room_controller.ts";

const roomRouter = Router();

roomRouter.post(
    "/",
    roomController.create
);

roomRouter.get(
    "/",
    roomController.findAll
);

roomRouter.get(
    "/:id",
    roomController.findById
);

roomRouter.post(
    "/:id/join",
    roomController.join
);

roomRouter.post(
    "/:id/leave",
    roomController.leave
);

roomRouter.patch(
    "/:id",
    roomController.update
);

roomRouter.delete(
    "/:id",
    roomController.delete
);

export default roomRouter;