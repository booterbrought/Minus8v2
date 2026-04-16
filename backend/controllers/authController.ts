import type { Context } from "hono";

export const login = async (c: Context) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>();
  const token = crypto.randomUUID();
  return c.json({ token });
};

export const register = async (c: Context) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>();
  return c.json({ message: "User registered successfully" });
};
