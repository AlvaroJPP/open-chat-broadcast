const PORT = Number(process.env.PORT) || 3000;

const HOST = process.env.HOST || "0.0.0.0";

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
        enabled: true
    }

};

export default config;