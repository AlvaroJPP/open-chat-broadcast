import type { Request, Response } from "express";
import app from "../config/app.ts";

/**
 * A Vercel catch-all function can receive the path with or without the
 * /api prefix depending on how the request is routed. The Express app
 * registers its endpoints under /api, so normalize the URL before dispatch.
 */
export default function handler(req: Request, res: Response) {
    const requestUrl = req.url ?? "/";
    const pathname = requestUrl.split("?")[0] ?? "/";

    if (pathname !== "/api" && !pathname.startsWith("/api/")) {
        req.url = `/api${requestUrl.startsWith("/") ? requestUrl : `/${requestUrl}`}`;
    }

    return app(req, res);
}
