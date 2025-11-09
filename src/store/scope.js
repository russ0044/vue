// src/store/scope.js
// 統一提供畫面需要的顯示範圍（品牌／門市／使用者）
// - 老闆可看全部門市；員工/中央廚房只看自己門市
// - 連動 datasource / auth / roleStore 的變動，確保即時、正確
// - 提供 setStore(id) 讓頁面可切換門市（含防呆）

import { reactive, watch } from 'vue'
import * as ds from '@/store/datasource'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'

/* -------------------- 單例狀態 -------------------- */
const auth = useAuth()
const roleStore = useRoleStore()

// 由資料來源維持的最新快照（透過 subscribe 即時更新）
const view = reactive({
  stores: [],
  settings: {},
})

// 畫面要用的聚合狀態
const state = reactive({
  brandName: '餐易管',
  role: roleStore?.state?.role || 'Employee', // 'Boss' | 'Employee' | 'Kitchen' | ...
  storeId: '',
  userName: '門市人員',
  allowedStores: [],
})

/* -------------------- 工具函式 -------------------- */
function safeArray(x) { return Array.isArray(x) ? x : [] }
function storeNameById(id) {
  return safeArray(view.stores).find(s => String(s.id) === String(id))?.name || ''
}
function defaultStoreId() {
  return view?.settings?.store?.defaultStoreId || view?.stores?.[0]?.id || ''
}
function brandFromSettings() {
  return (
    view?.settings?.brand?.name ||
    view?.settings?.appName ||
    '餐易管'
  )
}

/** 依據 role / user 產生可見的門市清單 */
function calcAllowedStores() {
  const all = safeArray(view.stores).map(s => String(s.id))
  const role = roleStore?.state?.role
  const mine = auth?.state?.user?.storeId

  if (role === 'Boss') return all
  // Kitchen / Employee：若有綁門市就回傳那一家；否則回退到系統預設或第一家
  if (mine) return [String(mine)]
  const d = defaultStoreId()
  return d ? [String(d)] : (all[0] ? [String(all[0])] : [])
}

/** 重新計算 scope 的核心派生欄位 */
function recomputeScope(reason = '') {
  // 品牌
  state.brandName = brandFromSettings()

  // 角色
  state.role = roleStore?.state?.role || 'Employee'

  // 可見門市
  const allow = calcAllowedStores()
  state.allowedStores = allow

  // 目前門市（盡量維持原選擇；不合法就回退）
  const current = String(state.storeId || '')
  if (!current || !allow.includes(current)) {
    state.storeId = allow[0] || ''
  }

  // 使用者顯示名稱
  const n = auth?.state?.user?.name?.trim()
  if (n) state.userName = n
  else if (state.role === 'Boss') state.userName = '老闆'
  else if (state.role === 'Kitchen') state.userName = '中央廚房人員'
  else state.userName = '門市人員'

  if (import.meta.env?.DEV) {
    console.debug('[scope] recompute', { reason, role: state.role, storeId: state.storeId, allowed: [...state.allowedStores] })
  }
}

/* -------------------- 訂閱資料來源（即時） -------------------- */
try {
  ds.subscribe?.((snap) => {
    try {
      view.stores = safeArray(snap?.stores)
      view.settings = snap?.settings || {}
      // 初次或資料變動都重算
      recomputeScope('ds.subscribe')
    } catch (e) {
      console.warn('[scope] subscribe error:', e)
    }
  })
} catch (e) {
  console.warn('[scope] datasource.subscribe not available, fallback to one-shot read()')
  const snap = ds.read?.() || {}
  view.stores = safeArray(snap?.stores)
  view.settings = snap?.settings || {}
  recomputeScope('ds.read fallback')
}

/* -------------------- 監看 auth / 角色變化 -------------------- */
watch(() => auth?.state?.user, () => recomputeScope('auth.user changed'), { deep: true })
watch(() => roleStore?.state?.role, () => recomputeScope('role changed'))

/* -------------------- 對外 API -------------------- */
function setStore(id) {
  const want = String(id || '')
  if (!want) return
  // 只能切換到 allowedStores 裡面的門市
  if (!state.allowedStores.includes(want)) {
    // 若不合法，回退到 allowed[0]
    state.storeId = state.allowedStores[0] || ''
  } else {
    state.storeId = want
  }
}

export function useScope() {
  return {
    // 直接給模板用的易用屬性（以 getter 方式保證最新）
    get brandName() { return state.brandName },
    get storeId() { return state.storeId },
    get storeName() { return storeNameById(state.storeId) || '（未設定門市）' },
    get userName() { return state.userName },
    get role() { return state.role },
    get allowedStores() { return state.allowedStores },

    // 整包 state（若頁面需要雙向綁定）
    state,

    // 切換門市
    setStore,

    //（可選）手動觸發重算
    recompute: () => recomputeScope('manual'),
  }
}
