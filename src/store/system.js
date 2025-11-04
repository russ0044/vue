// src/store/system.js
// 目標：維持原 API（initSystem / setTheme / setLang），但把主題委派給 useTheme()，避免重複邏輯。
// - 自動將主題狀態套用到 <html data-theme="..."> 與 .dark class，與你的 CSS 相容
// - 仍保留語言設定（<html lang="...">）
// - 與 localStorage 同步；若你有 datasource.setTheme()，已由 useTheme() 處理

import { reactive } from 'vue'
import { useTheme } from '@/store/theme' // 先前提供的單例 hook

const theme = useTheme()

const state = reactive({
  // 保留你的欄位名稱，對外行為不變
  theme: localStorage.getItem('theme') || theme.mode.value || 'auto', // 'light' | 'dark' | 'auto'
  language: localStorage.getItem('lang') || 'zh-TW',
  // 額外提供：目前真正生效的主題（auto 時依系統偵測）
  effective: theme.snapshot().effective, // 'light' | 'dark'
})

/** 對外：初始化系統（在 main.js 進入點呼叫一次） */
function initSystem() {
  // 以現有 state.theme 初始化 theme 模組
  // 若是 'auto'，useTheme 會依系統偏好自動決定深淺色
  theme.setMode(state.theme)
  // 立即套用（含 data-theme 與 .dark）
  theme.apply()

  // 語言
  applyLang(state.language)

  // 監聽主題變更事件，更新 effective 狀態（提供給 UI 需要時使用）
  window.addEventListener('theme-changed', (e) => {
    try { state.effective = e.detail?.effective || state.effective } catch {}
  })
}

/** 對外：設定主題（'light' | 'dark' | 'auto'） */
function setTheme(mode) {
  const m = (mode === 'light' || mode === 'dark' || mode === 'auto') ? mode : 'auto'
  state.theme = m
  localStorage.setItem('theme', m)
  theme.setMode(m)   // 交由 useTheme 處理 DOM 與 datasource 同步
  theme.apply()
  // effective 會由事件回填；但為了即時性先預估一次
  state.effective = theme.snapshot().effective
}

/** 對外：設定語言（'zh-TW' | 'en-US' ...） */
function setLang(lang) {
  state.language = lang || 'zh-TW'
  localStorage.setItem('lang', state.language)
  applyLang(state.language)
}

/* 內部：套用語言到 <html> */
function applyLang(lang) {
  try { document.documentElement.lang = lang } catch {}
}

export function useSystem() {
  return { state, initSystem, setTheme, setLang }
}
