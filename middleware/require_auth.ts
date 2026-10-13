import type { Request, Response, NextFunction } from "express";

import {
  inspectSessionToken,
  readCookie,
  sessionCookieName,
} from "../services/auth/session.ts";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = readCookie(req.headers.cookie, sessionCookieName);
  const inspection = inspectSessionToken(token);

  if (!inspection.userId) {
    console.warn(
      `[AUTH] Sessão rejeitada: motivo=${inspection.reason} rota=${req.path}`,
    );

    res.status(401).json({
      success: false,
      error: {
        status: 401,
        message: "Sessão inválida ou expirada. Entre novamente.",
      },
    });
    return;
  }

  res.locals.authUserId = inspection.userId;
  next();
}
