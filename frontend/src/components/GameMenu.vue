<template>
  <div class="game-menu">
    <h2>Game Menu</h2>
    <button @click="createGame">Create New Game</button>
    <div>
      <input v-model="gameId" placeholder="Enter Game ID" />
      <button @click="joinGame">Join Game</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const gameId = ref('');

const createGame = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      router.push(`/game/${data.gameId}`);
    } else {
      alert('Failed to create game');
    }
  } catch (error) {
    console.error('Error creating game:', error);
  }
};

const joinGame = () => {
  if (gameId.value) {
    router.push(`/game/${gameId.value}`);
  } else {
    alert('Please enter a game ID');
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
</style>
