<template>
  <!-- 錯誤卡片掛在 body，避免被父層樣式覆蓋 -->
  <Teleport to="body">
    <div v-if="error" class="card" style="padding:16px;max-width:600px;margin:20px auto;">
      <h3>發生錯誤</h3>
      <p class="muted">{{ shortMessage }}</p>

      <details v-if="hasDetails" style="margin:8px 0">
        <summary>查看詳細錯誤</summary>
        <pre style="white-space:pre-wrap;font-size:12px;line-height:1.4;margin-top:6px">{{ errorDetails }}</pre>
      </details>

      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn" @click="clearError">我知道了</button>
        <button class="btn ghost" @click="retry">重新嘗試</button>
      </div>
    </div>
  </Teleport>

  <!-- 正常內容（改用 v-if，而非 v-else，避免相鄰限制） -->
  <slot v-if="!error" />
</template>

<script setup>
import { ref, onErrorCaptured, computed } from 'vue'

const emit = defineEmits(['retry'])

const error = ref('')
const errorDetails = ref('')

onErrorCaptured((err) => {
  // 取最有意義的訊息
  error.value = err?.message || String(err)
  errorDetails.value = err?.stack ? String(err.stack) : ''
  // 不攔截（讓它可繼續向上冒泡以便 devtools 觀察）
  return false
})

const shortMessage = computed(() => (error.value?.split('\n')[0] || '未知錯誤'))
const hasDetails = computed(() => !!errorDetails.value)

function clearError() {
  error.value = ''
  errorDetails.value = ''
}

function retry() {
  clearError()
  emit('retry')
}
</script>

<style scoped>
.muted{color:var(--muted)}
</style>
