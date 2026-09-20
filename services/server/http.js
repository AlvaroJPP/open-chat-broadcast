import { readFile } from "node:fs/promises";

export function sendJson(response, status, body) {
  response.status(status).json(body);
}

export function readBody(request, limit = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Arquivo excede o limite de 15 MB"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

export async function readJson(request) {
  const body = (await readBody(request)).toString("utf8");
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new Error("JSON inválido");
  }
}

export async function serveFile(response, path, contentType) {
  try {
    const content = await readFile(path);
    response.set("Cache-Control", "no-store");
    response.type(contentType);
    response.send(content);
  } catch (error) {
    sendJson(response, error.code === "ENOENT" ? 404 : 500, { error: "Mídia não encontrada" });
  }
}

// Usado com o middleware `cors()` em cmd/server.js
export const corsOptions = {
  origin: process.env.KIOSK_ORIGIN ?? "http://127.0.0.1:5173",
  methods: ["GET", "POST", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
