import { Database } from "bun:sqlite";
import { Game, Player, GameResult } from "../models/gameState";

let db: Database;

export function initDb(): void {
  db = new Database("backend/db/games.db");
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
      score INTEGER NOT NULL DEFAULT 0,
      turn_order INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `);

  console.log("Database initialized");
}

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
      "INSERT INTO players (id, game_id, name, score, turn_order) VALUES (?, ?, ?, ?, ?)",
    ).run(p.id, gameId, p.name, game.scores[i], i);
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
    "SELECT id, name FROM players WHERE game_id = ? ORDER BY turn_order",
  ).all(gameId) as { id: string; name: string }[];
  return rows.map(({ id, name }) => ({ id, name }));
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
