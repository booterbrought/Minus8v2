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
  const lastMove = props.gameState.moves[props.gameState.moves.length - 1];
  return (lastMove && lastMove[0] === cell[0] && lastMove[1] === cell[1]) || false;
}
</script>

<style scoped>
.board {
  @apply grid grid-cols-8 gap-0.5;
}

.row {
  @apply contents;
}
</style>

