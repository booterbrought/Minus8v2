import { Router } from "https://deno.land/x/oak@v17.0.0/mod.ts";
import { createGame, joinGame } from "../controllers/lobbyController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = new Router();

router
  .post("/game", authMiddleware, createGame)
  .post("/game/:id/join", authMiddleware, joinGame);

export default router;
