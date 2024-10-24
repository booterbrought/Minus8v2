<template>
  <div class="game-menu max-w-md mx-auto text-center">
    <h2 class="text-2xl font-bold mb-4 text-gray-200">Minus 8!</h2>
    <div class="user-info mb-5">
      <label for="username" class="mr-2 text-gray-200">Your Name:</label>
      <input v-model="currentUsername" type="text" id="username" class="border rounded px-2 py-1" />
    </div>
    <button @click="createGame" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded m-2">
      Create New Game
    </button>
    <div class="mt-4">
      <input v-model="gameId" placeholder="Enter Game ID" class="border rounded px-2 py-1 mr-2" />
      <button @click="joinGame" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
        Join Game
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';

const router = useRouter();
const gameId = ref('');
const userStore = useUserStore();
const currentUsername = ref(userStore.username);

watch(currentUsername, (newUsername) => {
  if (newUsername.trim() !== '') {
    userStore.setUsername(newUsername);
  }
});

onMounted(() => {
  gameId.value = router.currentRoute.value.params.id as string;
});

const createGame = async () => {
  try {
    const token = userStore.token;
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      gameId.value = data.gameId;
      await joinGame();
    } else {
      const errorData = await response.text();
      console.error('Failed to create game:', errorData);
      alert(`Failed to create game: ${errorData}`);
    }
  } catch (error) {
    console.error('Error creating game:', error);
    alert(`Error creating game: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const joinGame = async () => {
  try {
    if (!gameId.value) {
      alert('Please enter a game ID');
      return;
    }

    const token = userStore.token;
    const response = await fetch(`/api/game/${gameId.value}/join`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: userStore.username })
    });

    if (response.ok) {
      const data = await response.json();
      userStore.setPlayerId(data.playerId);
      router.push(`/game/${gameId.value}`);
    } else {
      const errorData = await response.text();
      console.error('Failed to join game:', errorData);
      alert(`Failed to join game: ${errorData}`);
    }
  } catch (error) {
    console.error('Error joining game:', error);
    alert(`Error joining game: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
</script>

<style scoped>
/* Remove all existing styles */
</style>
