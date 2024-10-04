import { Context, RouterContext } from "https://deno.land/x/oak@v17.0.0/mod.ts";
import { Game } from "../models/gameState.ts";
import { generateBoard } from "../utils/generateBoard.ts";
import { gameList } from "./gameController.ts";

export const createGame = (ctx: Context) => {
  const gameId = crypto.randomUUID();
  gameList.set(gameId, new Game([], 0, generateBoard(), getRandomCell()));
  console.log("Game created: ", gameId);
  ctx.response.body = { gameId };
};

export const joinGame = (ctx: RouterContext<any, any, any>) => {
  const gameId = ctx.params.id;
  const game = gameList.get(gameId);

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

  const playerId = crypto.randomUUID();
  game.players.push(playerId);
  if (game.players.length === 2) {
    game.status = "playing";
  }
  ctx.response.body = { playerId };
  console.log("Player joined: ", playerId);
};

function getRandomCell(): [number, number] {
  const row = Math.floor(Math.random() * 8);
  const col = Math.floor(Math.random() * 8);
  return [row, col];
}
