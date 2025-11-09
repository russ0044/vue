// src/store/theme.js
// 不用 pinia；以 Vue 單例模式集中管理主題與顯示偏好。
// - 與 datasource 打通（有 ds.setTheme 時一併同步）
// - 同步 <html data-theme="..."> 與 .dark class，符合你的 CSS
// - 提供全域 window.setTheme 供舊畫面直接呼叫（Settings.vue 已使用）
// - 監聽系統深淺色變化（auto）與多分頁 localStorage 同步

import { ref } from 'vue'
import * as ds from '@/store/datasource'

let singleton // 全域單例

/* ------------------------- 環境/工具 ------------------------- */
const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined'
const mq = hasDOM && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
const sysPrefersDark = () => (mq?.matches ?? false)

const K = {
  mode: 'theme',               // 與現有專案相容（localStorage 'theme'）
  density: 'theme.density',
  accent: 'theme.accent',
  locale: 'theme.locale',
  tz: 'theme.tz',
  dateFmt: 'theme.dateFmt',
}

function readLS(key, dft) { try { const v = localStorage.getItem(key); return v ?? dft } catch { return dft } }
function writeLS(key, v)   { try { localStorage.setItem(key, v) } catch {} }

/* ------------------------- 主入口 ------------------------- */
export function useTheme () {
  if (singleton) return singleton

  // 初始值：先看 localStorage，再看 datasource.runtime.theme（若有）
  const runtime = ds.read?.() || {}
  const runtimeTheme = runtime?.runtime?.theme
  const initMode = (() => {
    const ls = readLS(K.mode, null)
    if (ls === 'light' || ls === 'dark' || ls === 'auto') return ls
    if (runtimeTheme === 'light' || runtimeTheme === 'dark') return runtimeTheme
    return 'auto'
  })()

  const mode    = ref(initMode)                               // 'light' | 'dark' | 'auto'
  const density = ref(readLS(K.density, 'comfortable'))       // 'comfortable' | 'compact'
  const accent  = ref(readLS(K.accent, '#2563eb'))
  const locale  = ref(readLS(K.locale, 'zh-TW'))
  const tz      = ref(readLS(K.tz, Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'))
  const dateFmt = ref(readLS(K.dateFmt, 'yyyy-MM-dd'))

  const isDarkEffective = () => (mode.value === 'dark') || (mode.value === 'auto' && sysPrefersDark())

  /** 實際套用到 DOM（支援 data-theme 與 .dark） */
  const apply = () => {
    if (!hasDOM) return
    const root = document.documentElement
    const dark = isDarkEffective()

    root.dataset.theme = dark ? 'dark' : 'light'
    root.classList.toggle('dark', dark)

    root.dataset.density = density.value || 'comfortable'
    root.style.setProperty('--accent', accent.value || '#2563eb')

    // 對外廣播，以便其它模組（如 system.js）更新 effective 狀態
    try { window.dispatchEvent(new CustomEvent('theme-changed', { detail: snapshot() })) } catch {}
  }

  /* ------------------------- setters ------------------------- */
  function setMode (m) {
    const next =
      m === 'light' || m === 'dark' || m === 'auto'
        ? m
        : 'auto'
    mode.value = next
    writeLS(K.mode, next)

    // 只在 light/dark 時同步到 datasource（auto 交由本模組決定 effective）
    if (next === 'light' || next === 'dark') {
      ds.setTheme?.(next)
    }
    apply()
  }

  function setDensity (d) { density.value = d || 'comfortable'; writeLS(K.density, density.value); apply() }
  function setAccent  (c) { accent.value  = c || '#2563eb';      writeLS(K.accent,  accent.value);  apply() }
  function setLocale  (v) { locale.value  = v || 'zh-TW';        writeLS(K.locale,  locale.value) }
  function setTz      (v) { tz.value      = v || 'Asia/Taipei';  writeLS(K.tz,      tz.value) }
  function setDateFmt (v) { dateFmt.value = v || 'yyyy-MM-dd';   writeLS(K.dateFmt, dateFmt.value) }

  /* ------------------------- 工具 ------------------------- */
  function snapshot () {
    return {
      mode: mode.value,
      density: density.value,
      accent: accent.value,
      locale: locale.value,
      tz: tz.value,
      dateFmt: dateFmt.value,
      effective: isDarkEffective() ? 'dark' : 'light',
    }
  }

  /* ------------------------- 同步：系統與多分頁 ------------------------- */
  // 系統深淺色變動：auto 模式時即時更新
  mq?.addEventListener?.('change', () => { if (mode.value === 'auto') apply() })

  // 其它分頁改了 localStorage('theme') 時同步
  if (hasDOM) {
    window.addEventListener('storage', (e) => {
      if (e.key === K.mode && e.newValue) {
        const nv = e.newValue
        if (nv === 'light' || nv === 'dark' || nv === 'auto') {
          mode.value = nv
          apply()
        }
      }
      if (e.key === K.density && e.newValue) { density.value = e.newValue; apply() }
      if (e.key === K.accent  && e.newValue) { accent.value  = e.newValue; apply() }
    })
  }

  // 初始化套用一次
  apply()

  // 提供全域快捷（老檔案 Settings.vue 有呼叫 window.setTheme）
  try {
    if (hasDOM && !window.setTheme) {
      window.setTheme = (m) => setMode(m)
    }
  } catch {}

  singleton = {
    // refs
    mode, density, accent, locale, tz, dateFmt,
    // actions
    setMode, setDensity, setAccent, setLocale, setTz, setDateFmt,
    // utils
    apply, snapshot,
  }
  return singleton
}
