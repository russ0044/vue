<!-- src/components/AlarmBell.vue -->
<template>
  <div class="alarm-bell" ref="root">
    <!-- 鈴鐺按鈕 -->
    <button
      class="bell-btn"
      @click="toggle"
      aria-haspopup="dialog"
      :aria-expanded="open ? 'true' : 'false'"
    >
      🔔
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </button>

    <!-- 通知面板 -->
    <Transition name="fade">
      <div
        v-if="open"
        class="panel"
        role="dialog"
        aria-label="通知清單"
      >
        <header class="panel-header">
          <div class="panel-title">
            <strong>通知中心</strong>
            <span v-if="unreadCount" class="tag-unread">
              未讀 {{ unreadCount }}
            </span>
          </div>
          <button class="close" @click="close" aria-label="關閉">✕</button>
        </header>

        <ul class="list">
          <li v-if="items.length === 0" class="empty">
            目前沒有通知
          </li>

          <li
            v-for="it in items"
            :key="it.id"
            class="item"
          >
            <div class="item-row">
              <span :class="['level-pill', levelClass(it.level)]">
                {{ levelLabel(it.level) }}
              </span>
              <span class="item-title">
                {{ it.msg ?? it.title ?? it.event ?? '事件' }}
              </span>
            </div>

            <div class="item-meta">
              <span v-if="it.storeName || it.storeId" class="meta-chip">
                {{ it.storeName || it.storeId }}
              </span>
              <span v-if="it.sku" class="meta-chip sku">
                {{ it.sku }}
              </span>
              <span class="time">
                {{ formatTime(it) }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  defineProps,
  defineEmits,
} from 'vue'

/* ---------- props：保持向下相容 ---------- */
const props = defineProps({
  modelValue: { type: Boolean, default: undefined }, // v-model
  open: { type: Boolean, default: undefined },       // v-model:open
  items: { type: Array, default: () => [] },         // 通知陣列（來自 useAlarmCenter）
  unread: { type: Number, default: 0 },              // 未讀數（可選）
})

const emit = defineEmits(['update:modelValue', 'update:open'])

/* ---------- 內部開關狀態（父層沒綁 v-model 時使用） ---------- */
const internalOpen = ref(false)

const open = ref(
  props.open ?? props.modelValue ?? internalOpen.value
)

/* 雙向綁定：open 改變時回推父層（若有使用 v-model） */
watch(open, (v) => {
  emit('update:modelValue', v)
  emit('update:open', v)
})

/* 父層更新時同步到本地 */
watch(
  () => props.modelValue,
  (v) => {
    if (v !== undefined) open.value = v
  }
)
watch(
  () => props.open,
  (v) => {
    if (v !== undefined) open.value = v
  }
)

/* 開關動作 */
function toggle() {
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

/* ---------- 點外面 / 按 ESC 關閉 ---------- */
const root = ref(null)

function onClickOutside(e) {
  if (!root.value) return
  if (!root.value.contains(e.target)) close()
}
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

/* ---------- 顯示用 computed ---------- */

// 未讀數：若有傳 unread 就用 unread，否則就用 items.length
const unreadCount = computed(() =>
  Number.isFinite(+props.unread) && props.unread > 0
    ? props.unread
    : (props.items?.length || 0)
)

const items = computed(() => props.items || [])

/* 標籤文字 / 顏色 */
function levelLabel(level) {
  if (level === 'error' || level === 'danger' || level === 'critical') {
    return '嚴重'
  }
  if (level === 'warn' || level === 'warning') {
    return '注意'
  }
  if (level === 'info') {
    return '資訊'
  }
  return '通知'
}
function levelClass(level) {
  if (level === 'error' || level === 'danger' || level === 'critical') {
    return 'level-error'
  }
  if (level === 'warn' || level === 'warning') {
    return 'level-warn'
  }
  if (level === 'info') {
    return 'level-info'
  }
  return 'level-default'
}

/* 時間顯示：優先 ts（毫秒），其次 time / date 字串 */
function formatTime(it) {
  if (!it) return ''
  if (it.ts) {
    const d = new Date(it.ts)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('zh-TW', {
        hour12: false,
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }
  if (it.time) return String(it.time)
  if (it.date) return String(it.date)
  return ''
}
</script>

<style scoped>
.alarm-bell {
  position: relative;
  display: inline-block;
}

/* 鈴鐺按鈕 */
.bell-btn {
  position: relative;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

/* 右上角紅點 */
.badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background: #ef4444;
  border-radius: 9999px;
}

/* 面板外觀 */
.panel {
  position: absolute;
  right: 0;
  margin-top: 8px;
  width: 360px;
  max-width: 80vw;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  z-index: 30;
  font-size: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tag-unread {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
}

/* 關閉按鈕 */
.close {
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  color: #6b7280;
}

/* 清單區 */
.list {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  max-height: 360px;
  overflow: auto;
}

.item {
  padding: 8px 12px;
}
.item + .item {
  border-top: 1px dashed #e5e7eb;
}

/* 每條通知標題 + 等級 pill */
.item-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.item-title {
  font-size: 13px;
  line-height: 1.4;
  color: #111827;
}

/* leve 標籤 */
.level-pill {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
}
.level-info {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}
.level-warn {
  background: #fffbeb;
  border-color: #fcd34d;
  color: #92400e;
}
.level-error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}
.level-default {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #374151;
}

/* meta 行：店名 / SKU / 時間 */
.item-meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: #6b7280;
}
.meta-chip {
  padding: 2px 6px;
  border-radius: 999px;
  background: #f3f4f6;
}
.meta-chip.sku {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}
.time {
  margin-left: auto;
}

/* 空狀態 */
.empty {
  padding: 16px 12px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}

/* 動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
