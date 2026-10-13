import dns from "node:dns"

const PORT = Number(process.env["PORT"]) || 3000
const HOST = process.env["HOST"] || "0.0.0.0"
const MONGODB_URI =
  process.env["MONGODB_URI"] ||
  (process.env["VERCEL"] ? "" : "mongodb://127.0.0.1:27017/app")

const FRONTEND_URL =
  process.env["FRONTEND_URL"]?.trim() ||
  "https://open-chat-broadcast-ajpp.vercel.app"

const allowedOrigins = process.env["ALLOWED_ORIGINS"]
  ? process.env["ALLOWED_ORIGINS"]
      .split(",")
      .map(origin => origin.trim())
      .filter(Boolean)
  : [FRONTEND_URL]

const config = {
  http: {
    port: PORT,
    host: HOST,

    access: {
      allowAll: true,
      allowedIPs: [],
    },

    allowedOrigins,
  },

  mongodb: {
    uri: MONGODB_URI,
  },

  rooms: {
    closeAllOnShutdown: true,
    closeAllOnStartup: true,
  },

  directory: {
    enabled: false,
  },

  dns: {
    servers: ["1.1.1.1", "8.8.8.8"],

    configure() {
      dns.setServers(this.servers)
      console.log(`[DNS] DNS configurado: ${this.servers.join(", ")}`)
    },
  },
}

export default config
