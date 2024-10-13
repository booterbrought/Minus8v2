import { Router } from "https://deno.land/x/oak/mod.ts";
import { getGameState, makeMove } from "../controllers/gameController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = new Router();

router
  .get("/api/game/:id", authMiddleware, getGameState)
  .post("/api/game/:id/move", authMiddleware, makeMove);

export default router;
