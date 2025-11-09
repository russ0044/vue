// src/store/auth.js
// 系統登入狀態管理（Boss / Employee / Kitchen 共用）
// - 純 JS，可在 TS 檢查下正常通過（無動態 key 語法）
// - 內建角色推斷：依 user.roleGroupId 映射成角色
// - 事件通知：可監聽登入/登出/更新

import { reactive } from 'vue'

/* -------------------------------------------------
 * 角色映射（依 roleGroupId 推斷高階角色）
 * ------------------------------------------------- */
const RG_MAP = {
  // 新版小寫
  'rg-boss': 'Boss',
  'rg-store-manager': 'Employee', // 店長屬 Employee 端（權限較高）
  'rg-staff': 'Employee',
  'rg-kitchen': 'Kitchen',
  // 舊別名兼容
  'rg-emp': 'Employee',
  'rg-ck': 'Kitchen',
  'rg-manager': 'Employee',
  // 舊資料可能的大寫代碼
  'RG-BOSS': 'Boss',
  'RG-EMP': 'Employee',
  'RG-CK': 'Kitchen',
  'RG-MANAGER': 'Employee',
}

function inferRoleFromUser(user, fallback = null) {
  if (!user || typeof user !== 'object') return fallback
  // 1) 若外部已給 user.role（Boss/Employee/Kitchen），直接使用
  if (typeof user.role === 'string' && user.role.trim()) return user.role.trim()
  // 2) 依 roleGroupId 推斷
  const rg = String(user.roleGroupId || '').trim()
  if (rg && RG_MAP[rg] != null) return RG_MAP[rg]
  // 3) fallback
  return fallback
}

/* -------------------------------------------------
 * 預設狀態
 * ------------------------------------------------- */
const DEFAULT = {
  authed: false,     // 是否已登入
  user: null,        // 使用者物件 { id, name, email, storeId, roleGroupId ... }
  role: null,        // 高階角色：Boss | Employee | Kitchen
  token: null,       // 若接 Firebase / JWT 可放這裡
  loginAt: null,     // 登入時間戳（ms）
}

/* -------------------------------------------------
 * 事件通知（可讓其他組件監聽登入狀態改變）
 * ------------------------------------------------- */
let listeners = []
export function onAuthChange(cb) {
  if (typeof cb === 'function') listeners.push(cb)
  return () => { listeners = listeners.filter(fn => fn !== cb) }
}
function notifyAll() {
  listeners.forEach(fn => { try { fn(state) } catch {} })
}

/* -------------------------------------------------
 * 初始化讀取（含防壞資料保護）
 * ------------------------------------------------- */
function readAuth() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return { ...DEFAULT }
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') throw new Error('Invalid format')

    // 兼容：若沒有 role，嘗試從 user.roleGroupId 推斷
    const role = inferRoleFromUser(obj.user, obj.role ?? null)
    return { ...DEFAULT, ...obj, role }
  } catch (err) {
    console.warn('[auth] localStorage 損毀或格式錯誤，已重置。', err)
    localStorage.removeItem('auth')
    return { ...DEFAULT }
  }
}

const state = reactive(readAuth())

/* -------------------------------------------------
 * 寫回 localStorage
 * ------------------------------------------------- */
function persist(clear = false) {
  if (clear) localStorage.removeItem('auth')
  else localStorage.setItem('auth', JSON.stringify(state))
  notifyAll()
}

/* -------------------------------------------------
 * 核心 API
 * ------------------------------------------------- */
export function useAuth() {
  /**
   * 登入
   * @param {Object} payload - { user, role?, token? }
   *  - 若未提供 role，會自動由 user.role 或 user.roleGroupId 推斷
   */
  function login(payload) {
    if (!payload || (typeof payload !== 'object')) {
      console.warn('[auth] login: 無效的 payload。')
      return
    }
    const nextUser = payload.user ?? state.user
    if (!nextUser) {
      console.warn('[auth] login: 缺少 user。')
      return
    }

    // 優先用外部提供的 role，否則推斷
    const nextRole = (typeof payload.role === 'string' && payload.role.trim())
      ? payload.role.trim()
      : inferRoleFromUser(nextUser, state.role)

    const merged = {
      ...state,
      authed: true,
      user: nextUser,
      role: nextRole,
      token: payload.token ?? state.token,
      loginAt: Date.now(),
    }
    Object.assign(state, merged)
    persist()
  }

  /**
   * 登出（清乾淨）
   */
  function logout() {
    Object.assign(state, { ...DEFAULT })
    persist(true)
  }

  /**
   * 外部手動清除（例如 Token 過期）
   */
  function clearSession() {
    Object.assign(state, { ...DEFAULT })
    persist(true)
  }

  /**
   * 覆寫使用者資料（例如更新名稱／門市／群組）
   * - 若 roleGroupId 變更，會自動重算 role
   */
  function updateUser(userPatch) {
    const nextUser = { ...(state.user || {}), ...(userPatch || {}) }
    const maybeNewRole = inferRoleFromUser(nextUser, state.role)
    state.user = nextUser
    state.role = maybeNewRole
    persist()
  }

  /**
   * 直接設定角色（少用；通常建議透過 updateUser 的 roleGroupId 來驅動）
   */
  function setRole(role) {
    if (typeof role === 'string' && role.trim()) {
      state.role = role.trim()
      persist()
    }
  }

  /**
   * 設定 Token（若你要對接 Firebase / 後端）
   */
  function setToken(token) {
    state.token = token || null
    persist()
  }

  return {
    state,
    login,
    logout,
    clearSession,
    updateUser,
    setRole,
    setToken,
  }
}

/* -------------------------------------------------
 * 其他模組需要直接讀狀態時可使用
 * ------------------------------------------------- */
export function getAuthState() {
  return state
}
