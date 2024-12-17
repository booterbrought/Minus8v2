import { Context } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

// In-memory user storage (replace with database in production)
const users = new Map<string, { username: string; password: string }>();

const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"]
);

export const login = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const { username, password } = body;

    const user = users.get(username);
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid credentials" };
      return;
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid credentials" };
      return;
    }

    // Create JWT token
    const token = await create(
      { alg: "HS512", typ: "JWT" },
      { username, exp: Date.now() + 24 * 60 * 60 * 1000 }, // 24 hour expiration
      key
    );

    ctx.response.body = { token };
  } catch (error) {
    console.error("Login error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};

export const register = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const { username, password } = body;

    if (users.has(username)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Username already exists" };
      return;
    }

    // Hash password
    const hashedPassword = await hash(password);
    users.set(username, { username, password: hashedPassword });

    ctx.response.status = 201;
    ctx.response.body = { message: "User created successfully" };
  } catch (error) {
    console.error("Registration error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};

