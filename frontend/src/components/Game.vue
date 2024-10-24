<template>
  <div v-if="gameService.gameState.value" class="game">
    <h2 v-if="gameService.gameState.value.status === 'waiting'" @click="copyGameId" class="game-id">{{ copyText }}</h2>
    <ScorePanel :game-state="gameService.gameState.value" />
    <Board :game-state="gameService.gameState.value" @make-move="(row, col) => gameService.makeMove(row, col)" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Board from './Board.vue';
import { GameService, fetchGameState } from '../services/game';
import ScorePanel from './ScorePanel.vue';

const route = useRoute();
const gameId = route.params.id as string;
const gameService = new GameService(gameId, await fetchGameState(gameId));

const copyText = ref('Click to copy invite link');

onMounted(() => {
  gameService.startPolling();
});

onUnmounted(() => {
  gameService.stopPolling();
});

function copyGameId() {
  navigator.clipboard.writeText(`${window.location.host}/menu/${gameId}`);
  copyText.value = 'Copied!';
  setTimeout(() => {
    copyText.value = 'Click to copy invite link';
  }, 1500);
}
</script>

<style scoped>
.game-id {
  @apply cursor-pointer mb-3 text-gray-400 transition-colors duration-300;
}

.game-id:hover {
  @apply text-white transition-colors duration-300;
}

.game {
  @apply mx-auto text-center bg-gray-800 text-gray-200 p-3 pt-3 rounded-lg max-w-full max-h-full;
  width: 30vw;
}
</style>
