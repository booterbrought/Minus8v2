import { Router } from "https://deno.land/x/oak/mod.ts";
import { createGame } from "../controllers/lobbyController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = new Router();

router
  .post("/api/game", authMiddleware, createGame)

export default router;
