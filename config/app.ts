import express from "express";
import cors from "cors";

import config from "./config.ts";
import http from "./http.js";

import userRouter from "../routers/user_router.ts";
import broadcastRouter from "../routers/broadcast_router.ts";
import roomRouter from "../routers/room_router.ts";
import messageRouter from "../routers/message_router.ts";
import mediaRouter from "../routers/media_router.ts";

const app = express();

// ============================================================
// MIDDLEWARES
// ============================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// CORS
// ============================================================

const allowedOrigins = config.http.allowedOrigins ?? [];

const lanOrigin =
  /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        lanOrigin.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origem não permitida pelo CORS: ${origin}`)
      );
    },
    credentials: true,
  })
);

// ============================================================
// SEGURANÇA
// ============================================================

app.use(http.ipFilter);

// ============================================================
// ROTAS DA API
// ============================================================

app.use("/api/users", userRouter);
app.use("/api/broadcasts", broadcastRouter);
app.use("/api/rooms", roomRouter);
app.use("/api", messageRouter);
app.use("/api/media", mediaRouter);

// ============================================================
// TRATAMENTO DE ERROS
// ============================================================

app.use(http.notFoundHandler);
app.use(http.errorHandler);

export default app;
