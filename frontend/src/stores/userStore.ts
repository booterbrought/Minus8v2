import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const username = ref<string>(localStorage.getItem('username') || '');
  const playerId = ref<string | null>(localStorage.getItem('playerId'));

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  };

  const setUsername = (newUsername: string) => {
    username.value = newUsername;
    localStorage.setItem('username', newUsername);
  };

  const setPlayerId = (newPlayerId: string) => {
    playerId.value = newPlayerId;
    localStorage.setItem('playerId', newPlayerId);
  };

  const clearUser = () => {
    token.value = null;
    username.value = '';
    playerId.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('playerId');
  };

  return {
    token,
    username,
    playerId,
    setToken,
    setUsername,
    setPlayerId,
    clearUser,
  };
});
