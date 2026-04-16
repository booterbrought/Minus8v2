export interface Player {
  id: string;
  name: string;
}

export type GameResult = "" | "player1_wins" | "player2_wins" | "draw";

export class Game {
  players: Player[];
  currentTurn: number;
  board: number[][];
  currentCell: [number, number];
  moves: [number, number][];
  scores: number[];
  status: "waiting" | "playing" | "finished";
  result: GameResult;

  constructor(
    players: Player[] = [],
    currentTurn: number = 0,
    board: number[][] = [],
    currentCell: [number, number] = [0, 0],
    moves: [number, number][] = [],
    scores: number[] = [],
    status: "waiting" | "playing" | "finished" = "waiting",
    result: GameResult = ""
  ) {
    this.players = players;
    this.currentTurn = currentTurn;
    this.board = board;
    this.currentCell = currentCell;
    this.moves = moves;
    this.scores = scores;
    this.status = status;
    this.result = result;
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

  getValidMoves(): [number, number][] {
    const [row, col] = this.currentCell;
    const valid: [number, number][] = [];

    if (this.currentTurn === 0) {
      // Player 1: horizontal (same row)
      for (let c = 0; c < 8; c++) {
        if (c === col) continue;
        if (this.board[row][c] !== 0 && !this.isEaten(row, c)) {
          valid.push([row, c]);
        }
      }
    } else {
      // Player 2: vertical (same column)
      for (let r = 0; r < 8; r++) {
        if (r === row) continue;
        if (this.board[r][col] !== 0 && !this.isEaten(r, col)) {
          valid.push([r, col]);
        }
      }
    }

    return valid;
  }

  private isEaten(row: number, col: number): boolean {
    return this.moves.some(([r, c]) => r === row && c === col);
  }

  determineResult(): GameResult {
    if (this.scores[0] > this.scores[1]) return "player1_wins";
    if (this.scores[1] > this.scores[0]) return "player2_wins";
    return "draw";
  }
}
