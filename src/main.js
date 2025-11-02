// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import './assets/main.css' // 如果你有額外的全域樣式，保留這行

// ========== 全域主題控制 ==========
// 我們的規則：在 <html> 上加或移除 .dark
// 支援三種模式：'light' | 'dark' | 'auto'
function applyTheme(mode) {
  const pref = mode || localStorage.getItem('theme') || 'light'

  // 如果是 auto，跟隨裝置顏色
  const shouldDark =
    pref === 'dark' ||
    (pref === 'auto' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', !!shouldDark)
}

// 初次進站：
// 1. localStorage: 'light' / 'dark' / 'auto'
// 2. 如果沒存 -> 根據系統深色偏好
const saved = localStorage.getItem('theme')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
applyTheme(saved ?? (prefersDark ? 'dark' : 'light'))

// 提供全域 API 給「系統設定頁」或任何組件呼叫
// 範例：window.setTheme('light') / window.setTheme('dark') / window.setTheme('auto')
window.setTheme = (mode) => {
  localStorage.setItem('theme', mode)
  applyTheme(mode)
}

// 當其他分頁（或同分頁的別組件）改了 theme，這頁會跟著同步
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') {
    applyTheme(e.newValue)
  }
})

// 如果現在是 auto，系統的深淺模式改變時，也要自動跟著換
const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
mql?.addEventListener?.('change', () => {
  applyTheme() // 不帶參數，會自己讀 localStorage 再判斷
})
// ========== 全域主題控制結束 ==========

createApp(App).use(router).mount('#app')
