import express from "express";
import cors from "cors";

import config from "./config.ts";
import http from "./http.js";
import mongodb from "./mongodb.ts";

import userRouter from "../routers/user_router.ts";
import broadcastRouter from "../routers/broadcast_router.ts";
import roomRouter from "../routers/room_router.ts";
import messageRouter from "../routers/message_router.ts";
import mediaRouter from "../routers/media_router.ts";

const app = express();

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), display-capture=(self)");
  if (process.env["NODE_ENV"] === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb", parameterLimit: 100 }));

const allowedOrigins = config.http.allowedOrigins ?? [];

const lanOrigin =
  /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || (process.env["NODE_ENV"] !== "production" && lanOrigin.test(origin))) {
        return callback(null, true);
      }

      return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true,
  }),
);

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
app.use((req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  let bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + 60_000 };
    requestBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > 180) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ success: false, error: { status: 429, message: "Muitas solicitações. Aguarde um minuto e tente novamente." } });
  }
  if (requestBuckets.size > 5000) {
    for (const [bucketKey, value] of requestBuckets) if (value.resetAt <= now) requestBuckets.delete(bucketKey);
  }
  next();
});

app.use(http.ipFilter);

// Vercel pode reutilizar a mesma instância entre requisições.
// connect() reaproveita a conexão Mongoose quando ela já está aberta.
app.use((req, res, next) => {
  void mongodb.connect().then(
    () => next(),
    (error: unknown) => next(error),
  );
});

// Endpoint de diagnóstico seguro: não expõe credenciais nem dados de usuários.
// Como vem depois do middleware de conexão, confirma também o acesso ao MongoDB.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      api: "ok",
      database: "connected",
    },
  });
});

app.use("/api/users", userRouter);
app.use("/api/broadcasts", broadcastRouter);
app.use("/api/rooms", roomRouter);
app.use("/api", messageRouter);
app.use("/api/media", mediaRouter);

app.use(http.notFoundHandler);
app.use(http.errorHandler);

export default app;
