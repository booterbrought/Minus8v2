import { Application, Router, send } from "https://deno.land/x/oak@v17.1.3/mod.ts";
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

// Check if SSL certificates exist
const certPath = "/etc/letsencrypt/live/dmbr.lv/fullchain.pem";
const keyPath = "/etc/letsencrypt/live/dmbr.lv/privkey.pem";

// Helper function to check if a file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

// Check if both certificate files exist
const certExists = await fileExists(certPath);
const keyExists = await fileExists(keyPath);

if (certExists && keyExists) {
  try {
    // Start with HTTPS - reading the actual certificate files
    console.log("SSL certificates found, using HTTPS");
    const certFile = await Deno.readTextFile(certPath);
    const keyFile = await Deno.readTextFile(keyPath);
    
    await app.listen({
      port: PORT,
      secure: true,
      cert: certFile,
      key: keyFile,
    });
  } catch (error) {
    console.error("Error loading SSL certificates:", error);
    // Fallback to HTTP if certificate loading fails
    console.log("Falling back to HTTP due to certificate loading error");
    await app.listen({ port: PORT });
  }
} else {
  // Start with HTTP
  console.log("SSL certificates not found, using HTTP");
  await app.listen({ port: PORT });
}
