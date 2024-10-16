import { Router } from "https://deno.land/x/oak/mod.ts";
import { login, register } from "../controllers/authController.ts";

const router = new Router();

router
  .post("/api/auth/login", login)
  .post("/api/auth/register", register);

export default router;
