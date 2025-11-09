// src/store/system.js
// 目標：維持原 API（initSystem / setTheme / setLang），但把主題委派給 useTheme()，避免重複邏輯。
// - 自動把主題同步到 <html data-theme="..."> 與 .dark class（與現有 CSS 相容）
// - 仍保留語言設定（<html lang="...">）
// - 與 localStorage 同步；若你的 useTheme 內部還會呼叫 datasource.setTheme() 也能一併生效

import { reactive } from 'vue'
import { useTheme } from '@/store/theme' // 單例 hook：需提供 setMode(mode) / apply() / snapshot()

/* ----------------------------- 主題模組 ----------------------------- */
const theme = useTheme()

// 安全取得目前有效主題（當 theme 模組尚未初始化時的預估）
function computeEffective(mode) {
  if (mode === 'light' || mode === 'dark') return mode
  // auto：依系統判斷（prefers-color-scheme）
  const isDark = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  return isDark ? 'dark' : 'light'
}

/* ----------------------------- 狀態 ----------------------------- */
const storedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || theme?.mode?.value || 'auto'
const storedLang  = (typeof localStorage !== 'undefined' && localStorage.getItem('lang'))  || 'zh-TW'

const state = reactive({
  // 對外行為維持不變
  theme: storedTheme,           // 'light' | 'dark' | 'auto'
  language: storedLang,         // e.g. 'zh-TW' | 'en-US'
  // 目前實際生效的主題（auto 會動態決定）
  effective: theme?.snapshot?.().effective ?? computeEffective(storedTheme),
})

/* ----------------------------- 私有工具 ----------------------------- */
function applyLang(lang) {
  try { document.documentElement.lang = lang } catch {}
}

/* ----------------------------- 對外 API ----------------------------- */
/** 在 main.js 入口處呼叫一次 */
function initSystem() {
  // 初始化主題
  try {
    theme.setMode(state.theme) // 交給 theme 模組管理（含與 datasource 的同步）
    theme.apply()              // 寫入 <html data-theme> 與 .dark
    // 初始回填 effective
    state.effective = theme?.snapshot?.().effective ?? computeEffective(state.theme)
  } catch {
    // 極端情況：theme 模組不可用時，至少套用 data-theme 與 .dark
    const final = computeEffective(state.theme)
    try {
      document.documentElement.setAttribute('data-theme', final)
      document.documentElement.classList.toggle('dark', final === 'dark')
    } catch {}
    state.effective = final
  }

  // 套用語言
  applyLang(state.language)

  // 監聽主題變化事件（由 useTheme 觸發）
  window.addEventListener('theme-changed', (e) => {
    try {
      const eff = e?.detail?.effective
      if (eff === 'light' || eff === 'dark') state.effective = eff
    } catch {}
  })
}

/** 設定主題：'light' | 'dark' | 'auto' */
function setTheme(next) {
  const m = (next === 'light' || next === 'dark' || next === 'auto') ? next : 'auto'
  state.theme = m
  try { localStorage.setItem('theme', m) } catch {}

  try {
    theme.setMode(m)
    theme.apply()
    state.effective = theme?.snapshot?.().effective ?? computeEffective(m)
  } catch {
    const final = computeEffective(m)
    try {
      document.documentElement.setAttribute('data-theme', final)
      document.documentElement.classList.toggle('dark', final === 'dark')
    } catch {}
    state.effective = final
  }
}

/** 設定語言（例：'zh-TW'、'en-US'） */
function setLang(lang) {
  state.language = lang || 'zh-TW'
  try { localStorage.setItem('lang', state.language) } catch {}
  applyLang(state.language)
}

export function useSystem() {
  return { state, initSystem, setTheme, setLang }
}
