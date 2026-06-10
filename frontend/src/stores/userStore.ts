import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const username = ref<string>(localStorage.getItem('username') || '');
  const playerId = ref<string | null>(localStorage.getItem('playerId'));
  const elo = ref<number>(Number(localStorage.getItem('elo')) || 0);

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

  const setElo = (newElo: number) => {
    elo.value = newElo;
    localStorage.setItem('elo', String(newElo));
  };

  const clearUser = () => {
    token.value = null;
    username.value = '';
    playerId.value = null;
    elo.value = 0;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('playerId');
    localStorage.removeItem('elo');
  };

  return {
    token,
    username,
    playerId,
    elo,
    setToken,
    setUsername,
    setPlayerId,
    setElo,
    clearUser,
  };
});
