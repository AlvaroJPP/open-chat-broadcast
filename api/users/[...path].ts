import type { Request, Response } from "express";
import app from "../../config/app.ts";

/**
 * Rota explícita para os endpoints de usuários na Vercel.
 * Aceita tanto a URL completa quanto o sufixo entregue pelo runtime.
 */
export default function handler(req: Request, res: Response) {
  const requestUrl = req.url ?? "/";
  const queryIndex = requestUrl.indexOf("?");
  const pathname = queryIndex === -1 ? requestUrl : requestUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : requestUrl.slice(queryIndex);

  let path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  while (path === "/api/api" || path.startsWith("/api/api/")) {
    path = path.slice(4);
  }

  let normalizedPath: string;

  if (path === "/api/users" || path.startsWith("/api/users/")) {
    normalizedPath = path;
  } else if (path === "/users" || path.startsWith("/users/")) {
    normalizedPath = `/api${path}`;
  } else if (path === "/api") {
    normalizedPath = "/api/users";
  } else if (path.startsWith("/api/")) {
    normalizedPath = `/api/users/${path.slice(5)}`;
  } else {
    normalizedPath = path === "/" ? "/api/users" : `/api/users${path}`;
  }

  req.url = `${normalizedPath}${query}`;
  return app(req, res);
}
