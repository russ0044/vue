<template>
  <div class="toast-container" aria-live="polite" aria-atomic="true">
    <transition-group name="fade" tag="div">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :data-type="t.type"
        role="status"
      >
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastState } from '@/composables/useToast'

const { toasts } = useToastState()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px; /* ← 避免重疊的關鍵 */
  z-index: 9999;
}

.toast {
  min-width: 220px;
  max-width: 56ch;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  color: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  word-break: break-word;
  opacity: 0.96;
}

/* 類型顏色（保持你的風格） */
.toast[data-type='info']    { background: #2563eb; }
.toast[data-type='success'] { background: #16a34a; }
.toast[data-type='error']   { background: #dc2626; }
.toast[data-type='warn']    { background: #f59e0b; }

/* 動畫 */
.fade-enter-active, .fade-leave-active { transition: all .25s ease; }
.fade-enter-from { opacity: 0; transform: translateY(14px); }
.fade-leave-to   { opacity: 0; transform: translateY(14px); }
</style>
