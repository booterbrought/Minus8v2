import { Application } from "https://deno.land/x/oak@v17.0.0/mod.ts";
import authRoutes from "./routes/authRoutes.ts";
import lobbyRoutes from "./routes/lobbyRoutes.ts";
import gameRoutes from "./routes/gameRoutes.ts";

const app = new Application();

app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

app.use(lobbyRoutes.routes());
app.use(lobbyRoutes.allowedMethods());

app.use(gameRoutes.routes());
app.use(gameRoutes.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
