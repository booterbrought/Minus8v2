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
    <div class="my-4 flex items-center">
      <div class="flex-grow border-t border-gray-600"></div>
      <span class="mx-3 text-gray-500 text-sm">or</span>
      <div class="flex-grow border-t border-gray-600"></div>
    </div>
    <div class="space-y-3">
      <div>
        <label for="guest-name" class="block text-sm font-medium text-gray-700">Your Name:</label>
        <input v-model="guestName" type="text" id="guest-name" placeholder="Enter your name" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" />
      </div>
      <button @click="playAsGuest" class="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">Play as Guest</button>
    </div>
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
const guestName = ref('');
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
      router.push('/menu');
    } else {
      alert('Login failed');
    }
  } catch (error) {
    console.error('Error during login:', error);
  }
};

const playAsGuest = () => {
  const name = guestName.value.trim();
  if (!name) {
    alert('Please enter your name');
    return;
  }
  userStore.setUsername(name);
  router.push('/menu');
};
</script>

<style scoped>
</style>
