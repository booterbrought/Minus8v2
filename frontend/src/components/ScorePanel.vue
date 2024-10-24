<template>
  <div class="score-panel">
    <div class="scores">
      <div v-for="(player, index) in gameState.players" :key="player.id">
        <div class="player-score" :class="gameState.currentTurn === index ? 'active' : ''">
          <span>{{ player.name }}</span>: <span>{{ gameState.scores[index] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameState } from '../services/game';

defineProps<{
  gameState: GameState;
}>();
</script>

<style scoped>
.score-panel {
  @apply bg-gray-700 p-1 border border-gray-600 rounded-md mb-3;
}

.scores {
  @apply flex justify-around text-xl;
}

.player-score.active {
  @apply text-green-400 transition-colors duration-300;
}

.player-score {
  @apply text-gray-400 transition-colors duration-300;
}
</style>

