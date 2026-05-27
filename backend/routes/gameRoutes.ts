import { Hono } from "hono";
import { getGameState, makeMove, joinGame, history } from "../controllers/gameController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware";

const router = new Hono();

router
  .get("/api/game/:id", optionalAuthMiddleware, getGameState)
  .post("/api/game/:id/move", optionalAuthMiddleware, makeMove)
  .post("/api/game/:id/join", optionalAuthMiddleware, joinGame)
  .get("/api/history", history)
  .get("/api/history/:userId", history);

export default router;
