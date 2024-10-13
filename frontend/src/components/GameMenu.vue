<template>
  <div class="game-menu">
    <h2>Game Menu</h2>
    <div class="user-info">
      <label for="username">Your Name:</label>
      <input v-model="currentUsername" type="text" id="username" />
    </div>
    <button @click="createGame">Create New Game</button>
    <div>
      <input v-model="gameId" placeholder="Enter Game ID" />
      <button @click="joinGame">Join Game</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
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
.game-menu {
  max-width: 400px;
  margin: auto;
  text-align: center;
}
button {
  margin: 10px;
}
.user-info {
  margin-bottom: 20px;
}
.user-info input {
  margin-left: 10px;
}
</style>
