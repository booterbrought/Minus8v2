import { Hono } from "hono";
import { login, register, telegramAuth } from "../controllers/authController";

const router = new Hono();

router
  .post("/api/auth/login", login)
  .post("/api/auth/register", register)
  .post("/api/auth/telegram", telegramAuth);

export default router;
