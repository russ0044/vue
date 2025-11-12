<template>
  <!-- 所有路由頁面 -->
  <router-view />

  <!-- 全站提醒：鬧鐘＋Toast 列表 -->
  <AlarmBell />
  <Toast />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import AlarmBell from '@/components/AlarmBell.vue'
import Toast from '@/components/Toast.vue'
import { startAlarmCenter, stopAlarmCenter } from '@/composables/useAlarmCenter'

// 動態載入資料源與 seed（避免 top-level await）
let ds = null
let seedFactory = null

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
    if (typeof dsModule?.setMode === 'function') await dsModule.setMode(mode)
    else if (Object.prototype.hasOwnProperty.call(dsModule || {}, 'mode')) dsModule.mode = mode
    const initFn = dsModule?.init || dsModule?.ensureInit || dsModule?.boot
    if (typeof initFn === 'function') await initFn({ mode })
  } catch {}
}

let boundStorageHandler = null
function createStorageHandler(dsModule) {
  return function handleStorage(e) {
    if (!e) return
    if (e.key === 'settings.datasource.mode' || e.key === 'ds-mode') {
      const nv = e.newValue
      if (nv === 'mock' || nv === 'firebase') {
        ensureDatasource(dsModule, nv).catch(() => { try { location.reload() } catch {} })
      }
    }
  }
}

onMounted(async () => {
  try { seedFactory = (await import('@/seed/seedData')).default } catch {}
  try { ds = await import('@/store/datasource') } catch {}

  const seedObj = typeof seedFactory === 'function' ? seedFactory() : null
  applyThemeFromSeed(seedObj)

  const mode = getDesiredMode(ds, seedObj)
  await ensureDatasource(ds, mode)

  // 防止 HMR 重複啟動
  if (!window.__alarm_center_started__) {
    startAlarmCenter()
    window.__alarm_center_started__ = true
  }

  boundStorageHandler = createStorageHandler(ds)
  try { window.addEventListener('storage', boundStorageHandler) } catch {}
})

onBeforeUnmount(() => {
  stopAlarmCenter()
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
