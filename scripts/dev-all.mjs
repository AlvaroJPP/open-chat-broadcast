// Sobe backend (cli/server.js) e frontend (Vite) juntos:  npm run dev:all
// O front só inicia DEPOIS que o backend estiver escutando (ele demora porque
// conecta no MongoDB antes), evitando "ws proxy error: ECONNREFUSED".
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

function backendPort() {
  try {
    const env = fs.readFileSync(path.join(root, ".env"), "utf8");
    const match = env.match(/^\s*PORT\s*=\s*"?(\d+)"?/m);
    if (match) return Number(match[1]);
  } catch {
    /* sem .env */
  }
  return Number(process.env.PORT) || 3000;
}

function waitForPort(port, timeoutMs = 90000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Backend não abriu a porta ${port} em ${timeoutMs / 1000}s.`));
        } else {
          setTimeout(attempt, 500);
        }
      });
    };
    attempt();
  });
}

const children = [];
let closing = false;

function start(name, script) {
  const child = spawn(npm, ["run", script], { cwd: root, stdio: "inherit", shell: isWin });
  child.on("exit", (code) => {
    if (closing) return;
    console.log(`[${name}] encerrou (código ${code}).`);
    shutdown(code ?? 0);
  });
  children.push(child);
}

function shutdown(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) {
    try {
      // No Windows, shell:true deixa processos-neto; taskkill /T derruba a árvore.
      if (isWin && child.pid) {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        child.kill();
      }
    } catch {
      /* já encerrado */
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const port = backendPort();
console.log(`[DEV] Iniciando API na porta ${port}...`);
start("API", "dev:server");

waitForPort(port)
  .then(() => {
    console.log("[DEV] API pronta. Iniciando o front...");
    start("WEB", "dev");
  })
  .catch((error) => {
    console.error(`[DEV] ${error.message}`);
    shutdown(1);
  });
