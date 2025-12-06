// src/composables/useAlarmCenter.js
// 統一產生「通知中心 / 鈴鐺」用的事件清單
// 目前會：
//  - 針對「全部門市」掃 inventory，找出：
//      * 低於安全庫存
//      * 即將到期 / 已過期
//  - 掃 deliveries / empDeliveries，產生配送通知
//  - 不再只看單一店面，所以老闆會看到 3 間門市共 20+ 筆低庫存

import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import * as ds from '@/store/datasource'
import { getMinQtyFromAllSources, getExpiryWarnDays } from '@/utils/thresholds'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function ensureContainers (snap) {
  if (!snap) return
  snap.inventory ||= []
  snap.products ||= []
  snap.thresholds ||= []
  snap.stores ||= []
  snap.empDeliveries ||= []
  snap.deliveries ||= []
  snap.kitchenRequests ||= []
}

/**
 * 使用方式：
 *   const { inventoryAlerts, deliveryAlerts, allAlerts, unreadCount } = useAlarmCenter()
 */
export function useAlarmCenter () {
  const state = reactive({
    snap: ds.read?.() || {},
    now: Date.now()
  })
  ensureContainers(state.snap)

  // 監聽 datasource（mock / firebase 皆可）
  let unsub = null
  onMounted(() => {
    unsub = ds.subscribe?.((next) => {
      state.snap = next || {}
      ensureContainers(state.snap)
      state.now = Date.now()
    })
  })
  onBeforeUnmount(() => unsub?.())

  /* ------------ 庫存相關通知（全部門市） ------------ */
  const inventoryAlerts = computed(() => {
    const snap = state.snap
    const products = snap.products || []
    const storesById = new Map((snap.stores || []).map(s => [String(s.id), s]))
    const warnDays = getExpiryWarnDays(snap)

    const list = []

    ;(snap.inventory || []).forEach(row => {
      const storeId = String(row.storeId || '')
      const store = storesById.get(storeId)
      const storeName = store?.name || storeId || '未指定店面'

      const product = products.find(p => p.id === row.sku)
      const minQty = getMinQtyFromAllSources({
        product,
        sku: row.sku,
        storeId,
        snapshot: snap
      })
      const qty = Number(row.qty) || 0

      // 1) 低於安全量
      if (minQty > 0 && qty < minQty) {
        list.push({
          id: `stock-${storeId}-${row.sku}`,
          kind: 'inventory',
          level: 'warn',
          msg: `${row.name || row.sku} 低於安全量（${qty}/${minQty}）`,
          storeId,
          storeName,
          sku: row.sku,
          ts: state.now
        })
      }

      // 2) 效期相關：已過期 / 即將到期
      if (row.exp) {
        const expDate = new Date(`${row.exp}T00:00:00`)
        if (!Number.isNaN(expDate.getTime())) {
          const diffDays = Math.floor((expDate.getTime() - state.now) / ONE_DAY_MS)

          if (diffDays < 0) {
            // 已過期
            list.push({
              id: `exp-${storeId}-${row.sku}`,
              kind: 'expiry',
              level: 'error',
              msg: `${row.name || row.sku} 已過期（${row.exp}）`,
              storeId,
              storeName,
              sku: row.sku,
              ts: state.now
            })
          } else if (diffDays <= warnDays) {
            // 即將到期（在預警天數內）
            list.push({
              id: `exp-${storeId}-${row.sku}`,
              kind: 'expiry',
              level: 'warn',
              msg: `${row.name || row.sku} 即將到期（${row.exp}，${diffDays} 天內）`,
              storeId,
              storeName,
              sku: row.sku,
              ts: state.now
            })
          }
        }
      }
    })

    // 嚴重 > 注意 > 其他；同級再依店名、訊息排序
    const levelOrder = { error: 0, warn: 1, info: 2, default: 3 }
    list.sort((a, b) => {
      const la = levelOrder[a.level] ?? 3
      const lb = levelOrder[b.level] ?? 3
      if (la !== lb) return la - lb
      if (a.storeName !== b.storeName) {
        return a.storeName.localeCompare(b.storeName, 'zh-Hant')
      }
      return (a.msg || '').localeCompare(b.msg || '', 'zh-Hant')
    })

    return list
  })

  /* ------------ 配送相關通知（全部門市） ------------ */
  const deliveryAlerts = computed(() => {
    const snap = state.snap
    const storesById = new Map((snap.stores || []).map(s => [String(s.id), s]))
    const list = []

    const allDeliveries = [
      ...(snap.deliveries || []),
      ...(snap.empDeliveries || [])
    ]

    allDeliveries.forEach(d => {
      const storeId = String(d.storeId || '')
      const storeName = storesById.get(storeId)?.name || storeId || '未指定店面'

      if (d.status === 'on_the_way') {
        list.push({
          id: `dlv-${d.id}`,
          kind: 'delivery',
          level: 'info',
          msg: `${storeName} 有配送在路上（ETA ${d.eta || '—'}）`,
          storeId,
          storeName,
          ts: state.now
        })
      } else if (d.status === 'delayed') {
        list.push({
          id: `dlv-${d.id}`,
          kind: 'delivery',
          level: 'warn',
          msg: `${storeName} 配送延誤（${d.delayReason || '請留意狀況'}）`,
          storeId,
          storeName,
          ts: state.now
        })
      }
    })

    return list
  })

  /* ------------ 對外輸出 ------------ */

  const all = computed(() => [
    ...inventoryAlerts.value,
    ...deliveryAlerts.value
  ])

  const unreadCount = computed(() => all.value.length)

  return {
    snapshot: state,        // 若你要 debug 原始 snap 也可以用
    inventoryAlerts,
    deliveryAlerts,
    allAlerts: all,
    unreadCount
  }
}

export default useAlarmCenter
