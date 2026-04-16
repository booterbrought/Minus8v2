import type { Context } from "hono";
import { Game } from "../models/gameState";
import { generateBoard } from "../utils/generateBoard";
import { gameList } from "./gameController";
import { saveGame } from "../db/database";

export const createGame = async (c: Context) => {
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
  saveGame(gameId, game);
  console.log("Game created: ", gameId);
  return c.json({ gameId });
};

function getRandomCell(): [number, number] {
  const row = Math.floor(Math.random() * 8);
  const col = Math.floor(Math.random() * 8);
  return [row, col];
}
