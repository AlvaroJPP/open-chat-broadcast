import type { Request, Response } from "express";
import app from "../../config/app.ts";

/**
 * Encaminha explicitamente /api/users/* para o roteador Express.
 * A normalização cobre os formatos de URL usados pelo runtime da Vercel.
 */
export default function handler(req: Request, res: Response) {
  const requestUrl = req.url ?? "/";
  const queryIndex = requestUrl.indexOf("?");
  const pathname = queryIndex === -1 ? requestUrl : requestUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : requestUrl.slice(queryIndex);

  let normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  while (normalizedPath === "/api/api" || normalizedPath.startsWith("/api/api/")) {
    normalizedPath = normalizedPath.slice(4);
  }

  if (normalizedPath !== "/api" && !normalizedPath.startsWith("/api/")) {
    normalizedPath = `/api${normalizedPath}`;
  }

  // Se a Vercel passar somente o sufixo da rota, restaura /api/users.
  if (normalizedPath === "/api" || normalizedPath === "/api/") {
    normalizedPath = "/api/users";
  } else if (!normalizedPath.startsWith("/api/users/") && normalizedPath !== "/api/users") {
    normalizedPath = `/api/users${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
  }

  req.url = `${normalizedPath}${query}`;
  return app(req, res);
}
