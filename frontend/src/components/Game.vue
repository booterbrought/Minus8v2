<template>
  <div v-if="gameService.gameState.value" class="game">
    <div class="game-header">
      <h2 v-if="gameService.gameState.value.status === 'waiting'" @click="copyGameId" class="game-id">{{ copyText }}</h2>
      <ScorePanel :game-state="gameService.gameState.value" />
    </div>
    <div class="game-board-container">
      <Board :game-state="gameService.gameState.value" @make-move="(row, col) => gameService.makeMove(row, col)" />
    </div>
    <div v-if="gameService.gameState.value.status === 'finished'" class="game-over">
      <div class="game-over-content">
        <h2 class="game-over-title">{{ gameOverText }}</h2>
        <p class="game-over-scores">
          {{ gameService.gameState.value.players[0]?.name ?? 'Player 1' }}: {{ gameService.gameState.value.scores[0] }}
          &mdash;
          {{ gameService.gameState.value.players[1]?.name ?? 'Player 2' }}: {{ gameService.gameState.value.scores[1] }}
        </p>
        <button @click="goToMenu" class="play-again-btn">Play Again</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Board from './Board.vue';
import { GameService, fetchGameState } from '../services/game';
import ScorePanel from './ScorePanel.vue';

const route = useRoute();
const router = useRouter();

const gameId = route.params.id as string;
const gameService = new GameService(gameId, await fetchGameState(gameId));

const copyText = ref('Click to copy invite link');

const gameOverText = computed(() => {
  const state = gameService.gameState.value;
  if (!state) return '';
  if (state.result === 'draw') return "It's a draw!";
  const winnerIndex = state.result === 'player1_wins' ? 0 : 1;
  return `${state.players[winnerIndex]?.name ?? `Player ${winnerIndex + 1}`} wins!`;
});

function goToMenu() {
  gameService.wsDisconnect();
  router.push('/');
}

onMounted(() => {
  gameService.wsConnect();
});

onUnmounted(() => {
  gameService.wsDisconnect();
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
  @apply cursor-pointer mb-3 text-gray-400 transition-colors duration-300 text-xl;
}

.game-id:hover {
  @apply text-white transition-colors duration-300;
}

.game {
  @apply mx-auto text-center bg-gray-800 text-gray-200 p-4 rounded-lg;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  margin: 5vh auto;
  position: relative;
}

.game-header {
  @apply flex-shrink-0;
}

.game-board-container {
  @apply flex-grow flex items-center justify-center min-h-0;
  width: 100%;
}

.game-over {
  @apply absolute inset-0 flex items-center justify-center;
  background: rgba(0, 0, 0, 0.75);
  border-radius: inherit;
  z-index: 10;
}

.game-over-content {
  @apply text-center;
}

.game-over-title {
  @apply text-4xl font-bold mb-4;
}

.game-over-scores {
  @apply text-xl text-gray-300 mb-6;
}

.play-again-btn {
  @apply px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors;
}

/* Thin desktop screens - stick to top */
@media (max-width: 1024px) and (min-height: 600px) {
  .game-board-container {
    @apply items-start;
    padding-top: 1rem;
  }
}

@media (max-width: 640px) {
  .game {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    margin: 0;
    padding: 1rem;
  }

  .game-id {
    @apply text-lg mb-2;
  }

  .game-board-container {
    @apply items-start;
    padding-top: 0.5rem;
  }

  .game-over-title {
    @apply text-2xl;
  }

  .game-over-scores {
    @apply text-base;
  }
}

@media (min-width: 1024px) {
  .game {
    max-width: 1200px;
    max-height: 900px;
  }
}
</style>
