import type { Context } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  registerUser,
  registerTelegramUser,
  findUserByUsername,
  findUserByTelegramId,
} from "../db/database";

const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

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

  return c.json({ token: id, userId: id, username: name, elo: 1000 });
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

  return c.json({ token: user.id, userId: user.id, username: user.username, elo: user.elo });
};

interface TelegramUser {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

function verifyInitData(initData: string, botToken: string): TelegramUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  // Telegram spec: data_check_string = every field except hash, as key=value,
  // sorted by key, joined with newlines. The key is HMAC_SHA256("WebAppData", botToken).
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const expected = Buffer.from(hash, "hex");
  if (expected.length !== computed.length / 2 || !timingSafeEqual(expected, Buffer.from(computed, "hex"))) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE_SECONDS) {
    return null;
  }

  try {
    return JSON.parse(params.get("user") || "null") as TelegramUser | null;
  } catch {
    return null;
  }
}

function telegramDisplayName(user: TelegramUser): string {
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const name = full || (user.username ? `@${user.username}` : `Player ${user.id}`);
  return name.slice(0, 30);
}

export const telegramAuth = async (c: Context) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return c.json({ error: "Telegram auth is not configured" }, 500);
  }

  let body: { initData?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (typeof body.initData !== "string" || !body.initData) {
    return c.json({ error: "initData is required" }, 400);
  }

  const tgUser = verifyInitData(body.initData, botToken);
  if (!tgUser || tgUser.id == null) {
    return c.json({ error: "Invalid Telegram authentication" }, 401);
  }

  const telegramId = String(tgUser.id);
  const existing = findUserByTelegramId(telegramId);
  if (existing) {
    return c.json({ token: existing.id, userId: existing.id, username: existing.username, elo: existing.elo });
  }

  const baseName = telegramDisplayName(tgUser);
  let name = baseName;
  let suffix = 1;
  while (findUserByUsername(name)) {
    name = `${baseName.slice(0, 24)} #${telegramId.slice(-4)}${suffix > 1 ? `-${suffix}` : ""}`;
    suffix++;
  }

  const id = crypto.randomUUID();
  registerTelegramUser(id, telegramId, name);
  return c.json({ token: id, userId: id, username: name, elo: 1000 });
};
