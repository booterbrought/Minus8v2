import { Context, RouterContext } from "https://deno.land/x/oak/mod.ts";
import { Game, Player } from "../models/gameState.ts";
import { generateBoard } from "../utils/generateBoard.ts";
import { gameList } from "./gameController.ts";

export const createGame = async (ctx: Context) => {
  const gameId = crypto.randomUUID();
  const game = new Game(
    [],
    0,
    generateBoard(),
    getRandomCell(),
    [],
    [],
    "waiting"
  );
  gameList.set(gameId, game);
  console.log("Game created: ", gameId);
  ctx.response.body = { gameId };
};

export const joinGame = async (ctx: RouterContext<"/join/:id", { id: string }>) => {
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

  const { name } = await ctx.request.body.json();
  const playerId = crypto.randomUUID();
  const newPlayer: Player = { id: playerId, name };
  
  game.addPlayer(newPlayer);
  
  ctx.response.body = { playerId, name };
  console.log("Player joined: ", playerId, name);
};

function getRandomCell(): [number, number] {
  const row = Math.floor(Math.random() * 8);
  const col = Math.floor(Math.random() * 8);
  return [row, col];
}
