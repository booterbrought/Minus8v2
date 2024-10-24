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
  private pollInterval?: NodeJS.Timeout;
  private userStore = useUserStore();

  constructor(gameId: string, gameState: GameState) {
    this.gameId = gameId;
    this.gameState = ref(gameState);
  }

  public get currentPlayerName(): string {
    if (!this.gameState.value) return '';
    const currentPlayer = this.gameState.value.players[this.gameState.value.currentTurn];
    return currentPlayer.name;
  }

  async makeMove(row: number, col: number): Promise<void> {
    if (!this.gameState.value || !this.userStore.playerId) return;

    // Client-side move validation
    const [currentRow, currentCol] = this.gameState.value.currentCell;
    if (this.gameState.value.currentTurn === 0 && row !== currentRow) return;
    if (this.gameState.value.currentTurn === 1 && col !== currentCol) return;

    try {
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

  startPolling(): void {
    this.pollInterval = setInterval(async () => {
      this.gameState.value = await fetchGameState(this.gameId);
    }, 1000);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
