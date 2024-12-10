import { Context, RouterContext } from "https://deno.land/x/oak/mod.ts";
import { Game } from "../models/gameState.ts";
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

function getRandomCell(): [number, number] {
  const row = Math.floor(Math.random() * 8);
  const col = Math.floor(Math.random() * 8);
  return [row, col];
}
