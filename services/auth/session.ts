import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const sessionCookieName = "token";

function getSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (secret && secret.length >= 32) return secret;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres em produção.");
  }
  return "ocb-local-development-secret-do-not-use-in-production";
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token || token.length > 2048) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  try {
    const expected = Buffer.from(sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown; exp?: unknown };
    if (typeof parsed.sub !== "string" || typeof parsed.exp !== "number" || parsed.exp <= Date.now() / 1000) return null;
    return parsed.sub;
  } catch {
    return null;
  }
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const item of header.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0 || item.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(item.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: (process.env["NODE_ENV"] === "production" ? "none" : "lax") as "none" | "lax",
  path: "/",
  maxAge: SESSION_TTL_SECONDS * 1000,
};
