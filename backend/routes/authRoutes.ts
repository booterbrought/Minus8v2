import { Router } from "https://deno.land/x/oak@v17.0.0/mod.ts";
import { login, register } from "../controllers/authController.ts";

const router = new Router();

router
  .post("/auth/login", login)
  .post("/auth/register", register);

export default router;
