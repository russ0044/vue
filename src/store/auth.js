// src/store/auth.js
// 系統登入狀態管理（支援 Boss / Employee / Kitchen 三端共用）
// 改良版：安全、可擴充、帶事件通知。
// -------------------------------------------------------------------

import { reactive } from 'vue'

/* ---------- 預設狀態 ---------- */
const DEFAULT = {
  authed: false, // 是否已登入
  user: null,    // 使用者物件 { id, name, email, storeId ... }
  role: null,    // Boss | Employee | Kitchen
  token: null,   // 若接 Firebase 或 JWT 可存這裡
  loginAt: null, // 登入時間戳（ms）
}

/* ---------- 事件通知機制（選擇性，可讓其他組件監聽登入變化） ---------- */
let listeners = []
export function onAuthChange(cb) {
  if (typeof cb === 'function') listeners.push(cb)
  return () => { listeners = listeners.filter(fn => fn !== cb) }
}
function notifyAll() {
  listeners.forEach(fn => { try { fn(state) } catch {} })
}

/* ---------- 初始讀取（含防壞資料保護） ---------- */
function readAuth() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return { ...DEFAULT }
    const obj = JSON.parse(raw)
    if (typeof obj !== 'object' || obj === null) throw new Error('Invalid format')
    return { ...DEFAULT, ...obj }
  } catch (err) {
    console.warn('[auth] localStorage 損毀或格式錯誤，已重置。', err)
    localStorage.removeItem('auth')
    return { ...DEFAULT }
  }
}

const state = reactive(readAuth())

/* ---------- 寫回 localStorage ---------- */
function persist(clear = false) {
  if (clear) localStorage.removeItem('auth')
  else localStorage.setItem('auth', JSON.stringify(state))
  notifyAll()
}

/* ---------- 主功能 ---------- */
export function useAuth() {
  function login(payload) {
    // payload: { user, role, token? }
    if (!payload?.user && !payload?.role) {
      console.warn('[auth] login: 缺少 user 或 role，已忽略。')
      return
    }
    const merged = {
      ...state,
      ...payload,
      authed: true,
      loginAt: Date.now(),
    }
    Object.assign(state, merged)
    persist()
  }

  function logout() {
    Object.assign(state, { ...DEFAULT })
    persist(true)
  }

  // 外部手動清除（例如 Firebase token 過期）
  function clearSession() {
    Object.assign(state, { ...DEFAULT })
    persist(true)
  }

  // 強制覆寫使用者資料（例如更新名稱／權限後）
  function updateUser(user) {
    state.user = { ...(state.user || {}), ...user }
    persist()
  }

  return {
    state,
    login,
    logout,
    clearSession,
    updateUser,
  }
}

/* ---------- 初始化時可讓其他地方讀取當前狀態 ---------- */
export function getAuthState() {
  return state
}
