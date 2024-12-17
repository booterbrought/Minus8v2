import { RouterContext, Context } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { Game, Player } from "../models/gameState.ts";
import { wsConnections } from "../routes/ws.ts";
import { ObjectId } from "https://deno.land/x/mongo@v0.33.0/mod.ts";
import db from "../db.ts";
import { generateBoard } from "../utils/generateBoard.ts";

export const gameList: Map<ObjectId, Game> = new Map();

export const createGame = async (ctx: Context) => {
  const gameId = new ObjectId();
  const game = new Game(
    gameId,
    [],
    0,
    generateBoard(),
    getRandomCell(),
    [],
    [],
    "waiting",
  );
  gameList.set(gameId, game);
  console.log("Game created: ", gameId);
  ctx.response.body = { gameId };
};

function getRandomCell(): [number, number] {
  const row = Math.floor(Math.random() * 8);
  const col = Math.floor(Math.random() * 8);
  return [row, col];
}

export const getGameState = (
  ctx: RouterContext<"/api/game/:id", { id: string }>,
) => {
  const gameId = ctx.params.id;
  const game = gameList.get(new ObjectId(gameId));

  if (!game) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Game not found" };
    return;
  }

  ctx.response.body = game;
};

export const makeMove = async (
  ctx: RouterContext<
    "/api/game/:id/move",
    { id: string },
    {
      playerId: string;
      row: number;
      col: number;
    }
  >,
) => {
  const gameId = ctx.params.id;
  const game = gameList.get(new ObjectId(gameId));

  if (!game) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Game not found" };
    return;
  }

  const { playerId, row, col } = await ctx.request.body.json();

  const validationError = validateMove(game, playerId, row, col);
  if (validationError) {
    ctx.response.status = 400;
    ctx.response.body = { error: validationError };
    return;
  }

  updateGameState(game, row, col);
  ctx.response.body = { success: true, scores: game.scores };
};

export const joinGame = async (
  ctx: RouterContext<"/api/game/:id/join", { id: string }>,
) => {
  const gameId = ctx.params.id;
  const game = gameList.get(new ObjectId(gameId));

  if (!game) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Game not found" };
    return;
  }

  if (game.players.length >= 2) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Game is full" };
    return;
  }

  const { name } = await ctx.request.body.json();
  const playerId = crypto.randomUUID();
  const newPlayer: Player = { id: playerId, name };

  game.addPlayer(newPlayer);
  notifyPlayers(game);

  ctx.response.body = { playerId, name };
  console.log("Player joined: ", playerId, name);
};

function updateGameState(game: Game, row: number, col: number) {
  game.scores[game.currentTurn] += game.board[row][col];
  game.currentTurn = 1 - game.currentTurn;
  game.moves.push([row, col]);
  game.currentCell = [row, col];

  // Notify each player about the updated game state
  notifyPlayers(game);
}

const validateMove = (
  game: Game,
  playerId: string,
  row: number,
  col: number,
): string | null => {
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

  if (row < 0 || row > 7 || col < 0 || col > 7 || game.board[row][col] === 0) {
    return "Invalid move";
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
  game.players.forEach((player) => {
    const ws = wsConnections.get(player.id);
    if (ws) {
      ws.send(JSON.stringify({ game }));
    }
  });
}

async function saveGame(game: Game): Promise<ObjectId> {

  await db.collection("games").updateOne(
    { _id: game._id },
    { $set: game },
    { upsert: true },
  );
  return game._id;

}

export async function findGameById(id: string): Promise<Game | null | undefined> {
  if (!gameList.has(new ObjectId(id))) {
    const gameData = await db.collection("games").findOne({
      _id: new ObjectId(id),
    });

    if (!gameData) return null;

    const game = new Game(
      gameData.players,
      gameData.currentTurn,
      gameData.board,
      gameData.currentCell,
      gameData.moves,
      gameData.scores,
      gameData.status,
      gameData._id,
    );

    gameList.set(game._id, game);
    return game;
  } else {
    return gameList.get(new ObjectId(id));
  }
}
