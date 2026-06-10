import { Database } from "bun:sqlite";
import { Game, Player, GameResult } from "../models/gameState";

let db: Database;

export function initDb(): void {
  db = new Database(import.meta.dir + "/data/games.db");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'waiting',
      current_turn INTEGER NOT NULL DEFAULT 0,
      board TEXT NOT NULL,
      current_cell TEXT NOT NULL,
      moves TEXT NOT NULL DEFAULT '[]',
      scores TEXT NOT NULL DEFAULT '[]',
      result TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      name TEXT NOT NULL,
      user_id TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      turn_order INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      elo INTEGER NOT NULL DEFAULT 1000,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS game_results (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      user_id TEXT,
      player_name TEXT NOT NULL,
      turn_order INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL,
      result TEXT NOT NULL,
      finished_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migrate existing tables: add columns if they don't exist
  const cols = (s: string) =>
    db.prepare("PRAGMA table_info(" + s + ")").all() as { name: string }[];

  if (!cols("users").some((c) => c.name === "elo")) {
    db.exec("ALTER TABLE users ADD COLUMN elo INTEGER NOT NULL DEFAULT 1000");
  }
  if (!cols("players").some((c) => c.name === "user_id")) {
    db.exec("ALTER TABLE players ADD COLUMN user_id TEXT");
  }
  if (!cols("game_results").some((c) => c.name === "user_id")) {
    db.exec("ALTER TABLE game_results ADD COLUMN user_id TEXT");
  }
  if (!cols("game_results").some((c) => c.name === "turn_order")) {
    db.exec("ALTER TABLE game_results ADD COLUMN turn_order INTEGER NOT NULL DEFAULT 0");
  }

  console.log("Database initialized");
}

// --- User operations ---

export interface DbUser {
  id: string;
  username: string;
  password_hash: string;
  elo: number;
  created_at: string;
}

export function registerUser(id: string, username: string, passwordHash: string): void {
  db.prepare(
    "INSERT INTO users (id, username, password_hash, elo) VALUES (?, ?, ?, 1000)",
  ).run(id, username, passwordHash);
}

export function findUserByUsername(username: string): DbUser | null {
  return db.prepare(
    "SELECT id, username, password_hash, elo, created_at FROM users WHERE username = ?",
  ).get(username) as DbUser | null;
}

export function getUserById(id: string): DbUser | null {
  return db.prepare(
    "SELECT id, username, password_hash, elo, created_at FROM users WHERE id = ?",
  ).get(id) as DbUser | null;
}

export function getUserElo(id: string): number {
  const row = db.prepare("SELECT elo FROM users WHERE id = ?").get(id) as { elo: number } | null;
  return row?.elo ?? 1000;
}

export function updateUserElo(id: string, elo: number): void {
  db.prepare("UPDATE users SET elo = ? WHERE id = ?").run(Math.round(elo), id);
}

// --- Game results ---

export function saveGameResult(gameId: string, game: Game): void {
  const results = game.players.map((p, i) => ({
    id: crypto.randomUUID(),
    gameId,
    playerId: p.id,
    userId: p.userId ?? null,
    playerName: p.name,
    turnOrder: i,
    score: game.scores[i],
    result: game.result,
  }));

  const stmt = db.prepare(
    "INSERT INTO game_results (id, game_id, player_id, user_id, player_name, turn_order, score, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const r of results) {
    stmt.run(r.id, r.gameId, r.playerId, r.userId, r.playerName, r.turnOrder, r.score, r.result);
  }
}

export function calculateAndUpdateElo(game: Game): void {
  const p0 = game.players[0];
  const p1 = game.players[1];
  if (!p0.userId || !p1.userId) return;

  const elo0 = getUserElo(p0.userId);
  const elo1 = getUserElo(p1.userId);

  const expected0 = 1 / (1 + 10 ** ((elo1 - elo0) / 400));
  const expected1 = 1 - expected0;

  let actual0: number;
  if (game.result === "player1_wins") { actual0 = 1; }
  else if (game.result === "player2_wins") { actual0 = 0; }
  else { actual0 = 0.5; }
  const actual1 = 1 - actual0;

  const K = 32;
  updateUserElo(p0.userId, elo0 + K * (actual0 - expected0));
  updateUserElo(p1.userId, elo1 + K * (actual1 - expected1));
}

export interface GameHistoryEntry {
  game_id: string;
  player_name: string;
  player_user_id: string | null;
  score: number;
  result: string;
  finished_at: string;
}

export function getGameHistory(limit = 20): GameHistoryEntry[] {
  return db.prepare(
    "SELECT game_id, player_name, user_id as player_user_id, score, result, finished_at FROM game_results ORDER BY finished_at DESC LIMIT ?",
  ).all(limit) as GameHistoryEntry[];
}

export function getGameHistoryByUser(userId: string, limit = 20): GameHistoryEntry[] {
  return db.prepare(
    "SELECT game_id, player_name, user_id as player_user_id, score, result, finished_at FROM game_results WHERE user_id = ? ORDER BY finished_at DESC LIMIT ?",
  ).all(userId, limit) as GameHistoryEntry[];
}

export interface RecentGameEntry {
  game_id: string;
  p1_name: string;
  p1_user_id: string | null;
  p1_score: number;
  p2_name: string;
  p2_user_id: string | null;
  p2_score: number;
  result: string;
  finished_at: string;
}

export function getRecentGames(limit = 20): RecentGameEntry[] {
  return db.prepare(`
    SELECT
      a.game_id,
      a.player_name AS p1_name,
      a.user_id AS p1_user_id,
      a.score AS p1_score,
      b.player_name AS p2_name,
      b.user_id AS p2_user_id,
      b.score AS p2_score,
      a.result,
      a.finished_at
    FROM game_results a
    JOIN game_results b ON a.game_id = b.game_id AND a.turn_order = 0 AND b.turn_order = 1
    ORDER BY a.finished_at DESC
    LIMIT ?
  `).all(limit) as RecentGameEntry[];
}

export interface UserStats {
  wins: number;
  losses: number;
  draws: number;
  total: number;
}

export function getUserStats(userId: string): UserStats {
  const rows = db.prepare(`
    SELECT result, turn_order FROM game_results WHERE user_id = ?
  `).all(userId) as { result: string; turn_order: number }[];

  let wins = 0, losses = 0, draws = 0;
  for (const row of rows) {
    if (row.result === "draw") draws++;
    else if ((row.result === "player1_wins" && row.turn_order === 0) ||
             (row.result === "player2_wins" && row.turn_order === 1)) {
      wins++;
    } else {
      losses++;
    }
  }
  return { wins, losses, draws, total: rows.length };
}

export interface UserProfile {
  username: string;
  elo: number;
  stats: UserStats;
  recentGames: RecentGameEntry[];
}

export function getUserProfile(userId: string): UserProfile | null {
  const user = getUserById(userId);
  if (!user) return null;

  const stats = getUserStats(userId);
  const recentGames = db.prepare(`
    SELECT
      a.game_id,
      a.player_name AS p1_name,
      a.user_id AS p1_user_id,
      a.score AS p1_score,
      b.player_name AS p2_name,
      b.user_id AS p2_user_id,
      b.score AS p2_score,
      a.result,
      a.finished_at
    FROM game_results a
    JOIN game_results b ON a.game_id = b.game_id AND a.turn_order = 0 AND b.turn_order = 1
    WHERE a.user_id = ? OR b.user_id = ?
    ORDER BY a.finished_at DESC
    LIMIT 5
  `).all(userId, userId) as RecentGameEntry[];

  return {
    username: user.username,
    elo: user.elo,
    stats,
    recentGames,
  };
}

export interface LeaderboardEntry {
  username: string;
  elo: number;
}

export function getLeaderboard(limit = 20): LeaderboardEntry[] {
  return db.prepare(
    "SELECT username, elo FROM users ORDER BY elo DESC LIMIT ?",
  ).all(limit) as LeaderboardEntry[];
}

// --- Existing game operations ---

export function saveGame(gameId: string, game: Game): void {
  const board = JSON.stringify(game.board);
  const currentCell = JSON.stringify(game.currentCell);
  const moves = JSON.stringify(game.moves);
  const scores = JSON.stringify(game.scores);

  db.prepare(
    `INSERT INTO games (id, status, current_turn, board, current_cell, moves, scores, result)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       current_turn = excluded.current_turn,
       board = excluded.board,
       current_cell = excluded.current_cell,
       moves = excluded.moves,
       scores = excluded.scores,
       result = excluded.result`,
  ).run(gameId, game.status, game.currentTurn, board, currentCell, moves, scores, game.result);

  // Replace players for this game
  db.prepare("DELETE FROM players WHERE game_id = ?").run(gameId);
  for (let i = 0; i < game.players.length; i++) {
    const p = game.players[i];
    db.prepare(
      "INSERT INTO players (id, game_id, name, user_id, score, turn_order) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(p.id, gameId, p.name, p.userId ?? null, game.scores[i], i);
  }
}

export function loadGame(gameId: string): Game | null {
  const row = db.prepare(
    "SELECT status, current_turn, board, current_cell, moves, scores, result FROM games WHERE id = ?",
  ).get(gameId) as DbGameRow | null;

  if (!row) return null;

  const players = loadPlayers(gameId);
  const board = JSON.parse(row.board) as number[][];
  const currentCell = JSON.parse(row.current_cell) as [number, number];
  const moves = JSON.parse(row.moves) as [number, number][];
  const scores = JSON.parse(row.scores) as number[];

  return new Game(players, row.current_turn, board, currentCell, moves, scores, row.status, row.result as GameResult);
}

export function loadActiveGames(): Map<string, Game> {
  const games = new Map<string, Game>();
  const rows = db.prepare(
    "SELECT id FROM games WHERE status != 'finished'",
  ).all() as { id: string }[];

  for (const { id } of rows) {
    const game = loadGame(id);
    if (game) games.set(id, game);
  }

  return games;
}

function loadPlayers(gameId: string): Player[] {
  const rows = db.prepare(
    "SELECT id, name, user_id FROM players WHERE game_id = ? ORDER BY turn_order",
  ).all(gameId) as { id: string; name: string; user_id: string | null }[];
  return rows.map(({ id, name, user_id }) => ({ id, name, userId: user_id ?? undefined }));
}

interface DbGameRow {
  status: string;
  current_turn: number;
  board: string;
  current_cell: string;
  moves: string;
  scores: string;
  result: string;
}
