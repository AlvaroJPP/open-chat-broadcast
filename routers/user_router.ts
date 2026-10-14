import userController from "../controllers/user_controller.ts";
import authController from "../controllers/auth_controller.ts";
import { requireAuth } from "../middleware/require_auth.ts";
import { requireRegisteredUser } from "../middleware/require_registered_user.ts";

import { Router } from "express";

const userRouter = Router();

// Cadastro e login precisam continuar públicos.
userRouter.post("/", userController.create);
userRouter.post("/login", authController.login);

// Operações de conta exigem sessão e uma conta registrada (não temporária).
userRouter.use(requireAuth);
userRouter.use(requireRegisteredUser);

userRouter.get("/:id", userController.findById);
userRouter.patch("/:id", userController.update);
userRouter.delete("/:id", userController.delete);
userRouter.post("/logout", authController.logout);

export default userRouter;
