<template>
  <!-- 路由頁面會吃到全域 CSS 變數，不用各頁再判斷主題 -->
  <router-view />
</template>

<script setup>
/**
 * 修正重點：
 * - 不使用 top-level await，避免 async setup 需要 <Suspense>
 * - 動態載入 datasource 與 seed，所有非同步都放進 onMounted
 * - 切換 mock / firebase 與主題套用都有防呆，缺模組不會炸 UI
 */
import { onMounted, onBeforeUnmount } from 'vue'

// 將在 onMounted 內賦值
let ds = null               // datasource module
let seedFactory = null      // default export function from seed

function applyThemeFromSeed(seedObj) {
  try {
    const theme = seedObj?.runtime?.theme === 'dark' ? 'dark' : 'light'
    const root = document?.documentElement
    if (!root) return
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  } catch {}
}

function getDesiredMode(dsModule, seedObj) {
  try {
    if (typeof dsModule?.getMode === 'function') {
      const m = dsModule.getMode()
      if (m === 'mock' || m === 'firebase') return m
    }
  } catch {}
  try {
    const m = seedObj?.settings?.datasource?.mode
    if (m === 'mock' || m === 'firebase') return m
  } catch {}
  try {
    const k = localStorage.getItem('settings.datasource.mode') || localStorage.getItem('ds-mode')
    if (k === 'mock' || k === 'firebase') return k
  } catch {}
  return 'mock'
}

async function ensureDatasource(dsModule, mode) {
  try {
    if (typeof dsModule?.setMode === 'function') {
      await dsModule.setMode(mode)
    } else if (Object.prototype.hasOwnProperty.call(dsModule || {}, 'mode')) {
      dsModule.mode = mode
    }

    // 若底層有初始化方法，盡量呼叫但不中斷
    const initFn =
      dsModule?.init ||
      dsModule?.ensureInit ||
      dsModule?.boot
    if (typeof initFn === 'function') {
      await initFn({ mode })
    }
  } catch {
    // 忽略：缺模組或初始化失敗不影響頁面渲染
  }
}

// 用於移除事件監聽
let boundStorageHandler = null
function createStorageHandler(dsModule) {
  return function handleStorage(e) {
    if (!e) return
    // 支援兩種 key：舊 'settings.datasource.mode' 與現行 'ds-mode'
    if (e.key === 'settings.datasource.mode' || e.key === 'ds-mode') {
      const nv = e.newValue
      if (nv === 'mock' || nv === 'firebase') {
        ensureDatasource(dsModule, nv).catch(() => {
          try { location.reload() } catch {}
        })
      }
    }
  }
}

onMounted(async () => {
  // 動態載入（不使用 top-level await）
  try { seedFactory = (await import('@/seed/seedData')).default } catch {}
  try { ds = await import('@/store/datasource') } catch {}

  const seedObj = typeof seedFactory === 'function' ? seedFactory() : null
  applyThemeFromSeed(seedObj)

  const mode = getDesiredMode(ds, seedObj)
  await ensureDatasource(ds, mode)

  // 同步跨分頁資料源切換
  boundStorageHandler = createStorageHandler(ds)
  try { window.addEventListener('storage', boundStorageHandler) } catch {}
})

onBeforeUnmount(() => {
  if (boundStorageHandler) {
    try { window.removeEventListener('storage', boundStorageHandler) } catch {}
    boundStorageHandler = null
  }
})
</script>

<style>
html, body, #app { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); }
</style>
