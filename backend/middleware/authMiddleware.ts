import { Context } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

export const authMiddleware = async (ctx: Context, next: () => Promise<unknown>) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader) {
      ctx.response.status = 401;
      ctx.response.body = { error: "No authorization header" };
      return;
    }

    // Get the key from authController (you might want to refactor this into a shared config)
    const key = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-512" },
      true,
      ["sign", "verify"]
    );

    try {
      const payload = await verify(authHeader, key);
      ctx.state.user = payload;
      await next();
    } catch (error) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid token" };
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};
