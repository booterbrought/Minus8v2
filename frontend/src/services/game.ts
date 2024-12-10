import type { Ref } from 'vue';
import { ref } from 'vue';
import { useUserStore } from '../stores/userStore';

export async function fetchGameState(gameId: string): Promise<GameState> {
  const userStore = useUserStore();
  try {
    const response = await fetch(`/api/game/${gameId}`, {
      headers: { Authorization: userStore.token || '' },
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Backend error fetching game state:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching game state:', error);
  }

  return {
    players: [],
    currentTurn: 0,
    board: [],
    currentCell: [0, 0],
    moves: [],
    scores: [],
    status: 'waiting',
  };
}

export interface GameState {
  players: { id: string; name: string }[];
  currentTurn: number;
  board: number[][];
  currentCell: [number, number];
  moves: [number, number][];
  scores: number[];
  status: 'waiting' | 'playing' | 'finished';
}

export class GameService {
  private gameId: string;
  public gameState: Ref<GameState>;
  private userStore = useUserStore();
  private ws: WebSocket | null = null;

  constructor(gameId: string, gameState: GameState) {
    this.gameId = gameId;
    this.gameState = ref(gameState);
  }

  public get currentPlayerName(): string {
    if (!this.gameState.value) return '';
    const currentPlayer = this.gameState.value.players[this.gameState.value.currentTurn];
    return currentPlayer.name;
  }

  private getCurrentPlayerId(): string {
    if (!this.gameState.value) return '';
    return this.gameState.value.players[this.gameState.value.currentTurn].id;
  }

  async makeMove(row: number, col: number): Promise<void> {
    if (!this.gameState.value || !this.userStore.playerId) return;

    // Client-side move validation
    const [currentRow, currentCol] = this.gameState.value.currentCell;
    if (this.gameState.value.currentTurn === 0 && row !== currentRow) return;
    if (this.gameState.value.currentTurn === 1 && col !== currentCol) return;
    // Validate if the current player is making the move
    const currentPlayerId = this.getCurrentPlayerId();
    if (currentPlayerId !== this.userStore.playerId) {
      console.error('It is not your turn to make a move.');
      return;
    }

    try {
      this.gameState.value.moves.push([row, col]);
      const response = await fetch(`/api/game/${this.gameId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.userStore.token || '',
        },
        body: JSON.stringify({ playerId: this.userStore.playerId, row, col }),
      });

      if (response.ok) {
        this.gameState.value = await fetchGameState(this.gameId);
      } else {
        const errorData = await response.json();
        console.error('Backend error making move:', errorData);
      }
    } catch (error) {
      console.error('Error making move:', error);
    }
  }

  public wsConnect() {
    this.ws = new WebSocket(`ws://localhost:8000/api/ws/${this.userStore.playerId}`);
    if (this.ws) {
      this.ws.onmessage = (event) => {
        this.gameState.value = JSON.parse(event.data).game;
      };
    }
  }

  public wsDisconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
