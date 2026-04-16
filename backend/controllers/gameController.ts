import type { Context } from "hono";
import { Game } from "../models/gameState";
import { wsConnections } from "../routes/ws";
import { saveGame } from "../db/database";

export const gameList: Map<string, Game> = new Map();

export const getGameState = (c: Context) => {
  const gameId = c.req.param("id");
  const game = gameList.get(gameId);

  if (!game) {
    return c.json({ error: "Game not found" }, 404);
  }

  return c.json(game);
};

export const makeMove = async (c: Context) => {
  const gameId = c.req.param("id");
  const game = gameList.get(gameId);

  if (!game) {
    return c.json({ error: "Game not found" }, 404);
  }

  let body: { playerId?: unknown; row?: unknown; col?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { playerId, row, col } = body;

  if (typeof playerId !== "string" || !playerId.trim()) {
    return c.json({ error: "playerId must be a non-empty string" }, 400);
  }
  if (typeof row !== "number" || !Number.isInteger(row) || row < 0 || row > 7) {
    return c.json({ error: "row must be an integer between 0 and 7" }, 400);
  }
  if (typeof col !== "number" || !Number.isInteger(col) || col < 0 || col > 7) {
    return c.json({ error: "col must be an integer between 0 and 7" }, 400);
  }

  const validationError = validateMove(game, playerId, row, col);
  if (validationError) {
    return c.json({ error: validationError }, 400);
  }

  updateGameState(game, row, col);
  checkGameEnd(game);
  saveGame(gameId, game);
  notifyPlayers(game);

  return c.json({ success: true, scores: game.scores });
};

export const joinGame = async (c: Context) => {
  const gameId = c.req.param("id");
  const game = gameList.get(gameId);

  if (!game) {
    return c.json({ error: "Game not found" }, 404);
  }

  if (game.players.length >= 2) {
    return c.json({ error: "Game is full" }, 400);
  }

  let body: { name?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 30) {
    return c.json({ error: "Name must be 1-30 characters" }, 400);
  }

  const playerId = crypto.randomUUID();
  game.addPlayer({ id: playerId, name });
  saveGame(gameId, game);
  notifyPlayers(game);

  console.log("Player joined: ", playerId, name);
  return c.json({ playerId, name });
};

function updateGameState(game: Game, row: number, col: number) {
  game.scores[game.currentTurn] += game.board[row][col];
  game.currentTurn = 1 - game.currentTurn;
  game.moves.push([row, col]);
  game.currentCell = [row, col];
}

function checkGameEnd(game: Game) {
  const validMoves = game.getValidMoves();
  if (validMoves.length === 0) {
    game.status = "finished";
    game.result = game.determineResult();
  }
}

const validateMove = (game: Game, playerId: string, row: number, col: number): string | null => {
  if (game.players[game.currentTurn].id !== playerId) {
    return "Not your turn";
  }

  const [currentRow, currentCol] = game.currentCell;
  if (game.currentTurn === 0) {
    // Player 1: Horizontal move (same row)
    if (row !== currentRow) {
      return "Invalid move: Player 1 must move horizontally";
    }
  } else {
    // Player 2: Vertical move (same column)
    if (col !== currentCol) {
      return "Invalid move: Player 2 must move vertically";
    }
  }

  if (game.board[row][col] === 0) {
    return "Cell is empty";
  }

  if (game.moves.some((move) => move[0] === row && move[1] === col)) {
    return "Cell already eaten";
  }

  if (game.status !== "playing") {
    return "Game is not in progress";
  }

  return null; // Move is valid
};

function notifyPlayers(game: Game) {
  game.players.forEach(player => {
    const ws = wsConnections.get(player.id);
    if (ws) {
      ws.send(JSON.stringify({ game }));
    }
  });
}
