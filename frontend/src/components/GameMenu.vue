<template>
  <div
    class="fancy-bg"
    :style="{ gridTemplateColumns: `repeat(${fancyCols}, 1fr)` }"
  >
    <div
      v-for="(cell, i) in fancyBoard"
      :key="i"
      class="fancy-cell"
      :style="cellStyle(cell)"
    >{{ cell !== null ? (cell > 0 ? '+' + cell : String(cell)) : '' }}</div>
  </div>
  <div class="game-menu max-w-md mx-auto text-center">
    <h2 class="text-2xl font-bold mb-4 text-gray-200">Minus 8!</h2>

    <!-- Logged in state -->
    <div v-if="userStore.token" class="user-info mb-5">
      <p class="text-gray-200 mb-2">
        Welcome, <span class="font-semibold">{{ userStore.username }}</span>
        <span v-if="userStore.elo" class="text-indigo-400"> ({{ userStore.elo }})</span>
      </p>
      <button @click="logout" class="text-sm text-gray-400 hover:text-gray-200 underline">Logout</button>
    </div>

    <!-- Not logged in: auth + guest -->
    <div v-else class="mb-5 space-y-3">
      <div class="flex gap-2">
        <input v-model="authUsername" @keyup.enter="handleLogin" type="text" placeholder="Username" class="flex-1 min-w-0 border rounded px-2 py-1 bg-gray-700 border-gray-600 text-gray-200" />
        <input v-model="authPassword" @keyup.enter="handleLogin" type="password" placeholder="Password" class="flex-1 min-w-0 border rounded px-2 py-1 bg-gray-700 border-gray-600 text-gray-200" />
      </div>
      <div class="flex gap-2">
        <button @click="handleLogin" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Login</button>
        <button @click="handleRegister" class="flex-1 bg-indigo-400 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded">Register</button>
      </div>
      <div class="flex items-center my-2">
        <div class="flex-grow border-t border-gray-600"></div>
        <span class="mx-3 text-gray-500 text-sm">or</span>
        <div class="flex-grow border-t border-gray-600"></div>
      </div>
      <div class="flex gap-2">
        <input v-model="guestName" @keyup.enter="playAsGuest" type="text" placeholder="Your name" class="flex-1 min-w-0 border rounded px-2 py-1 bg-gray-700 border-gray-600 text-gray-200" />
        <button @click="playAsGuest" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Guest</button>
      </div>
    </div>

    <!-- Game actions (always visible if we have a name) -->
    <div v-if="userStore.username" class="space-y-3">
      <button @click="createGame" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
        Create New Game
      </button>
      <div class="flex gap-2">
        <input v-model="gameId" placeholder="Enter Game ID" class="flex-1 min-w-0 border rounded px-2 py-1 bg-gray-700 border-gray-600 text-gray-200" />
        <button @click="joinGame" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          Join Game
        </button>
      </div>
    </div>

    <!-- Recent games -->
    <div v-if="recentGames.length" class="mt-6 text-left">
      <h3 class="text-lg font-semibold text-gray-200 mb-2">Recent Games</h3>
      <div class="space-y-1 text-sm max-h-64 overflow-y-auto">
        <div
          v-for="game in recentGames"
          :key="game.game_id"
          class="rounded px-3 py-2 flex justify-between items-center"
          :class="rowClass(game)"
        >
          <div class="flex items-center gap-1">
            <span
              :class="['font-semibold text-gray-200', game.p1_user_id ? 'cursor-pointer hover:text-indigo-400 underline' : '']"
              @click.stop="game.p1_user_id && openProfile(game.p1_user_id)"
            >{{ game.p1_name }}</span>
            <span class="text-gray-500">{{ game.p1_score }}</span>
            <span class="text-gray-600 mx-1">vs</span>
            <span
              :class="['font-semibold text-gray-200', game.p2_user_id ? 'cursor-pointer hover:text-indigo-400 underline' : '']"
              @click.stop="game.p2_user_id && openProfile(game.p2_user_id)"
            >{{ game.p2_name }}</span>
            <span class="text-gray-500">{{ game.p2_score }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{ outcomeLabel(game) }}</span>
            <span v-if="eloChange(game) !== null" :class="['text-xs', eloChange(game)! > 0 ? 'text-green-400' : 'text-red-400']">{{ eloChange(game)! > 0 ? '+' : '' }}{{ eloChange(game) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile popup -->
    <ProfilePopup
      v-if="profileUserId"
      :user-id="profileUserId"
      @close="profileUserId = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { interpolateColor } from '../utils/colorInterpolation';
import ProfilePopup from './ProfilePopup.vue';

const router = useRouter();
const gameId = ref('');
const userStore = useUserStore();
const authUsername = ref('');
const authPassword = ref('');
const guestName = ref('');
const recentGames = ref<any[]>([]);
const profileUserId = ref<string | null>(null);
const fancyBoard = ref<(number | null)[]>([]);
const fancyCols = ref(0);
let popTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePop() {
  popTimer = setTimeout(() => {
    popRandomCells();
    schedulePop();
  }, 800 + Math.random() * 700);
}

function calcGrid() {
  const size = window.innerWidth < 480 ? 56 : window.innerWidth < 1024 ? 68 : 80;
  fancyCols.value = Math.ceil(window.innerWidth / size);
  const rows = Math.ceil(window.innerHeight / size);
  fancyBoard.value = generateFancyBoard(rows, fancyCols.value);
}

function generateFancyBoard(rows: number, cols: number) {
  const board: (number | null)[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      board.push(Math.random() < 0.5 ? randomCellValue() : null);
    }
  }
  return board;
}

function randomCellValue(): number {
  let v = 0;
  while (v === 0) v = Math.floor(Math.random() * 17) - 8;
  return v;
}

function popRandomCells() {
  const board = fancyBoard.value;
  if (!board.length) return;
  const count = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * board.length);
    board[idx] = board[idx] === null ? randomCellValue() : null;
  }
  fancyBoard.value = [...board];
}

