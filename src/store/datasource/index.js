// /src/store/datasource/index.js
// 統一資料來源入口：可切換 mock（local）或 firebase
import * as local from './local'
import * as fb from './firebase'

// ---- 模式：'mock' | 'firebase' ----
let mode = localStorage.getItem('ds-mode') || 'mock'

// 目前提供者
function provider() {
  return mode === 'firebase' ? fb : local
}

// 便捷：讀當前模式（UI 會顯示）
export function getMode() {
  return mode
}

// ---- 對外 API：讀取 / 訂閱 ----
export function read() {
  const p = provider()
  return typeof p.read === 'function' ? p.read() : {}
}

let currentUnsub = null
const subscribers = new Set()

export function subscribe(cb) {
  subscribers.add(cb)

  const attach = () => {
    // 移除舊的底層訂閱
    if (typeof currentUnsub === 'function') currentUnsub()
    const p = provider()
    if (typeof p.subscribe === 'function') {
      currentUnsub = p.subscribe((snap) => {
        for (const fn of subscribers) {
          try { fn(snap) } catch {}
        }
      })
    } else {
      // 若底層沒提供 subscribe，定時推播一次（保底，不會拋錯）
      currentUnsub = () => {}
      queueMicrotask(() => {
        const snap = read()
        for (const fn of subscribers) { try { fn(snap) } catch {} }
      })
    }
  }

  attach()
  // 立即吐一次
  try { cb(read()) } catch {}

  // 回傳解除訂閱（從 index 層移除）
  return () => { subscribers.delete(cb) }
}

// ---- 切換模式 ----
export async function setMode(next) {
  if (next !== 'mock' && next !== 'firebase') {
    throw new Error('mode 必須是 mock 或 firebase')
  }
  mode = next
  localStorage.setItem('ds-mode', next)

  // 切到 firebase 時，確保先完成初始化（會以 seed hydrate，畫面不會空）
  if (next === 'firebase' && typeof fb.init === 'function') {
    try { await fb.init() } catch (e) { console.warn('[ds] fb.init() 失敗：', e) }
  }

  // 若切回 mock，且 local 有 init 也嘗試初始化（可忽略）
  if (next === 'mock' && typeof local.init === 'function') {
    try { await local.init() } catch {}
  }

  // 重綁底層 provider 訂閱
  if (typeof currentUnsub === 'function') currentUnsub()
  const p = provider()
  if (typeof p.subscribe === 'function') {
    currentUnsub = p.subscribe((snap) => {
      for (const fn of subscribers) { try { fn(snap) } catch {} }
    })
  } else {
    currentUnsub = () => {}
  }

  // 主動推送一次新的快照，避免畫面等不到事件
  const snap = read()
  for (const fn of subscribers) { try { fn(snap) } catch {} }
}

// ---- Firebase 綁定/設定（相容舊介面） ----
/** 舊介面：若 firebase.js 實作 setBindings 則調用；否則忽略不拋錯。 */
export function setFirebaseBindings(args) {
  if (typeof fb.setBindings === 'function') {
    return fb.setBindings(args)
  }
  // 盡量幫用戶把 config 帶進去
  if (args && typeof fb.setConfig === 'function') {
    try { fb.setConfig(args.config || args) } catch {}
  }
  console.warn('[ds] setFirebaseBindings(): firebase adaptor 未提供 setBindings，已略過。')
  return true
}

/** 新介面：直接設定 Firebase Web Config（不連線，交給 adaptor 保留） */
export function setFirebaseConfig(config) {
  if (typeof fb.setConfig === 'function') {
    return fb.setConfig(config)
  }
  console.warn('[ds] firebase adaptor 未提供 setConfig，已略過。')
  return true
}

/** 若需要手動初始化 Firebase adaptor（通常切模式時會自動 init） */
export async function initFirebase() {
  if (typeof fb.init === 'function') {
    return fb.init()
  }
  return true
}

// ---- forward helper：安全轉發到底層，若不存在則警告不拋錯 ----
const fwd = (name) => (...args) => {
  const p = provider()
  if (typeof p[name] === 'function') return p[name](...args)
  console.warn(`[ds] provider 缺少函式：${name}()，已略過。`)
  return undefined
}

// ---- Stores CRUD ----
export const addStore        = fwd('addStore')
export const renameStore     = fwd('renameStore')
export const deleteStore     = fwd('deleteStore')
export const setDefaultStore = fwd('setDefaultStore')

// ---- RoleGroups & StoreGroups ----
export const upsertRoleGroup      = fwd('upsertRoleGroup')
export const deleteRoleGroup      = fwd('deleteRoleGroup')
export const setStoreGroups       = fwd('setStoreGroups')
// 支援 (srcId, targetId) 或 (srcId, targetIds[])
export const duplicateStoreGroups = fwd('duplicateStoreGroups')

// ---- Ingredients / Tags（若 firebase 尚未實作會 fallback 不拋錯）----
export const upsertIngredient = fwd('upsertIngredient')
export const deleteIngredient = fwd('deleteIngredient')
export const upsertTag        = fwd('upsertTag')
export const deleteTag        = fwd('deleteTag')

// ---- Users / Invites（供登入&邀請碼流程）----
export const emailExists   = fwd('emailExists')
export const addUser       = fwd('addUser')
export const verifyInvite  = fwd('verifyInvite')
export const markInviteUsed= fwd('markInviteUsed')
