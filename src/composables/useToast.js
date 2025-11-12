// src/composables/useToast.js
import { ref } from 'vue'

/**
 * 全域 Toast 狀態
 * 你只要在 App.vue 放 <Toast />，任何地方呼叫 showToast() 都會顯示。
 */
export const toasts = ref([])

/**
 * 顯示一則 Toast
 * @param {string} msg 訊息內容
 * @param {'info'|'success'|'error'|'warn'} [type='info'] 類型
 * @param {number} [timeout=3000] 顯示時間（毫秒）
 */
export function showToast(msg, type = 'info', timeout = 3000) {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, msg, type })

  // 到期自動移除
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, timeout)
}

/** 清空所有 Toast（很少用，提供除錯或重置時使用） */
export function clearToast() {
  toasts.value = []
}
