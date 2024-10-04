export class Game {
  players: string[];
  currentTurn: number;
  board: number[][];
  currentCell: [number, number];
  moves: [number, number][];
  scores: number[]; // New property to track scores
  status: "waiting" | "playing" | "finished";

  constructor(
    players: string[],
    currentTurn: number,
    board: number[][],
    currentCell: [number, number],
    moves: [number, number][] = [],
    scores: number[] = [0, 0], // Initialize scores for two players
    status: "waiting" | "playing" | "finished" = "waiting"
  ) {
    this.players = players;
    this.currentTurn = currentTurn;
    this.board = board;
    this.currentCell = currentCell;
    this.moves = moves;
    this.scores = scores; // Initialize scores
    this.status = status;
  }
}
