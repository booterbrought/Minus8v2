import { RouterContext } from "https://deno.land/x/oak@v17.0.0/mod.ts";
import { Game } from "../models/gameState.ts";

export const gameList: Map<string, Game> = new Map();

export const getGameState = (
  ctx: RouterContext<"/game/:id", {
    id: string;
  } & Record<string | number, string | undefined>, Record<string, any>>
) => {
  const gameId = ctx.params.id;
  const game = gameList.get(gameId);

  if (!game) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Game not found" };
    return;
  }

  ctx.response.body = game;
};

export const makeMove = async (
  ctx: RouterContext<"/game/:id/move", {
    id: string;
  } & Record<string | number, string | undefined>, {
    playerId: string;
    row: number;
    col: number;
  }>
) => {
  const gameId = ctx.params.id;
  const game = gameList.get(gameId);

  if (!game) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Game not found" };
    return;
  }

  const { playerId, row, col } = await ctx.request.body.json();

  if (game.players[game.currentTurn] !== playerId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Not your turn" };
    return;
  }

  if (row < 0 || row > 7 || col < 0 || col > 7 || game.board[row][col] === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid move" };
    return;
  }

  // Check if the cell has already been eaten
  if (game.moves.some(move => move[0] === row && move[1] === col)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Cell already eaten" };
    return;
  }

  // Update the player's score
  game.scores[game.currentTurn] += game.board[row][col];

  // Update the move logic here
  game.currentTurn = 1 - game.currentTurn;
  game.moves.push([row, col]);

  ctx.response.body = { success: true, scores: game.scores };
};
