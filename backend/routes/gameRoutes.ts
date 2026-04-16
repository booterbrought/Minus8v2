import { Hono } from "hono";
import { getGameState, makeMove, joinGame, history } from "../controllers/gameController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = new Hono();

router
  .get("/api/game/:id", authMiddleware, getGameState)
  .post("/api/game/:id/move", authMiddleware, makeMove)
  .post("/api/game/:id/join", authMiddleware, joinGame)
  .get("/api/history", history)
  .get("/api/history/:userId", history);

export default router;
