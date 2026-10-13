import type { Request, Response } from "express";
import { authenticateUser, AppError } from "../services/user_service.ts";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "../services/auth/session.ts";

const TAG = "[AUTH]";

/** Extrai status + mensagem de um erro (AppError ou não) para a resposta HTTP. */
function respondWithError(res: Response, error: unknown, fallbackMessage: string) {
    const status = error instanceof AppError ? error.status : 500;
    const message = error instanceof AppError ? error.message : fallbackMessage;

    return res.status(status).json({
        success: false,
        error: { status, message },
    });
}

const authController = {
    async login(req: Request, res: Response) {
        console.log(TAG, "Autenticando usuário...");
        try {
            const { nickname, pwd } = req.body;

            const user = await authenticateUser(nickname, pwd);

            const token = createSessionToken(String((user as { _id: unknown })._id));
            res.cookie(sessionCookieName, token, sessionCookieOptions);

            return res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error(TAG, "Erro ao autenticar usuário:", error);
            return respondWithError(res, error, "Erro ao autenticar usuário.");
        }
    },

    async logout(_req: Request, res: Response) {
        res.clearCookie(sessionCookieName, {
            httpOnly: true,
            secure: process.env["NODE_ENV"] === "production",
            sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
            path: "/",
        });

        return res.status(200).json({
            success: true,
            data: null,
        });
    },
};

export default authController;