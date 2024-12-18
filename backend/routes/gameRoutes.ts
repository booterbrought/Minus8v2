import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { getGameState, makeMove, joinGame, createGame } from "../controllers/gameController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = new Router();

router
  .get("/api/game/:id", getGameState)
  .post("/api/game/:id/move", makeMove)
  .post("/api/game/:id/join", joinGame)
  .post("/api/game", createGame);

export default router;
