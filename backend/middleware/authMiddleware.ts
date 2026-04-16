import type { Context, Next } from "hono";

export const authMiddleware = async (c: Context, next: Next) => {
  // const authHeader = c.req.header("Authorization");
  // if (!authHeader || !isValidToken(authHeader)) {
  //   return c.json({ error: "Unauthorized" }, 401);
  // }
  await next();
};

function isValidToken(token: string): boolean {
  // Implement your token validation logic here
  return true; // Replace with actual validation
}
