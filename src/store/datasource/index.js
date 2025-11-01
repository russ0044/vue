// /src/store/datasource/index.js
// 統一資料來源入口：可切換 mock（local）或 firebase
import * as local from './local'
import * as fb from './firebase'

// 模式：'mock' | 'firebase'
let mode = localStorage.getItem('ds-mode') || 'mock'

// 目前提供者
function provider() {
  return mode === 'firebase' ? fb : local
}

// ---- 對外 API：讀取 / 訂閱 / 切換模式 / 綁定 Firebase ----
export function read() {
  return provider().read()
}

let currentUnsub = null
const subscribers = new Set()

export function subscribe(cb) {
  // 注冊到 index 層
  subscribers.add(cb)
  // 代理到底層 provider
  const attach = () => {
    currentUnsub?.()
    currentUnsub = provider().subscribe(snap => {
      for (const fn of subscribers) {
        try { fn(snap) } catch {}
      }
    })
  }
  attach()
  // 立即吐一次
  try { cb(read()) } catch {}
  // 回傳解除訂閱
  return () => { subscribers.delete(cb) }
}

export async function setMode(next) {
  if (next !== 'mock' && next !== 'firebase') throw new Error('mode 必須是 mock 或 firebase')
  mode = next
  localStorage.setItem('ds-mode', next)
  // 切換後重新綁定 provider 訂閱
  currentUnsub?.()
  currentUnsub = provider().subscribe(snap => {
    for (const fn of subscribers) fn(snap)
  })
}

export function setFirebaseBindings({ app, db }) {
  return fb.setBindings({ app, db })
}

// ---- Stores CRUD ----
export const addStore         = (...args) => provider().addStore(...args)
export const renameStore      = (...args) => provider().renameStore(...args)
export const deleteStore      = (...args) => provider().deleteStore(...args)
export const setDefaultStore  = (...args) => provider().setDefaultStore(...args)

// ---- RoleGroups & StoreGroups ----
export const upsertRoleGroup      = (...args) => provider().upsertRoleGroup(...args)
export const deleteRoleGroup      = (...args) => provider().deleteRoleGroup(...args)
export const setStoreGroups       = (...args) => provider().setStoreGroups(...args)
// 支援 (srcId, targetId) 或 (srcId, targetIds[])
export const duplicateStoreGroups = (...args) => provider().duplicateStoreGroups(...args)

// ---- Ingredients / Tags ----
export const upsertIngredient = (...args) => provider().upsertIngredient(...args)
export const deleteIngredient = (...args) => provider().deleteIngredient(...args)
export const upsertTag        = (...args) => provider().upsertTag(...args)
export const deleteTag        = (...args) => provider().deleteTag(...args)
