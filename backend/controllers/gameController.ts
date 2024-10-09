import { RouterContext } from "https://deno.land/x/oak@v17.0.0/mod.ts";
import { Game } from "../models/gameState.ts";

export const gameList: Map<string, Game> = new Map();

export const getGameState = (
  ctx: RouterContext<"/game/:id", { id: string }>,
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
  ctx: RouterContext<
    "/game/:id/move",
    { id: string },
    {
      playerId: string;
      row: number;
      col: number;
    }
  >,
) => {
  const gameId = ctx.params.id;
  const game = gameList.get(gameId);

  if (!game) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Game not found" };
    return;
  }

  const { playerId, row, col } = await ctx.request.body.json();

  // Corrected comparison: Compare player IDs instead of Player object with string
  if (game.players[game.currentTurn].id !== playerId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Not your turn" };
    return;
  }

  // Move Validity Check
  const [currentRow, currentCol] = game.currentCell;
  if (game.currentTurn === 0) {
    // Player 1: Horizontal move (same row)
    if (row !== currentRow) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid move: Player 1 must move horizontally" };
      return;
    }
  } else {
    // Player 2: Vertical move (same column)
    if (col !== currentCol) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid move: Player 2 must move vertically" };
      return;
    }
  }

  if (row < 0 || row > 7 || col < 0 || col > 7 || game.board[row][col] === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid move" };
    return;
  }

  // Check if the cell has already been eaten
  if (game.moves.some((move) => move[0] === row && move[1] === col)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Cell already eaten" };
    return;
  }

  // Update the player's score
  game.scores[game.currentTurn] += game.board[row][col];

  // Update the move logic here
  game.currentTurn = 1 - game.currentTurn;
  game.moves.push([row, col]);
  
  // Update currentCell
  game.currentCell = [row, col];

  ctx.response.body = { success: true, scores: game.scores };
};