import { randomUUID } from "node:crypto";

const sessions = new Map(); // Stores session tokens and their expiration timestamps
const sessionDurationMs = 8 * 60 * 60 * 1000; // 8 hours


/**
  Creates and manages user sessions.
  Provides functions to create a session and check if a request is authorized.
*/
export function createSession() {
  const token = randomUUID();
  sessions.set(token, Date.now() + sessionDurationMs);
  return token;
}

/**
  Checks if a request is authorized based on the session token.
  Returns true if the session is valid, false otherwise.
*/
export function isAuthorized(request) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expiration = sessions.get(token);
  if (!expiration || expiration < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}
