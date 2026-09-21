import "dotenv/config";
import express from "express";

import config from "../services/config/config.ts";
import dir from "../services/config/dir.ts";
import http from "../services/config/http.js";

const app = express();

app.use(express.json());

if (config.directory.enabled) {
    dir.start();
}

app.use(http.ipFilter);

app.use(http.notFoundHandler);

app.use(http.errorHandler);

app.listen(
    config.http.port,
    config.http.host,
    () => {
        console.log(
            `[SERVER] Servidor iniciado em ${config.http.host}:${config.http.port}`
        );
    }
);