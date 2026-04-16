import type { Context } from "hono";
import { registerUser, findUserByUsername } from "../db/database";

export const register = async (c: Context) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>();

  const name = username.trim();
  if (!name || name.length > 30) {
    return c.json({ error: "Username must be 1-30 characters" }, 400);
  }
  if (!password || password.length < 4) {
    return c.json({ error: "Password must be at least 4 characters" }, 400);
  }

  const existing = findUserByUsername(name);
  if (existing) {
    return c.json({ error: "Username already taken" }, 409);
  }

  const id = crypto.randomUUID();
  const hash = await Bun.password.hash(password);
  registerUser(id, name, hash);

  return c.json({ token: id, userId: id, username: name });
};

export const login = async (c: Context) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>();

  const user = findUserByUsername(username.trim());
  if (!user) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const valid = await Bun.password.verify(password, user.password_hash);
  if (!valid) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  return c.json({ token: user.id, userId: user.id, username: user.username });
};
