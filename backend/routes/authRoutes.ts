import { Hono } from "hono";
import { login, register } from "../controllers/authController";

const router = new Hono();

router
  .post("/api/auth/login", login)
  .post("/api/auth/register", register);

export default router;
