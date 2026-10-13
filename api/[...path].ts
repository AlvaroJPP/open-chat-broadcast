import type { Request, Response } from "express";
import mongoose from "mongoose";

import app from "../config/app.ts";
import mongodb from "../config/mongodb.ts";

let connectionPromise: Promise<void> | null = null;

async function ensureDatabaseConnection(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = mongodb.connect().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

export default async function handler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    await ensureDatabaseConnection();

    app(req, res);
  } catch (error) {
    console.error("[VERCEL API] Erro ao preparar a API:", error);

    if (!res.headersSent) {
      res.status(503).json({
        error: "Serviço temporariamente indisponível.",
      });
    }
  }
}