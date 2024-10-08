<template>
  <div class="game">
    <h2>Game ID: {{ gameId }}</h2>
    <div v-if="game">
      <p>Players: {{ game.players.join(', ') }}</p>
      <p>Current Turn: Player {{ game.currentTurn + 1 }}</p>
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
            @click="makeMove(rowIndex, colIndex)"
          >
            {{ cell }}
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
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

interface GameState {
  players: string[];
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

const fetchGameState = async () => {
  try {
    const token = localStorage.getItem('token');
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
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/game/${gameId}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || '',
      },
      body: JSON.stringify({ row, col }),
    });

    if (response.ok) {
      await fetchGameState();
    } else {
      alert('Failed to make move');
    }
  } catch (error) {
    console.error('Error making move:', error);
  }
};

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
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cell:hover {
  background-color: #e0e0e0;
}
</style>