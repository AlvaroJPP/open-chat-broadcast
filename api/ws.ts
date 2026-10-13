import { createServer } from "node:http";

import app from "../config/app.ts";
import websocket from "../services/websocket/index.ts";

const server = createServer(app);

// Vercel Functions support WebSocket upgrades. Keep the existing /ws
// path locally and expose /api/ws on the Vercel function URL.
websocket.start(server);

export default server;
