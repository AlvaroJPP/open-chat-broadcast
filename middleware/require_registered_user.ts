import type { Request, Response, NextFunction } from "express";
import userModel from "../models/user_model.ts";

/** Permite operações de conta e administração apenas a usuários registrados. */
export async function requireRegisteredUser(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = String(res.locals.authUserId ?? "");
        const user = userId
            ? await userModel.findById(userId).select("isGuest")
            : null;

        if (!user) {
            res.status(401).json({
                success: false,
                error: { status: 401, message: "Usuário não encontrado. Entre novamente." },
            });
            return;
        }

        if (user.isGuest) {
            res.status(403).json({
                success: false,
                error: { status: 403, message: "Participantes temporários não podem acessar essa função." },
            });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
}
