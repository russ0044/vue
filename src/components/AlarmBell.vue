<!-- src/components/AlarmBell.vue -->
<template>
  <div class="alarm-bell" ref="root">
    <button class="bell-btn" @click="toggle" aria-haspopup="dialog" :aria-expanded="open ? 'true' : 'false'">
      <!-- 你自己的圖示可替換這個 emoji -->
      🔔
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </button>

    <Transition name="fade">
      <div v-if="open" class="panel" role="dialog" aria-label="通知清單">
        <header class="panel-header">
          <strong>通知</strong>
          <button class="close" @click="close" aria-label="關閉">✕</button>
        </header>
        <ul class="list">
          <li v-if="items.length === 0" class="empty">目前沒有通知</li>
          <li v-for="it in items" :key="it.id" class="item">
            <div class="item-title">{{ it.title ?? it.event ?? '事件' }}</div>
            <div v-if="it.time || it.date" class="item-sub">
              {{ it.time ?? it.date }}
            </div>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, defineProps } from 'vue'

// --- props：可不傳，預設為空 ---
const props = defineProps({
  modelValue: { type: Boolean, default: undefined },          // 父層若用 v-model
  open: { type: Boolean, default: undefined },                // 父層若用 v-model:open（Vue 3.4+）
  items: { type: Array, default: () => [] },
  unread: { type: Number, default: 0 }
})

// --- 內部 state：若父層沒用 v-model，改用本地開關 ---
const internalOpen = ref(false)

// 同步父層可能傳進來的 model（兩種寫法都支援）
const open = ref(
  props.open ?? props.modelValue ?? internalOpen.value
)

// 回推父層（若有綁 v-model / v-model:open）
const emit = defineEmits(['update:modelValue', 'update:open'])

watch(open, (v) => {
  emit('update:modelValue', v)
  emit('update:open', v)
})

// 當父層變更時，同步到本地
watch(() => props.modelValue, (v) => {
  if (v !== undefined) open.value = v
})
watch(() => props.open, (v) => {
  if (v !== undefined) open.value = v
})

function toggle() {
  // 若父層沒提供 v-model，使用內部狀態；不論如何都切換 open
  if (props.modelValue === undefined && props.open === undefined) {
    internalOpen.value = !internalOpen.value
  }
  open.value = !open.value
}
function close() {
  if (props.modelValue === undefined && props.open === undefined) {
    internalOpen.value = false
  }
  open.value = false
}

// 點外面關閉
const root = ref(null)
function onClickOutside(e) {
  if (!root.value) return
  if (!root.value.contains(e.target)) close()
}
// ESC 關閉
function onKeydown(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside, true)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside, true)
  document.removeEventListener('keydown', onKeydown)
})

// 未讀數（如果沒傳 unread，就用 items.length）
const unreadCount = computed(() => props.unread || props.items.length)
const items = computed(() => props.items || [])
</script>

<style scoped>
.alarm-bell { position: relative; display: inline-block; }
.bell-btn {
  position: relative;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}
.badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background: #ef4444;
  border-radius: 9999px;
}
.panel {
  position: absolute;
  right: 0;
  margin-top: 8px;
  width: 280px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
  overflow: hidden;
  z-index: 30;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}
.close {
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
}
.list { list-style: none; margin: 0; padding: 8px 0; max-height: 320px; overflow: auto; }
.item { padding: 8px 12px; }
.item + .item { border-top: 1px dashed #eef2f7; }
.item-title { font-size: 14px; }
.item-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
.empty { padding: 16px 12px; color: #6b7280; font-size: 14px; text-align: center; }

.fade-enter-active, .fade-leave-active { transition: opacity .12s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
