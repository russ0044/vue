// src/composables/useAlarmCenter.js
import { reactive, ref } from 'vue'
import * as ds from '@/store/datasource'   // 你的資料源模組（mock / firebase 皆可）
import { showToast } from '@/composables/useToast'

/**
 * 告警中心全域狀態
 * items: [{ id, level, msg, ts, read }]
 * unread: 未讀數
 * hasCritical: 是否有嚴重告警（level === 'error'）
 */
const state = reactive({
  items: [],
  unread: 0,
  hasCritical: false,
})

/** 已提醒過的 key，避免同一條件狂跳 */
const seenKeys = new Set()

/** 資料訂閱取消函數 / 定時器（若你還有輪詢） */
let unsubscribe = null
let timer = null

/** 建立告警（同時 Toast） */
function pushAlarm({ key, msg, level = 'warn' }) {
  // 防重複通知：同一 key 只提醒一次，直到條件解除才可能再次提醒
  if (key && seenKeys.has(key)) return
  if (key) seenKeys.add(key)

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const item = { id, level, msg, ts: Date.now(), read: false }
  state.items.unshift(item)
  state.unread++
  state.hasCritical ||= (level === 'error')

  // 畫面提示
  showToast(msg, level === 'error' ? 'error' : level)
}

/** 將某個 key 從已提醒名單移除（條件解除可再提醒） */
function clearSeen(key) {
  if (!key) return
  seenKeys.delete(key)
}

/** 計算邏輯：依「快照快取」執行檢查，找出要提醒的點 */
function evaluateSnapshot(snap) {
  try {
    /* 庫存檢查：數量 < safeThreshold → 警示 */
    const inv = Array.isArray(snap?.inventory) ? snap.inventory : []
    inv.forEach(r => {
      const qty = Number(r.qty ?? r.quantity ?? 0)
      const safe = Number(r.safeStock ?? r.safe ?? 0)
      const name = r.name || r.sku || r.id
      const key  = `inv_low|${name}`

      if (safe > 0 && qty < safe) {
        pushAlarm({ key, level: qty === 0 ? 'error' : 'warn', msg: `【庫存】${name} 庫存${qty}（門檻 ${safe}）` })
      } else {
        clearSeen(key)
      }
    })

    /* 訂單檢查：pending > 0 → 提醒 */
    const orders = Array.isArray(snap?.orders) ? snap.orders : []
    const pendings = orders.filter(o => o.status === 'pending')
    if (pendings.length > 0) {
      const key = 'order_pending'
      pushAlarm({ key, level: 'info', msg: `【訂單】目前有 ${pendings.length} 張待審核` })
    } else {
      clearSeen('order_pending')
    }

    /* 配送檢查：延遲/異常 → 提醒（你的欄位可對應修改） */
    const deliveries = Array.isArray(snap?.deliveries) ? snap.deliveries : []
    const delayed = deliveries.filter(d => d.status === 'delayed' || d.delay === true)
    if (delayed.length > 0) {
      const key = 'delivery_delayed'
      pushAlarm({ key, level: 'warn', msg: `【配送】有 ${delayed.length} 筆延遲` })
    } else {
      clearSeen('delivery_delayed')
    }
  } catch {
    // 任何解析問題都忽略，避免中斷
  }
}

/**
 * 啟動：訂閱資料源 +（可選）定時器
 * - Firebase：走 ds.subscribe((snap) => evaluateSnapshot(snap))
 * - Mock：也可提供 subscribe 回呼；若沒有，就靠 timer 去 ds.read() 輪詢
 */
export function startAlarmCenter() {
  // 避免重複啟動
  if (unsubscribe || timer) return

  if (typeof ds.subscribe === 'function') {
    unsubscribe = ds.subscribe((snap) => {
      if (snap) evaluateSnapshot(snap)
    })
  } else if (typeof ds.read === 'function') {
    // 無訂閱就每 15 秒拉一次（你可調整）
    timer = setInterval(async () => {
      try {
        const snap = await ds.read()
        if (snap) evaluateSnapshot(snap)
      } catch {}
    }, 15000)
  }
}

/** 停止：取消訂閱 / 清除 timer */
export function stopAlarmCenter() {
  try { unsubscribe?.(); } catch {}
  unsubscribe = null
  try { clearInterval(timer) } catch {}
  timer = null
}

/** 取得告警狀態（給 AlarmBell.vue 使用） */
export function useAlarmState() {
  return state
}

/** 標示全部已讀（給 AlarmBell.vue 的「清空/已讀」按鈕） */
export function markAllRead() {
  state.items.forEach(i => (i.read = true))
  state.unread = 0
  state.hasCritical = false
}

/** 手動新增自訂告警（你也可以直接使用） */
export function notify(msg, level = 'info', key = '') {
  pushAlarm({ key, msg, level })
}
