<template>
  <div class="game-menu max-w-md mx-auto text-center">
    <h2 class="text-2xl font-bold mb-4 text-gray-200">Minus 8!</h2>

    <!-- Logged in state -->
    <div v-if="userStore.token" class="user-info mb-5">
      <p class="text-gray-200 mb-2">Welcome, <span class="font-semibold">{{ userStore.username }}</span></p>
      <button @click="logout" class="text-sm text-gray-400 hover:text-gray-200 underline">Logout</button>
    </div>

    <!-- Not logged in: auth + guest -->
    <div v-else class="mb-5 space-y-3">
      <div class="flex gap-2">
        <input v-model="authUsername" type="text" placeholder="Username" class="flex-1 border rounded px-2 py-1 bg-gray-700 border-gray-600 text-gray-200" />
        <input v-model="authPassword" type="password" placeholder="Password" class="flex-1 border rounded px-2 py-1 bg-gray-700 border-gray-600 text-gray-200" />
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
        <input v-model="guestName" type="text" placeholder="Your name" class="flex-1 border rounded px-2 py-1 bg-gray-700 border-gray-600 text-gray-200" />
        <button @click="playAsGuest" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Guest</button>
      </div>
    </div>

    <!-- Game actions (always visible if we have a name) -->
    <div v-if="userStore.username" class="space-y-3">
      <button @click="createGame" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
        Create New Game
      </button>
      <div class="flex gap-2">
        <input v-model="gameId" placeholder="Enter Game ID" class="flex-1 border rounded px-2 py-1 bg-gray-700 border-gray-600 text-gray-200" />
        <button @click="joinGame" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          Join Game
        </button>
      </div>
    </div>

    <!-- Game history -->
    <div v-if="history.length" class="mt-6 text-left">
      <h3 class="text-lg font-semibold text-gray-200 mb-2">Recent Games</h3>
      <div class="space-y-1 text-sm max-h-48 overflow-y-auto">
        <div v-for="entry in history" :key="entry.game_id + entry.player_name" class="flex justify-between text-gray-300 bg-gray-700 rounded px-3 py-1">
          <span>{{ entry.player_name }}</span>
          <span>{{ entry.score }}</span>
          <span>{{ entry.result === 'draw' ? 'Draw' : entry.result === 'player1_wins' ? 'P1 Win' : 'P2 Win' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';

const router = useRouter();
const gameId = ref('');
const userStore = useUserStore();
const authUsername = ref('');
const authPassword = ref('');
const guestName = ref('');
const history = ref<any[]>([]);

onMounted(() => {
  const id = router.currentRoute.value.params.id as string;
  if (id) gameId.value = id;
  if (userStore.token) loadHistory();
});

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
      loadHistory();
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
      loadHistory();
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
};

const logout = () => {
  userStore.clearUser();
  history.value = [];
};

const loadHistory = async () => {
  try {
    const res = await fetch(`/api/history/${userStore.token}`);
    if (res.ok) history.value = await res.json();
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
</style>
