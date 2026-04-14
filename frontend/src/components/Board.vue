<template>
  <div class="board">
    <div
      v-for="(row, rowIndex) in gameState.board"
      :key="rowIndex"
      class="row"
    >
      <GameCell
        v-for="(cell, colIndex) in row"
        :key="colIndex"
        :value="cell"
        :row="rowIndex"
        :col="colIndex"
        :eaten="isEaten(rowIndex, colIndex)"
        :active="isActive(rowIndex, colIndex)"
        :dimmed="isDimmed(rowIndex, colIndex)"
        :last="isLastEatenCell([rowIndex, colIndex])"
        @cell-click="$emit('make-move', rowIndex, colIndex)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameCell from './GameCell.vue';
import type { GameState } from '../services/game';

const props = defineProps<{
  gameState: GameState
}>();

defineEmits<{
  'make-move': [row: number, col: number]
}>();

function isEaten(row: number, col: number): boolean {
  return props.gameState.moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
}

function isActive(row: number, col: number): boolean {
  if (props.gameState.currentTurn === 0) {
    return row === props.gameState.currentCell[0];
  } else {
    return col === props.gameState.currentCell[1];
  }
}

function isDimmed(row: number, col: number): boolean {
  if (props.gameState.currentTurn === 0) {
    return row !== props.gameState.currentCell[0];
  } else {
    return col !== props.gameState.currentCell[1];
  }
}

function isLastEatenCell(cell: [number, number]): boolean {
  const lastMove = props.gameState.moves.at(-1);
  return (lastMove && lastMove[0] === cell[0] && lastMove[1] === cell[1]) || false;
}
</script>

<style scoped>
.board {
  @apply grid grid-cols-8 gap-1;
  grid-auto-rows: 1fr; /* Ensure rows have equal height */
  aspect-ratio: 1 / 1; /* Make board square */
  width: 90%; /* Take most of container width */
  max-width: min(80vh, 700px); /* But not too big */
  margin: 0 auto; /* Center horizontally */
}

.row {
  @apply contents;
}

/* Responsive gap sizes */
@media (max-width: 640px) {
  .board {
    gap: 0.125rem;
    width: 95%; /* Use more space on mobile */
    max-width: min(85vh, 500px);
  }
}

@media (min-width: 1024px) {
  .board {
    gap: 0.25rem;
    max-width: min(75vh, 800px);
  }
}
</style>

