// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css' // ✅ 僅保留這行（不要再引入 main.css）

/* ============================================================================
   全域主題控制（與你的 CSS 相容）
   - 支援 'light' | 'dark' | 'auto'
   - 同步 <html> 加上 .dark 與 data-theme（兩者皆設，方便樣式寫法並存）
   - 監聽 localStorage 及系統色彩偏好變化
   ============================================================================ */
function resolveShouldDark(mode) {
  const m =
    mode ??
    (() => {
      try { return localStorage.getItem('theme') } catch { return null }
    })() ??
    'light'

  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  return m === 'dark' || (m === 'auto' && prefersDark)
}

function applyTheme(mode) {
  const root = document.documentElement
  const dark = resolveShouldDark(mode)
  // 兩種寫法都設，確保樣式檔的 :root.dark 與 .dark 選擇器都生效
  root.classList.toggle('dark', dark)
  root.dataset.theme = dark ? 'dark' : 'light'
}

(function bootTheme() {
  // 初始套用
  let saved = null
  try { saved = localStorage.getItem('theme') } catch {}
  applyTheme(saved ?? 'light')

  // 對外提供 API（供設定頁呼叫）
  window.setTheme = (mode) => {
    try { localStorage.setItem('theme', mode) } catch {}
    applyTheme(mode)
  }
  window.getTheme = () => {
    try { return localStorage.getItem('theme') || 'light' } catch { return 'light' }
  }

  // 跨分頁同步
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') applyTheme(e.newValue)
  })

  // 系統色彩偏好改變（auto 模式時會即時切換）
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
  const onPrefChange = () => {
    const cur = (() => {
      try { return localStorage.getItem('theme') } catch { return null }
    })() || 'light'
    if (cur === 'auto') applyTheme('auto')
  }
  if (mql?.addEventListener) mql.addEventListener('change', onPrefChange)
  else if (mql?.addListener) mql.addListener(onPrefChange) // 舊瀏覽器備援
})()

/* ============================================================================
   啟動應用
   ============================================================================ */
createApp(App).use(router).mount('#app')
