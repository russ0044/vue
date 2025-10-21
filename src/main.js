import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/ui.css'
import { useSystem } from '@/store/system'

const app = createApp(App)
app.use(router)

// ★ 初始化主題（會把 html[data-theme] 設好）
useSystem().initSystem()

app.mount('#app')
