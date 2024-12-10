import { Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { getGameState, makeMove, joinGame } from "../controllers/gameController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = new Router();

router
  .get("/api/game/:id", authMiddleware, getGameState)
  .post("/api/game/:id/move", authMiddleware, makeMove)
  .post("/api/game/:id/join", authMiddleware, joinGame);

export default router;
