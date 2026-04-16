import type { Context, Next } from "hono";
import { getUserById } from "../db/database";

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = getUserById(token);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", user.id);
  c.set("username", user.username);
  await next();
};
