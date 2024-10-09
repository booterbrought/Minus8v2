<template>
  <div class="game">
    <h2>Game ID: {{ gameId }}</h2>
    <div class="score-panel">
      <h3>Scores:</h3>
      <div class="scores">
        <div v-for="(player, index) in game?.players" :key="player.id" class="player-score">
          <span>{{ player.name }}</span>: <span>{{ game?.scores[index] }}</span>
        </div>
      </div>
    </div>
    <div v-if="game">
      <p>Players: {{ playerNames }}</p>
      <p>Current Turn: {{ currentPlayerName }}</p>
      <div class="board">
        <div
          v-for="(row, rowIndex) in game.board"
          :key="rowIndex"
          class="row"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            class="cell"
            :class="{
              'eaten': isEaten(rowIndex, colIndex),
              'active': isActive(rowIndex, colIndex),
              'dimmed': isDimmed(rowIndex, colIndex)
            }"
            :style="getCellStyle(cell)"
            @click="makeMove(rowIndex, colIndex)"
          >
            {{ cell !== null ? cell : '' }}
          </div>
        </div>
      </div>
      <p>Status: {{ game.status }}</p>
      <p>Scores: {{ game.scores.join(' - ') }}</p>
    </div>
    <div v-else>
      <p>Loading game...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../stores/userStore';

interface GameState {
  players: { id: string; name: string }[];
  currentTurn: number;
  board: number[][];
  currentCell: [number, number];
  moves: [number, number][];
  scores: number[];
  status: 'waiting' | 'playing' | 'finished';
}

const route = useRoute();
const gameId = route.params.id as string;
const game = ref<GameState | null>(null);
const userStore = useUserStore();

const fetchGameState = async () => {
  try {
    const token = userStore.token;
    const response = await fetch(`/api/game/${gameId}`, {
      headers: { Authorization: token || '' },
    });

    if (response.ok) {
      game.value = await response.json();
    } else {
      alert('Failed to fetch game state');
    }
  } catch (error) {
    console.error('Error fetching game state:', error);
  }
};

const makeMove = async (row: number, col: number) => {
  if (!game.value || !userStore.playerId) return;

  // Determine if the move is valid on the client-side
  const [currentRow, currentCol] = game.value.currentCell;
  if (game.value.currentTurn === 0 && row !== currentRow) {
    alert('Invalid move: You must move horizontally.');
    return;
  }
  if (game.value.currentTurn === 1 && col !== currentCol) {
    alert('Invalid move: You must move vertically.');
    return;
  }

  try {
    const token = userStore.token;
    const response = await fetch(`/api/game/${gameId}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || '',
      },
      body: JSON.stringify({ playerId: userStore.playerId, row, col }),
    });

    if (response.ok) {
      await fetchGameState();
    } else {
      const errorData = await response.json();
      alert(`Failed to make move: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Error making move:', error);
  }
};

const isEaten = (row: number, col: number): boolean => {
  if (!game.value) return false;
  return game.value.moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
};

const getActiveRow = computed(() => {
  if (!game.value) return -1;
  return game.value.currentTurn === 0 ? game.value.currentCell[0] : -1;
});

const getActiveCol = computed(() => {
  if (!game.value) return -1;
  return game.value.currentTurn === 1 ? game.value.currentCell[1] : -1;
});

const isActive = (row: number, col: number): boolean => {
  if (!game.value) return false;
  if (game.value.currentTurn === 0) {
    return row === game.value.currentCell[0];
  } else {
    return col === game.value.currentCell[1];
  }
};

const isDimmed = (row: number, col: number): boolean => {
  if (!game.value) return false;
  if (game.value.currentTurn === 0) {
    return row !== game.value.currentCell[0];
  } else {
    return col !== game.value.currentCell[1];
  }
};

const getCellStyle = (value: number) => {
  if (value === 0) return { backgroundColor: '#3a3a3a', color: '#e0e0e0' };

  const colorStops = [
    { value: -8, color: [0, 102, 204] },    // Darker blue
    { value: -3, color: [51, 153, 255] },   // Blue
    { value: -1, color: [102, 178, 255] },  // Light blue
    { value: 1, color: [255, 255, 102] },   // Light yellow
    { value: 3, color: [255, 178, 102] },   // Light orange
    { value: 8, color: [204, 0, 0] }        // Dark red
  ];

  const getInterpolatedColor = (value: number) => {
    if (value <= colorStops[0].value) return colorStops[0].color;
    if (value >= colorStops[colorStops.length - 1].value) return colorStops[colorStops.length - 1].color;

    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (value >= colorStops[i].value && value <= colorStops[i + 1].value) {
        lowerStop = colorStops[i];
        upperStop = colorStops[i + 1];
        break;
      }
    }

    const range = upperStop.value - lowerStop.value;
    const valueInRange = value - lowerStop.value;
    const ratio = valueInRange / range;

    return lowerStop.color.map((c, i) => 
      Math.round(c + ratio * (upperStop.color[i] - c))
    );
  };

  const [r, g, b] = getInterpolatedColor(value);
  
  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    color: 'white',
  };
};

const playerNames = computed(() => {
  return game.value?.players.map(player => player.name).join(', ') || '';
});

const currentPlayerName = computed(() => {
  if (!game.value) return '';
  const currentPlayer = game.value.players[game.value.currentTurn];
  return `${currentPlayer.name} (Player ${game.value.currentTurn + 1})`;
});

onMounted(() => {
  fetchGameState();
  // Optionally, set up a polling mechanism to refresh game state
  setInterval(fetchGameState, 5000);
});
</script>

<style scoped>
.game {
  max-width: 600px;
  margin: auto;
  text-align: center;
  background-color: #1e1e1e;
  color: #e0e0e0;
  padding: 20px;
  border-radius: 10px;
}

.score-panel {
  background-color: #2c2c2c;
  padding: 1.5rem;
  border: 3px solid #4a4a4a;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.scores {
  display: flex;
  justify-content: space-around;
  font-size: 1.5rem;
}

.player-score {
  font-weight: bold;
  color: #8bc34a;
}

.player-score span:first-child {
  margin-right: 0.5rem;
}

.board {
  display: grid;
  grid-template-rows: repeat(8, 50px);
  grid-template-columns: repeat(8, 50px);
  gap: 5px;
  justify-content: center;
  margin: 20px 0;
}

.row {
  display: contents;
}

.cell {
  border: 1px solid #4a4a4a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  font-weight: bold;
  width: 50px;
  height: 50px;
  text-shadow: 1px 1px 2px black;
  transition: all 0.3s ease;
}

.cell:hover {
  opacity: 0.8;
}

.cell.eaten {
  visibility: hidden;
  background-color: transparent !important;
  border: none;
  cursor: default;
}

.cell.active {
  border: 2px solid #ffd700;
}

.cell.dimmed {
  opacity: 0.7;
  pointer-events: none;
}
</style>