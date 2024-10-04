import { Context } from "https://deno.land/x/oak@v17.0.0/mod.ts";

export const authMiddleware = async (ctx: Context, next: () => Promise<unknown>) => {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader || !isValidToken(authHeader)) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  await next();
};

function isValidToken(token: string): boolean {
  // Implement your token validation logic here
  return true; // Replace with actual validation
}
