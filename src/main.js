import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import permPlugin from '@/store/perm'
import '@/styles/ui.css'      // ← 全域樣式（關鍵）

createApp(App).use(router).use(permPlugin).mount('#app')
