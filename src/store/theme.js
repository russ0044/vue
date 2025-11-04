// src/store/theme.js
// 不用 pinia，只用 Vue + 單例模式；統一主題偏好並與 datasource.runtime.theme 打通
import { ref } from 'vue'
import * as ds from '@/store/datasource'

let singleton // 保證全域單例；多次 useTheme() 取到同一組 refs

// —— 環境守衛 —— //
const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined'
const mq = hasDOM && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
const sysPrefersDark = () => (mq?.matches ?? false)

// —— 儲存 key —— //
const K = {
  mode: 'theme.mode',          // 'light' | 'dark' | 'auto'
  density: 'theme.density',    // 'comfortable' | 'compact'
  accent: 'theme.accent',      // CSS color
  locale: 'theme.locale',      // 'zh-TW' ...
  tz: 'theme.tz',              // IANA TZ
  dateFmt: 'theme.dateFmt',    // 'yyyy-MM-dd'
}

// 讀 localStorage 安全取值
function readLS(key, dft) {
  try { const v = localStorage.getItem(key); return v ?? dft } catch { return dft }
}
function writeLS(key, v) {
  try { localStorage.setItem(key, v) } catch {}
}

export function useTheme () {
  if (singleton) return singleton

  // —— 初始值（優先 datasource.runtime.theme，其次 localStorage，再來系統預設）—— //
  const snap = ds.read?.() || {}
  const runtimeTheme = snap?.runtime?.theme

  const initMode =
    (runtimeTheme === 'light' || runtimeTheme === 'dark') ? runtimeTheme :
    readLS(K.mode, 'auto')

  const mode    = ref(initMode)                                        // 'light' | 'dark' | 'auto'
  const density = ref(readLS(K.density, 'comfortable'))
  const accent  = ref(readLS(K.accent, '#2563eb'))
  const locale  = ref(readLS(K.locale, 'zh-TW'))
  const tz      = ref(readLS(K.tz, Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'))
  const dateFmt = ref(readLS(K.dateFmt, 'yyyy-MM-dd'))

  // 計算有效暗色
  const isDarkEffective = () => (mode.value === 'dark') || (mode.value === 'auto' && sysPrefersDark())

  // —— 實際套用到 DOM（兼容兩種寫法：data-theme 與 .dark class）—— //
  const apply = () => {
    if (!hasDOM) return
    const root = document.documentElement
    const dark = isDarkEffective()

    // 兩種都設：既支援 :root.dark，也支援 [data-theme="dark"]
    root.dataset.theme = dark ? 'dark' : 'light'
    root.classList.toggle('dark', dark)

    // 其他偏好
    root.dataset.density = density.value || 'comfortable'
    root.style.setProperty('--accent', accent.value || '#2563eb')

    // 對外廣播（可被頁面監聽做額外處理）
    try { window.dispatchEvent(new CustomEvent('theme-changed', { detail: snapshot() })) } catch {}
  }

  // —— setters（寫入 localStorage + 同步 datasource.runtime.theme）—— //
  function setMode (m) {
    mode.value = m || 'auto'
    writeLS(K.mode, mode.value)
    // 回寫 datasource.runtime.theme：只有 light/dark 會固化；auto 就不覆蓋 runtime
    if (mode.value === 'light' || mode.value === 'dark') {
      ds.setTheme?.(mode.value)
    }
    apply()
  }
  function setDensity (d) { density.value = d || 'comfortable'; writeLS(K.density, density.value); apply() }
  function setAccent  (c) { accent.value  = c || '#2563eb';      writeLS(K.accent, accent.value);  apply() }
  function setLocale  (v) { locale.value  = v || 'zh-TW';        writeLS(K.locale, locale.value) }
  function setTz      (v) { tz.value      = v || 'Asia/Taipei';  writeLS(K.tz, tz.value) }
  function setDateFmt (v) { dateFmt.value = v || 'yyyy-MM-dd';   writeLS(K.dateFmt, dateFmt.value) }

  // —— 便利工具 —— //
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

  // 系統深淺色變動時自動套用（限 mode=auto）
  mq?.addEventListener?.('change', () => { if (mode.value === 'auto') apply() })

  // 初始化套用一次
  apply()

  singleton = { mode, density, accent, locale, tz, dateFmt, setMode, setDensity, setAccent, setLocale, setTz, setDateFmt, apply, snapshot }
  return singleton
}
