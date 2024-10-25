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
  const inviteLink = `${window.location.origin}/menu/${gameId}`;
  setTimeout(() => {
    copyText.value = 'Click to copy invite link';
  }, 1500);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        copyText.value = 'Copied!';
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        fallbackCopyToClipboard(inviteLink);
      });
  } else {
    fallbackCopyToClipboard(inviteLink);
  }
}

function fallbackCopyToClipboard(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '0';
  textarea.style.top = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand('copy');
    copyText.value = 'Copied!';
  } catch (err) {
    console.error('Fallback copy failed:', err);
    copyText.value = 'Copy failed, please copy manually';
  }

  document.body.removeChild(textarea);
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

@media (max-width: 640px) {
  .game {
    width: 100vw;
    border-radius: 0;
  }
}
</style>
