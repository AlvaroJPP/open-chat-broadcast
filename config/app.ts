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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = config.http.allowedOrigins ?? [];

const lanOrigin =
  /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || lanOrigin.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(http.ipFilter);

// Vercel pode reutilizar a mesma instância entre requisições.
// connect() reaproveita a conexão Mongoose quando ela já está aberta.
app.use((req, res, next) => {
  void mongodb.connect().then(
    () => next(),
    (error: unknown) => next(error),
  );
});

app.use("/api/users", userRouter);
app.use("/api/broadcasts", broadcastRouter);
app.use("/api/rooms", roomRouter);
app.use("/api", messageRouter);
app.use("/api/media", mediaRouter);

app.use(http.notFoundHandler);
app.use(http.errorHandler);

export default app;
