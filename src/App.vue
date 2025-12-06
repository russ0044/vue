<template>
  <!-- 路由頁面 -->
  <router-view />

  <!-- 通知鈴鐺＋Toast -->
  <AlarmBell />
  <ToastHost />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import AlarmBell from '@/components/AlarmBell.vue'
import ToastHost from '@/components/ToastHost.vue'

// 不再需要 startAlarmCenter / stopAlarmCenter！
import * as ds from '@/store/datasource'

let seedFactory = null
let boundStorageHandler = null

function applyThemeFromSeed(seedObj) {
  try {
    const theme = seedObj?.runtime?.theme === 'dark' ? 'dark' : 'light'
    const root = document?.documentElement
    if (!root) return
    root.classList.toggle('dark', theme === 'dark')
  } catch {}
}

function getDesiredMode(dsModule, seedObj) {
  try {
    const m = dsModule?.getMode?.()
    if (m === 'mock' || m === 'firebase') return m
  } catch {}

  try {
    const m = seedObj?.settings?.datasource?.mode
    if (m === 'mock' || m === 'firebase') return m
  } catch {}

  const k = localStorage.getItem('settings.datasource.mode') || localStorage.getItem('ds-mode')
  return (k === 'firebase') ? 'firebase' : 'mock'
}

async function ensureDatasource(dsModule, mode) {
  try {
    if (typeof dsModule?.setMode === 'function') {
      await dsModule.setMode(mode)
    } else if (Object.prototype.hasOwnProperty.call(dsModule || {}, 'mode')) {
      dsModule.mode = mode
    }

    const initFn = dsModule?.init || dsModule?.ensureInit || dsModule?.boot
    if (typeof initFn === 'function') await initFn({ mode })
  } catch {}
}

function createStorageHandler(dsModule) {
  return function handleStorage(e) {
    if (!e) return
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
  let dsModule = null
  try { seedFactory = (await import('@/seed/seedData')).default } catch {}
  try { dsModule = await import('@/store/datasource') } catch {}

  const seedObj = typeof seedFactory === 'function' ? seedFactory() : null
  applyThemeFromSeed(seedObj)

  const mode = getDesiredMode(dsModule, seedObj)
  await ensureDatasource(dsModule, mode)

  // 監聽不同頁籤下的資料源切換
  boundStorageHandler = createStorageHandler(dsModule)
  window.addEventListener('storage', boundStorageHandler)
})

onBeforeUnmount(() => {
  if (boundStorageHandler) {
    window.removeEventListener('storage', boundStorageHandler)
    boundStorageHandler = null
  }
})
</script>

<style>
html, body, #app { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); }
</style>
