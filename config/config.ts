
import dns from "node:dns";

const PORT = Number(process.env["PORT"]) || 3000;

// Aceita conexões de qualquer interface de rede
const HOST = process.env["HOST"] || "0.0.0.0";

const MONGODB_URI =
    process.env["MONGODB_URI"] ||
    "mongodb://127.0.0.1:27017/app";

const defaultAllowedOrigins = [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://localhost:5175",
    "https://localhost:5175",
    "https://192.168.1.101:5173",
    "https://192.168.1.101:5175",
    "http://192.168.1.101:5173",
    "http://192.168.1.101:5175"
];

const config = {
    http: {
        port: PORT,
        host: HOST,

        access: {
            // Libera qualquer IP
            allowAll: true,
            allowedIPs: []
        },

        allowedOrigins: process.env["ALLOWED_ORIGINS"]
            ? process.env["ALLOWED_ORIGINS"]!
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            : defaultAllowedOrigins
    },

    mongodb: {
        uri: MONGODB_URI
    },

    rooms: {
        // true = fecha todas as salas no desligamento
        // false = não executa a limpeza automática
        closeAllOnShutdown: true,

        // Limpa salas que ficaram abertas após uma queda
        closeAllOnStartup: true
    },

    directory: {
        enabled: false
    },

    dns: {
        servers: [
            "1.1.1.1",
            "8.8.8.8"
        ],

        configure() {
            dns.setServers(this.servers);

            console.log(
                `[DNS] DNS configurado: ${this.servers.join(", ")}`
            );
        }
    }
};

export default config;
