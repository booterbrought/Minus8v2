import { Hono } from "hono";
import { createGame } from "../controllers/lobbyController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = new Hono();

router
  .post("/api/game", authMiddleware, createGame);

export default router;
