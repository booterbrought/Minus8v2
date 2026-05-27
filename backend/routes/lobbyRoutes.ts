import { Hono } from "hono";
import { createGame } from "../controllers/lobbyController";
import { optionalAuthMiddleware } from "../middleware/authMiddleware";

const router = new Hono();

router
  .post("/api/game", optionalAuthMiddleware, createGame);

export default router;
