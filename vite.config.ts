import fs from "node:fs"
import path from "node:path"
import {defineConfig, loadEnv} from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import {tanstackRouter} from "@tanstack/router-plugin/vite"
import tsconfigPaths from "vite-tsconfig-paths"

const certDir = path.resolve(__dirname, ".cert")
const certFile = path.join(certDir, "cert.pem")
const keyFile = path.join(certDir, "key.pem")

const httpsOptions =
  fs.existsSync(certFile) && fs.existsSync(keyFile)
    ? {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile),
      }
    : undefined

export default defineConfig(({mode}) => {
  // O Vite NÃO injeta o .env em process.env dentro do vite.config.
  // Por isso lemos o .env explicitamente (prefixo "" = todas as variáveis),
  // garantindo que o proxy aponte para a MESMA porta que o backend usa.
  const env = loadEnv(mode, process.cwd(), "")

  // Porta do frontend (acesse https://192.168.1.101:5175)
  const FRONT_PORT = Number(env["FRONT_PORT"]) || 5175

  // Porta do backend (cli/server.js lê a mesma variável PORT)
  const BACK_PORT = Number(env["PORT"]) || 3000

  // 127.0.0.1 em vez de "localhost": no Node 17+ "localhost" pode resolver
  // para ::1 (IPv6) e o backend escuta em IPv4 -> ECONNREFUSED no proxy.
  const BACK_HTTP = `http://127.0.0.1:${BACK_PORT}`
  const BACK_WS = `ws://127.0.0.1:${BACK_PORT}`

  return {
    plugins: [
      // precisa vir ANTES do plugin do react
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],

    server: {
      host: "0.0.0.0",
      port: FRONT_PORT,
      strictPort: true,
      allowedHosts: true,

      watch: {
        ignored: ["**/.cert/**"],
      },

      ...(httpsOptions ? {https: httpsOptions} : {}),

      proxy: {
        "/api": {
          target: BACK_HTTP,
          changeOrigin: true,
        },

        "/ws": {
          target: BACK_WS,
          ws: true,
          changeOrigin: true,
        },

        "/media": {
          target: BACK_HTTP,
          changeOrigin: true,
        },
      },
    },

    preview: {
      host: "0.0.0.0",
      port: FRONT_PORT,
      strictPort: true,
      ...(httpsOptions ? {https: httpsOptions} : {}),
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  }
})
