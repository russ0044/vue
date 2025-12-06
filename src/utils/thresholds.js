// src/utils/thresholds.js
// 統一管理「安全庫存 / 有效期限預警」的計算邏輯
// 會被以下模組共用：
// - useAlarmCenter（通知中心）
// - BossInventory / EmpInventory（庫存列表狀態）
// - 之後任何需要用到安全量 / 到期預警的地方

import seed from '@/seed/seedData'

/**
 * 把傳進來的 snapshot（或 getter）整理成安全可用的物件
 * @param {object|function} snapshotOrGetter
 * @returns {object}
 */
function resolveSnapshot (snapshotOrGetter) {
  let snap = snapshotOrGetter

  // 允許傳 function（例如 ds.read）
  if (typeof snapshotOrGetter === 'function') {
    try {
      snap = snapshotOrGetter() || {}
    } catch {
      snap = {}
    }
  }

  snap = snap || {}

  // 若沒有資料（例如尚未載入 Firebase），用 seed 當 fallback
  if (!Array.isArray(snap.products) || snap.products.length === 0) {
    try {
      const s = seed()
      if (!Array.isArray(snap.products)) snap.products = s.products || []
      if (!Array.isArray(snap.thresholds)) snap.thresholds = s.thresholds || []
      if (!Array.isArray(snap.thresholdRules)) snap.thresholdRules = s.thresholdRules || []
      if (!snap.settings) snap.settings = s.settings || {}
    } catch {
      snap.products ||= []
      snap.thresholds ||= []
      snap.thresholdRules ||= []
      snap.settings ||= {}
    }
  } else {
    snap.thresholds ||= []
    snap.thresholdRules ||= []
    snap.settings ||= {}
  }

  return snap
}

/**
 * 找出某個 SKU 的產品安全庫存（safeStock）
 * @param {Array} products
 * @param {string} sku
 * @returns {number|null}
 */
function pickProductSafeStock (products, sku) {
  if (!sku || !Array.isArray(products)) return null
  const p = products.find(it => String(it.id) === String(sku))
  if (!p || p.safeStock == null) return null
  const n = Number(p.safeStock)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * 找出「門市通用安全庫存」 thresholds[].minQty
 * @param {Array} thresholds
 * @param {string} storeId
 * @returns {number|null}
 */
function pickStoreMin (thresholds, storeId) {
  if (!Array.isArray(thresholds)) return null
  const row =
    thresholds.find(t => String(t.storeId) === String(storeId)) ||
    thresholds.find(t => !t.storeId) // 允許有一筆全域設定
  if (!row || row.minQty == null) return null
  const n = Number(row.minQty)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * 找出「單一 SKU 的細部門檻規則」：
 * 1. 優先使用：同門市 + 同 SKU
 * 2. 其次：不分門市 (storeId 為空) + 同 SKU
 *
 * 你在「警示門檻」頁面若有存像：
 * { storeId:'hn-taipei', sku:'CK-001', minQty:30 }
 * 就會由這裡被抓到。
 *
 * @param {Array} rules
 * @param {string} storeId
 * @param {string} sku
 * @returns {number|null}
 */
function pickRuleMin (rules, storeId, sku) {
  if (!sku || !Array.isArray(rules)) return null

  const exact = rules.find(
    r =>
      String(r.sku) === String(sku) &&
      String(r.storeId || '') === String(storeId || '')
  )

  const generic = rules.find(
    r => String(r.sku) === String(sku) && !r.storeId
  )

  const target = exact || generic
  if (!target || target.minQty == null) return null
  const n = Number(target.minQty)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * 計算「真正有效的安全庫存下限」。
 *
 * 優先順序：
 * 1) 門市 + SKU 的細部規則（thresholdRules）
 * 2) 門市共用下限（thresholds[].minQty）
 * 3) 產品安全庫存（products.safeStock）
 * 4) 若以上都沒有 → 回傳一個保底值（預設 5）
 *
 * @param {string} storeId
 * @param {string} sku
 * @param {object|function} snapshotOrGetter - datasource 快照或 getter（例如 ds.read）
 * @returns {number} 有效安全庫存（>=0）
 */
export function getEffectiveMinQty (storeId, sku, snapshotOrGetter) {
  const snap = resolveSnapshot(snapshotOrGetter)
  const products = snap.products || []
  const thresholds = snap.thresholds || []
  const rules = snap.thresholdRules || []

  let resolved = null

  // 1) 單一 SKU 規則
  const ruleMin = pickRuleMin(rules, storeId, sku)
  if (ruleMin != null) resolved = ruleMin

  // 2) 門市共用下限：與現有 resolved 取最大值，避免被蓋小
  const storeMin = pickStoreMin(thresholds, storeId)
  if (storeMin != null) {
    resolved = resolved == null ? storeMin : Math.max(resolved, storeMin)
  }

  // 3) 產品 safeStock
  const prodMin = pickProductSafeStock(products, sku)
  if (prodMin != null) {
    resolved = resolved == null ? prodMin : Math.max(resolved, prodMin)
  }

  // 4) 全部都找不到 → 給一個保底值（避免回傳 NaN）
  if (resolved == null || !Number.isFinite(resolved)) {
    resolved = 5
  }

  return resolved
}

/**
 * 兼容舊版 API：getMinQtyFromAllSources
 * 新版直接轉呼叫 getEffectiveMinQty
 *
 * @param {string} storeId
 * @param {string} sku
 * @param {object|function} snapshotOrGetter
 * @returns {number}
 */
export function getMinQtyFromAllSources (storeId, sku, snapshotOrGetter) {
  return getEffectiveMinQty(storeId, sku, snapshotOrGetter)
}

/**
 * 取得「有效期限預警天數」：
 * 1) 優先 settings.store.defaultExpDays
 * 2) 若沒有 → 預設 3 天
 *
 * @param {object|function} snapshotOrGetter
 * @returns {number}
 */
export function getExpiryWarnDays (snapshotOrGetter) {
  const snap = resolveSnapshot(snapshotOrGetter)
  const d =
    snap.settings?.store?.defaultExpDays != null
      ? Number(snap.settings.store.defaultExpDays)
      : null
  if (Number.isFinite(d) && d > 0) return d
  return 3
}
