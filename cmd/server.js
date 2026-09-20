import cors from "cors";
import express from "express";

import { isAuthorized } from "../services/server/auth.js";
import {
  loadConfig,
  hashPassword,
  saveConfig,
} from "../services/server/config.js";
import { corsOptions, readJson, sendJson } from "../services/server/http.js";


const port = Number(process.env.PORT ?? 3001);
const app = express();

// Envolve handlers async para centralizar o tratamento de erro
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// CORS (o pacote `cors` já trata o preflight OPTIONS automaticamente)
app.use(cors(corsOptions));

// ---------- Rotas públicas ----------

app.get("/api/ping",
  asyncHandler((_, res) => res.status(200).send('pong')),
);


// ---------- A partir daqui, autenticação obrigatória ----------

app.use((request, response, next) => {
  if (!isAuthorized(request)) return sendJson(response, 401, { error: "Autenticação necessária" });
  next();
});

app.post(
  "/api/auth/password",
  asyncHandler(async (request, response) => {
    const { password } = await readJson(request);
    if (typeof password !== "string" || password.length < 4 || password.length > 128) {
      return sendJson(response, 400, { error: "A senha deve ter entre 4 e 128 caracteres" });
    }
    const config = await loadConfig();
    await saveConfig({
      ...config,
      auth: { ...config.auth, password_hash: await hashPassword(password) },
    });
    return sendJson(response, 204, {});
  }),
);


// ---------- 404 ----------

app.use((request, response) => sendJson(response, 404, { error: "Rota não encontrada" }));

// ---------- Erro centralizado (equivalente ao catch do handler original) ----------

app.use((error, request, response, next) => {
  console.error(error);
  sendJson(response, 400, {
    error: error instanceof Error ? error.message : "Falha inesperada",
  });
});

app.listen(port, "127.0.0.1", () => console.log(`server em http://127.0.0.1:${port}`));
