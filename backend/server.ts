import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import authRoutes from "./routes/authRoutes.ts";
import lobbyRoutes from "./routes/lobbyRoutes.ts";
import gameRoutes from "./routes/gameRoutes.ts";
import { wsHandler } from "./routes/ws.ts";
const PORT = 8000;

const app = new Application();
const router = new Router();

// CORS Middleware
app.use(async (ctx, next) => {
  await next();
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
});

router.get("/api/ws/:playerId", wsHandler);

// API Routes
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

app.use(lobbyRoutes.routes());
app.use(lobbyRoutes.allowedMethods());

app.use(gameRoutes.routes());
app.use(gameRoutes.allowedMethods());

// Serve Static Frontend Files
app.use(async (ctx, next) => {
  const path = ctx.request.url.pathname;

  // If the request starts with /api, skip to the next middleware
  if (path.startsWith("/api")) {
    return next();
  }

  try {
    // Attempt to serve the requested file
    await send(ctx, path, {
      root: `${Deno.cwd()}/frontend/dist`,
      index: "index.html",
    });
  } catch {
    // If the file is not found, serve index.html for client-side routing
    await send(ctx, "/index.html", {
      root: `${Deno.cwd()}/frontend/dist`,
    });
  }
});

// Add health check route
router.get("/api/health", (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = { status: "healthy" };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start the Server
console.log(`Server is running on port ${PORT}`);
await app.listen({ port: PORT });
