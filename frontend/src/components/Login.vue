<template>
  <div class="login max-w-md mx-auto p-6 bg-gray-800 shadow-md rounded-md">
    <h2 class="text-2xl font-bold mb-4 text-gray-200">Login</h2>
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700">Username:</label>
        <input v-model="username" type="text" id="username" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password:</label>
        <input v-model="password" type="password" id="password" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <button type="submit" class="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Login</button>
    </form>
    <p class="mt-4 text-center text-sm text-gray-600">
      Don't have an account?
      <router-link to="/register" class="text-indigo-600 hover:text-indigo-500">Register here</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';

const username = ref('');
const password = ref('');
const router = useRouter();
const userStore = useUserStore();

const handleLogin = async () => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    });

    if (response.ok) {
      const data = await response.json();
      userStore.setToken(data.token);
      userStore.setUsername(username.value);
      // Redirect to the game menu instead of a specific game
      router.push('/menu');
    } else {
      // Handle login errors
      alert('Login failed');
    }
  } catch (error) {
    console.error('Error during login:', error);
  }
};
</script>

<style scoped>



</style>
