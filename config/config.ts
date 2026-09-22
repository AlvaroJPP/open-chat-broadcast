import dns from "node:dns";
const PORT = Number(process.env.PORT) || 3000;

const HOST = process.env.HOST || "127.0.0.1";

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/app";

const ALLOWED_IPS = [
    "127.0.0.1",
    "::1"
];

const config = {

    http: {
        port: PORT,
        host: HOST,

        access: {
            allowAll: false,
            allowedIPs: ALLOWED_IPS
        }
    },

    mongodb: {
        uri: MONGODB_URI
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