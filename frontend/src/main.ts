import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index'
import { useUserStore } from './stores/userStore'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

app.use(router)

app.mount('#app')

// Initialize the user store
const userStore = useUserStore()