function cellStyle(value: number | null): Record<string, string> {
  if (value === null) return { backgroundColor: 'transparent', borderColor: 'transparent', opacity: '0', transform: 'scale(0.5)' };
  const [rr, gg, bb] = interpolateColor(value);
  return {
    backgroundColor: `rgba(${rr},${gg},${bb},0.2)`,
    borderColor: `rgba(${rr},${gg},${bb},0.35)`,
    opacity: '1',
    transform: 'scale(1)',
  };
}

onMounted(() => {
  const id = router.currentRoute.value.params.id as string;
  if (id) gameId.value = id;
  if (userStore.token) refreshElo();
  calcGrid();
  window.addEventListener('resize', calcGrid);
  schedulePop();
  loadRecentGames();
});

onUnmounted(() => {
  if (popTimer) clearTimeout(popTimer);
  window.removeEventListener('resize', calcGrid);
});

function openProfile(userId: string) {
  profileUserId.value = userId;
}

function rowClass(game: any): string {
  const persp = userStore.token;
  const o = gameOutcome(game, persp);
  if (!persp || !o) return 'bg-gray-700';
  if (o === 'win') return 'bg-green-900/30 border-l-2 border-green-500';
  if (o === 'lose') return 'bg-red-900/30 border-l-2 border-red-500';
  return 'bg-yellow-900/30 border-l-2 border-yellow-500';
}

function gameOutcome(game: any, userId: string | null): 'win' | 'lose' | 'draw' | null {
  if (game.result === 'draw') return 'draw';
  if (!userId) return null;
  if (game.p1_user_id === userId) return game.result === 'player1_wins' ? 'win' : 'lose';
  if (game.p2_user_id === userId) return game.result === 'player2_wins' ? 'win' : 'lose';
  return null;
}

function outcomeLabel(game: any): string {
  const persp = userStore.token;
  const o = gameOutcome(game, persp);
  if (o === 'win') return 'Win';
  if (o === 'lose') return 'Lose';
  if (o === 'draw') return 'Draw';
  if (game.result === 'player1_wins') return game.p1_name;
  return game.p2_name;
}

