// src/store/theme.js   ← 不用 pinia，只用 Vue
import { ref } from 'vue'

let singleton // 保證全域單例
function getSystemPrefersDark () {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function useTheme () {
  if (singleton) return singleton

  const mode = ref(localStorage.getItem('theme.mode') || 'auto') // 'light' | 'dark' | 'auto'
  const density = ref(localStorage.getItem('theme.density') || 'comfortable') // 'comfortable' | 'compact'
  const accent = ref(localStorage.getItem('theme.accent') || '#2563eb')
  const locale = ref(localStorage.getItem('theme.locale') || 'zh-TW')
  const tz = ref(localStorage.getItem('theme.tz') || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'))
  const dateFmt = ref(localStorage.getItem('theme.dateFmt') || 'yyyy-MM-dd')

  const apply = () => {
    const root = document.documentElement
    const effectiveDark = mode.value === 'dark' || (mode.value === 'auto' && getSystemPrefersDark())
    root.dataset.theme = effectiveDark ? 'dark' : 'light'
    root.dataset.density = density.value
    root.style.setProperty('--accent', accent.value)
  }

  function setMode (m) { mode.value = m; localStorage.setItem('theme.mode', m); apply() }
  function setDensity (d) { density.value = d; localStorage.setItem('theme.density', d); apply() }
  function setAccent (c) { accent.value = c; localStorage.setItem('theme.accent', c); apply() }
  function setLocale (v) { locale.value = v; localStorage.setItem('theme.locale', v) }
  function setTz (v) { tz.value = v; localStorage.setItem('theme.tz', v) }
  function setDateFmt (v) { dateFmt.value = v; localStorage.setItem('theme.dateFmt', v) }

  // 系統主題變動時自動套用（mode=auto）
  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  media?.addEventListener?.('change', () => { if (mode.value === 'auto') apply() })

  apply() // 初始化

  singleton = { mode, density, accent, locale, tz, dateFmt, setMode, setDensity, setAccent, setLocale, setTz, setDateFmt, apply }
  return singleton
}
