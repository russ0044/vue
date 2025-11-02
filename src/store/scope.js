// src/store/scope.js
// 統一提供畫面需要的顯示範圍（品牌／門市／使用者），避免員工版出現「使用者：老闆」

import { reactive } from 'vue'
import * as ds from '@/store/datasource'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'

function safeRead() {
  try { return ds.read?.() || {} } catch { return {} }
}
const view = safeRead()

function findStoreName(id) {
  return (view.stores || []).find(s => String(s.id) === String(id))?.name || ''
}

const auth = useAuth()
const roleStore = useRoleStore()

const state = reactive({
  brandName: '海南雞 餐飲',
  role: roleStore?.state?.role || 'Employee',

  // 員工顯示自家門市；老闆預設為系統預設門市（可在頁面切換）
  storeId:
    auth?.state?.user?.storeId ||
    view?.settings?.store?.defaultStoreId ||
    (view.stores?.[0]?.id || ''),

  // 使用者名稱（優先登入者姓名，否則依角色給預設）
  userName: (() => {
    const n = auth?.state?.user?.name?.trim()
    if (n) return n
    if (roleStore?.state?.role === 'Boss') return '老闆'
    if (roleStore?.state?.role === 'Kitchen') return '中央廚房人員'
    return '門市人員'
  })(),

  // 老闆可看全部；員工/廚房只看自己門市
  allowedStores: (() => {
    const all = (view.stores || []).map(s => String(s.id))
    const role = roleStore?.state?.role
    const mine = auth?.state?.user?.storeId
    if (role === 'Boss') return all
    return mine ? [String(mine)] : (all.length ? [all[0]] : [])
  })(),
})

export function useScope() {
  return {
    // 直接給模板用的易用屬性
    brandName: state.brandName,
    storeId: state.storeId,
    get storeName() { return findStoreName(state.storeId) || '（未設定門市）' },
    userName: state.userName,
    role: state.role,
    allowedStores: state.allowedStores,
    // 若頁面要改 storeId，可由外部指派
    state,
  }
}
