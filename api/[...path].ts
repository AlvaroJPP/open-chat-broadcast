import type { Request, Response } from "express";
import app from "../config/app.ts";

/**
 * Normaliza a URL recebida pela função catch-all da Vercel.
 * Dependendo do encaminhamento, req.url pode chegar com /api, sem /api
 * ou com o prefixo duplicado. O Express registra as rotas sob /api.
 */
export default function handler(req: Request, res: Response) {
    const requestUrl = req.url ?? "/";
    const queryIndex = requestUrl.indexOf("?");
    const pathname = queryIndex === -1 ? requestUrl : requestUrl.slice(0, queryIndex);
    const query = queryIndex === -1 ? "" : requestUrl.slice(queryIndex);

    let normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

    // Evita prefixos duplicados, por exemplo /api/api/users/login.
    while (normalizedPath === "/api/api" || normalizedPath.startsWith("/api/api/")) {
        normalizedPath = normalizedPath.slice(4);
    }

    // Garante o prefixo esperado pelo Express.
    if (normalizedPath !== "/api" && !normalizedPath.startsWith("/api/")) {
        normalizedPath = `/api${normalizedPath}`;
    }

    req.url = `${normalizedPath}${query}`;
    return app(req, res);
}
