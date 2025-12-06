// src/composables/useToast.js
import { reactive } from 'vue'

/**
 * 全域 toast 狀態
 * toasts: [{ id, message, type }]
 * type: 'info' | 'success' | 'warn' | 'error'
 */
const toasts = reactive([])

/** 給 ToastHost.vue 使用，拿到目前所有 toast */
export function useToastState () {
  return { toasts }
}

/**
 * 顯示一則 toast
 * @param {string} message - 要顯示的內容
 * @param {'info'|'success'|'warn'|'error'} type
 * @param {number} duration - 顯示多久(ms)
 */
export function showToast (message, type = 'info', duration = 3000) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  toasts.push({ id, message, type })

  // 自動移除
  setTimeout(() => {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx >= 0) toasts.splice(idx, 1)
  }, duration)
}
