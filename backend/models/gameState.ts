import { ObjectId } from "https://deno.land/x/mongo@v0.33.0/mod.ts";

export interface Player {
  id: string;
  name: string;
}

export class Game {
  _id: ObjectId;
  players: Player[];
  currentTurn: number;
  board: number[][];
  currentCell: [number, number];
  moves: [number, number][];
  scores: number[];
  status: "waiting" | "playing" | "finished";

  constructor(
    _id: ObjectId = new ObjectId(),
    players: Player[] = [],
    currentTurn: number = 0,
    board: number[][] = [],
    currentCell: [number, number] = [0, 0],
    moves: [number, number][] = [],
    scores: number[] = [],
    status: "waiting" | "playing" | "finished" = "waiting",
  ) {
    this._id = _id;
    this.players = players;
    this.currentTurn = currentTurn;
    this.board = board;
    this.currentCell = currentCell;
    this.moves = moves;
    this.scores = scores;
    this.status = status;
  }

  addPlayer(player: Player) {
    if (this.players.length < 2) {
      this.players.push(player);
      this.scores.push(0);
      if (this.players.length === 2) {
        this.status = "playing";
      }
    }
  }

  getPlayerById(id: string): Player | undefined {
    return this.players.find(player => player.id === id);
  }

  updateScore(playerId: string, score: number) {
    const playerIndex = this.players.findIndex(player => player.id === playerId);
    if (playerIndex !== -1) {
      this.scores[playerIndex] = score;
    }
  }
}
