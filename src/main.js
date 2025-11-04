// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'  // ✅ 只留這一行
// ❌ 刪掉 import './assets/main.css'

// ========== 全域主題控制 ==========
function applyTheme(mode) {
  const pref = mode || localStorage.getItem('theme') || 'light'

  const shouldDark =
    pref === 'dark' ||
    (pref === 'auto' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', !!shouldDark)
}

const saved = localStorage.getItem('theme')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
applyTheme(saved ?? (prefersDark ? 'dark' : 'light'))

window.setTheme = (mode) => {
  localStorage.setItem('theme', mode)
  applyTheme(mode)
}

window.addEventListener('storage', (e) => {
  if (e.key === 'theme') applyTheme(e.newValue)
})

const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
mql?.addEventListener?.('change', () => applyTheme())
// ========== 全域主題控制結束 ==========

createApp(App).use(router).mount('#app')
