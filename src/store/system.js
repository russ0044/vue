// src/store/system.js
import { reactive } from 'vue'

const state = reactive({
  theme: localStorage.getItem('theme') || 'auto', // 'light' | 'dark' | 'auto'
  language: localStorage.getItem('lang') || 'zh-TW', // 'zh-TW' | 'en-US'
})

export function useSystem() {
  function initSystem() {
    applyTheme(state.theme)
    applyLang(state.language)
  }

  function setTheme(mode) {
    state.theme = mode
    localStorage.setItem('theme', mode)
    applyTheme(mode)
  }

  function applyTheme(mode) {
    if (mode === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', mode)
    }
  }

  function setLang(lang) {
    state.language = lang
    localStorage.setItem('lang', lang)
    applyLang(lang)
  }

  function applyLang(lang) {
    document.documentElement.lang = lang
  }

  return { state, initSystem, setTheme, setLang }
}
