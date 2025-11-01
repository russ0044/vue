import { createApp } from 'vue'
import App from './App.vue'
import router from './router'            // ✅ 匯入路由
import './assets/main.css'

// ---- 主題初始化（可留可改） ----
const saved = localStorage.getItem('theme')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const mode = saved ?? (prefersDark ? 'dark' : 'light')
document.documentElement.classList.toggle('theme-dark', mode === 'dark')
window.setTheme = (m) => {
  const isDark = m === 'dark'
  document.documentElement.classList.toggle('theme-dark', isDark)
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}
// --------------------------------

createApp(App)
  .use(router)                           // ✅ 安裝路由
  .mount('#app')
