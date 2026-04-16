import { createRouter, createWebHistory } from 'vue-router';
import Game from '../components/Game.vue';
import GameMenu from '../components/GameMenu.vue';

const routes = [
  {
    path: '/',
    name: 'GameMenu',
    component: GameMenu,
  },
  {
    path: '/menu/:id?',
    name: 'GameMenuWithId',
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
