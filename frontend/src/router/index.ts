import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import Game from '../components/Game.vue';
import GameMenu from '../components/GameMenu.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: GameMenu,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  {
    path: '/menu/:id?',
    name: 'GameMenu',
    component: GameMenu,
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: Game,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
