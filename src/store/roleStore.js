// src/store/roleStore.js
// 全域角色與權限狀態管理（無 pinia）
// - 統一管理登入者角色、權限
// - 登入 / 登出 / 重整後能自動還原
// - 與 datasource 及 localStorage 同步
// - 相容多端（老闆／店長／員工／中央廚房）

import { reactive } from 'vue'
import * as ds from '@/store/datasource'

const state = reactive({
  role: null,   // 'Boss' | 'Employee' | 'Kitchen' | null
  perms: [],    // 權限字串陣列
  ready: false, // 資料是否已完成初始化
})

/** 設定角色（登入成功後呼叫） */
function setRole(r) {
  if (!r) return
  state.role = r
  localStorage.setItem('role', r)
  // 若 datasource 有 runtime，可同步
  try {
    const snap = ds.read?.() || {}
    if (snap.runtime) {
      snap.runtime.lastRole = r
      ds.refresh?.()
    }
  } catch {}
}

/** 設定權限（可選） */
function setPerms(p) {
  state.perms = Array.isArray(p) ? p : []
  localStorage.setItem('perms', JSON.stringify(state.perms))
}

/** 重整後還原角色與權限 */
function hydrateFromLocal() {
  try {
    const r = localStorage.getItem('role')
    const p = localStorage.getItem('perms')
    state.role = r || null
    state.perms = p ? JSON.parse(p) : []
    state.ready = true
  } catch (e) {
    console.warn('[roleStore] hydrate failed:', e)
    state.role = null
    state.perms = []
    state.ready = true
  }
}

/** 登出時清除所有角色資料 */
function clearRole() {
  state.role = null
  state.perms = []
  state.ready = false
  localStorage.removeItem('role')
  localStorage.removeItem('perms')
  try {
    const snap = ds.read?.() || {}
    if (snap.runtime) {
      snap.runtime.lastRole = null
      ds.refresh?.()
    }
  } catch {}
}

/** 工具：是否擁有指定權限 */
function hasPerm(permKey) {
  return Array.isArray(state.perms) && state.perms.includes(permKey)
}

/** 工具：是否為特定角色 */
function isRole(r) {
  return state.role === r
}

/** 初始化（通常在 main.js 啟動時呼叫一次） */
function initRoleStore() {
  hydrateFromLocal()
  if (import.meta.env?.DEV) {
    console.debug('[roleStore] initialized', {
      role: state.role,
      perms: state.perms,
      ready: state.ready,
    })
  }
}

/** 對外導出 */
export function useRoleStore() {
  return {
    state,
    setRole,
    setPerms,
    hydrateFromLocal,
    clearRole,
    hasPerm,
    isRole,
    initRoleStore,
  }
}
