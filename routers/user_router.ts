import userController from "../controllers/user_controller.ts";
import authController from "../controllers/auth_controller.ts";

import { Router } from "express";

const userRouter = Router();

userRouter.post(
    "/",
    userController.create
);

userRouter.get(
    "/",
    userController.findAll
);

userRouter.get(
    "/:id",
    userController.findById
);

userRouter.patch(
    "/:id",
    userController.update
);

userRouter.delete(
    "/:id",
    userController.delete
);

userRouter.post(
    "/login",
    authController.login
);

userRouter.post(
    "/logout",
    authController.logout
);

export default userRouter;