function eloChange(game: any): number | null {
  const persp = userStore.token;
  if (!persp) return null;
  if (game.p1_user_id === persp) return game.p1_elo_change ?? null;
  if (game.p2_user_id === persp) return game.p2_elo_change ?? null;
  return null;
}

const handleLogin = async () => {
  if (!authUsername.value.trim() || !authPassword.value) return;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUsername.value.trim(), password: authPassword.value }),
    });
    if (res.ok) {
      const data = await res.json();
      userStore.setToken(data.token);
      userStore.setUsername(data.username);
      userStore.setElo(data.elo);
      refreshElo();
      loadRecentGames();
    } else {
      const err = await res.json();
      alert(err.error || 'Login failed');
    }
  } catch (e) {
    console.error(e);
  }
};

const handleRegister = async () => {
  if (!authUsername.value.trim() || !authPassword.value) return;
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUsername.value.trim(), password: authPassword.value }),
    });
    if (res.ok) {
      const data = await res.json();
      userStore.setToken(data.token);
      userStore.setUsername(data.username);
      userStore.setElo(data.elo);
      refreshElo();
      loadRecentGames();
    } else {
      const err = await res.json();
      alert(err.error || 'Registration failed');
    }
  } catch (e) {
    console.error(e);
  }
};

const playAsGuest = () => {
  const name = guestName.value.trim();
  if (!name) { alert('Please enter your name'); return; }
  userStore.setUsername(name);
  loadRecentGames();
};

const logout = () => {
  userStore.clearUser();
  recentGames.value = [];
  loadRecentGames();
};

const loadRecentGames = async () => {
  try {
    const res = await fetch('/api/history/recent');
    if (res.ok) recentGames.value = await res.json();
  } catch { /* ignore */ }
};

const refreshElo = async () => {
  if (!userStore.token) return;
  try {
    const res = await fetch(`/api/profile/${userStore.token}`);
    if (res.ok) {
      const data = await res.json();
      userStore.setElo(data.elo);
    }
  } catch { /* ignore */ }
};

const createGame = async () => {
  try {
    const res = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Authorization': userStore.token || '', 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      gameId.value = data.gameId;
      await joinGame();
    } else {
      alert('Failed to create game');
    }
  } catch (e) {
    console.error(e);
  }
};

const joinGame = async () => {
  if (!gameId.value) { alert('Please enter a game ID'); return; }
  try {
    const res = await fetch(`/api/game/${gameId.value}/join`, {
      method: 'POST',
      headers: { 'Authorization': userStore.token || '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userStore.username }),
    });
    if (res.ok) {
      const data = await res.json();
      userStore.setPlayerId(data.playerId);
      router.push(`/game/${gameId.value}`);
    } else {
      alert('Failed to join game');
    }
  } catch (e) {
    console.error(e);
  }
};
</script>

<style scoped>
.fancy-bg {
  @apply fixed inset-0 grid z-0;
  grid-auto-rows: 1fr;
  pointer-events: none;
  background: #111827;
  padding: 4px;
  gap: 3px;
}

.fancy-cell {
  @apply flex items-center justify-center font-bold overflow-hidden;
  color: rgba(255,255,255,0.55);
  font-family: 'Exo 2', sans-serif;
  font-size: 20px;
  border: 1px solid rgba(75,85,99,0.5);
  border-radius: 4px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.6);
  transition: opacity 0.6s ease, transform 0.6s ease, background-color 0.6s ease;
  user-select: none;
}

@media (max-width: 480px) {
  .fancy-cell { font-size: 16px; border-width: 0.5px; border-radius: 2px; }
}

@media (min-width: 481px) and (max-width: 768px) {
  .fancy-cell { font-size: 22px; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .fancy-cell { font-size: 28px; }
}

@media (min-width: 1025px) {
  .fancy-cell { font-size: 34px; border-radius: 6px; }
}

.game-menu {
  @apply relative z-10 bg-gray-900/95 rounded-lg p-6 mt-8 border border-gray-700;
}

@media (max-width: 640px) {
  .game-menu {
    @apply mt-3 mx-2;
  }
}
</style>
