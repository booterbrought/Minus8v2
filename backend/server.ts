import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { createBunWebSocket } from "hono/bun";
import authRoutes from "./routes/authRoutes";
import lobbyRoutes from "./routes/lobbyRoutes";
import gameRoutes from "./routes/gameRoutes";
import { createWsHandler } from "./routes/ws";
import { initDb, loadActiveGames } from "./db/database";
import { gameList } from "./controllers/gameController";

// Initialize database and restore active games
initDb();
const activeGames = loadActiveGames();
for (const [id, game] of activeGames) {
  gameList.set(id, game);
}
console.log(`Restored ${activeGames.size} active game(s) from database`);

const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();

// CORS
app.use("*", cors());

// WebSocket
app.get("/api/ws/:playerId", upgradeWebSocket((c) => {
  const playerId = c.req.param("playerId");
  return createWsHandler(playerId);
}));

// API Routes
app.route("/", authRoutes);
app.route("/", lobbyRoutes);
app.route("/", gameRoutes);

// Health check
app.get("/api/health", (c) => c.json({ status: "healthy" }));

// Serve Static Frontend Files (with SPA fallback)
app.get("/*", serveStatic({ root: "./frontend/dist" }));
app.get("/*", serveStatic({ root: "./frontend/dist", path: "index.html" }));

// Start the Server
const PORT = 8000;

const certPath = "/etc/letsencrypt/live/dmbr.lv/fullchain.pem";
const keyPath = "/etc/letsencrypt/live/dmbr.lv/privkey.pem";

const certFile = Bun.file(certPath);
const keyFile = Bun.file(keyPath);

const [certExists, keyExists] = await Promise.all([
  certFile.exists(),
  keyFile.exists(),
]);

if (certExists && keyExists) {
  try {
    console.log("SSL certificates found, using HTTPS");
    Bun.serve({
      fetch: app.fetch,
      websocket,
      port: PORT,
      tls: {
        cert: await certFile.text(),
        key: await keyFile.text(),
      },
    });
  } catch (error) {
    console.error("Error loading SSL certificates:", error);
    console.log("Falling back to HTTP due to certificate loading error");
    Bun.serve({
      fetch: app.fetch,
      websocket,
      port: PORT,
    });
  }
} else {
  console.log("SSL certificates not found, using HTTP");
  Bun.serve({
    fetch: app.fetch,
    websocket,
    port: PORT,
  });
}

console.log(`Server is running on port ${PORT}`);
