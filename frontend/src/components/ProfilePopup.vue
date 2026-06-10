<template>
  <Teleport to="body">
    <div class="profile-overlay" @click.self="$emit('close')">
      <div class="profile-card" @keyup.escape="$emit('close')">
        <button @click="$emit('close')" class="close-btn">&times;</button>

        <div v-if="loading" class="text-gray-400 py-4">Loading...</div>

        <div v-else-if="error" class="text-red-400 py-4">{{ error }}</div>

        <div v-else-if="profile" class="profile-content">
          <h3 class="text-xl font-bold text-gray-200 mb-1">{{ profile.username }}</h3>
          <p class="text-indigo-400 font-semibold text-lg mb-3">{{ profile.elo }} ELO</p>

          <div class="stats flex justify-center gap-4 mb-4">
            <div class="stat">
              <span class="stat-value text-green-400">{{ profile.stats.wins }}</span>
              <span class="stat-label">Wins</span>
            </div>
            <div class="stat">
              <span class="stat-value text-red-400">{{ profile.stats.losses }}</span>
              <span class="stat-label">Losses</span>
            </div>
            <div class="stat">
              <span class="stat-value text-yellow-400">{{ profile.stats.draws }}</span>
              <span class="stat-label">Draws</span>
            </div>
            <div class="stat">
              <span class="stat-value text-gray-400">{{ profile.stats.total }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>

          <div v-if="profile.recentGames.length" class="recent-games">
            <h4 class="text-sm font-semibold text-gray-400 mb-1">Recent Games</h4>
            <div class="space-y-0.5 text-xs">
              <div
                v-for="game in profile.recentGames"
                :key="game.game_id"
                class="flex justify-between text-gray-300 bg-gray-800 rounded px-2 py-1"
              >
                <span class="flex gap-1">
                  <span>{{ game.p1_name }} {{ game.p1_score }}</span>
                  <span class="text-gray-600">vs</span>
                  <span>{{ game.p2_name }} {{ game.p2_score }}</span>
                </span>
                <span class="text-gray-500">{{ resultLabel(game.result) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  userId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(true);
const error = ref('');
const profile = ref<any>(null);

async function loadProfile() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`/api/profile/${props.userId}`);
    if (res.ok) {
      profile.value = await res.json();
    } else {
      const err = await res.json();
      error.value = err.error || 'Failed to load profile';
    }
  } catch {
    error.value = 'Failed to load profile';
  } finally {
    loading.value = false;
  }
}

function resultLabel(result: string): string {
  if (result === 'draw') return 'Draw';
  return result === 'player1_wins' ? 'P1' : 'P2';
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}

onMounted(() => {
  loadProfile();
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});

watch(() => props.userId, () => {
  loadProfile();
});
</script>

<style scoped>
.profile-overlay {
  @apply fixed inset-0 bg-black/60 flex items-center justify-center z-50;
}

.profile-card {
  @apply bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 relative shadow-xl;
  animation: fadeIn 0.15s ease-out;
}

.close-btn {
  @apply absolute top-3 right-3 text-gray-500 hover:text-gray-300 text-xl leading-none w-8 h-8 flex items-center justify-center rounded;
}

.stats {
  @apply flex justify-center gap-4;
}

.stat {
  @apply flex flex-col items-center;
}

.stat-value {
  @apply text-lg font-bold;
}

.stat-label {
  @apply text-xs text-gray-500 uppercase;
}

.recent-games {
  @apply mt-3;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
