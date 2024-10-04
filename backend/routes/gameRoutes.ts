import { Router } from "https://deno.land/x/oak@v17.0.0/mod.ts";
import { getGameState, makeMove } from "../controllers/gameController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = new Router();

router
  .get("/game/:id", authMiddleware, getGameState)
  .post("/game/:id/move", authMiddleware, makeMove);

export default router;
