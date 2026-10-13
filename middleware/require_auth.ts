import type { Request, Response, NextFunction } from "express";

import {
    readCookie,
    sessionCookieName,
    verifySessionToken,
} from "../services/auth/session.ts";

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const token = readCookie(
        req.headers.cookie,
        sessionCookieName,
    );

    const userId = verifySessionToken(token);

    if (!userId) {
        res.status(401).json({
            success: false,
            error: {
                status: 401,
                message: "Sessão inválida ou expirada. Entre novamente.",
            },
        });
        return;
    }

    res.locals.authUserId = userId;
    next();
}
