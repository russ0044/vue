// src/store/datasource.js
// 單一入口：統一管理資料來源 (假資料 / Firebase)
// 任何頁面都只能 import 從這裡 export 出去的函式

import * as localImpl from './datasource/local'
import * as fbImpl from './datasource/firebase'

/**
 * 目前模式（'mock' | 'firebase'）
 * - 優先讀 localStorage
 * - 讀不到就 'mock'
 */
let mode = (() => {
  try {
    return localStorage.getItem('ds-mode') || 'mock'
  } catch {
    return 'mock'
  }
})()

/**
 * 取得目前實際在用的實作層 (localImpl or fbImpl)
 */
function getImpl() {
  return mode === 'firebase' ? fbImpl : localImpl
}

/**
 * 讓外部知道現在是什麼模式（UI 可能要顯示）
 */
export function getMode() {
  return mode
}

/**
 * 在「系統設置」切換資料來源時呼叫
 * 'mock' -> 使用 seedData.js 的本地反應式資料
 * 'firebase' -> 使用 Firestore 版本（目前是 stub，至少不會壞）
 */
export async function setMode(nextMode) {
  if (nextMode !== 'mock' && nextMode !== 'firebase') {
    console.warn('[datasource] setMode: 非法模式', nextMode)
    return
  }
  mode = nextMode
  try {
    localStorage.setItem('ds-mode', mode)
  } catch (e) {
    console.warn('[datasource] 無法寫入 localStorage ds-mode', e)
  }
  console.info('[datasource] 模式已切換為:', mode)
}

/*------------------------------------------------------------------------------
  下面開始是功能轉接層
  注意：我們所有 export 統一在這裡，頁面就不會噴 "xxx is not exported"
------------------------------------------------------------------------------*/

/**
 * 讀整包資料（stores, inventory, settings...）
 */
export function read() {
  return getImpl().read()
}

/**
 * 訂閱資料變動（目前 localImpl 有 reactive，所以我們用它的 subscribe，如果是 mock 也要有 fallback）
 * - 若實作層沒有 subscribe，就回傳一個空的取消函式
 */
export function subscribe(cb) {
  const impl = getImpl()
  if (typeof impl.subscribe === 'function') {
    return impl.subscribe(cb)
  }
  // fallback: 立即吐快照，但之後不會再推
  cb?.(impl.read())
  return () => {}
}

/**
 * 店面 CRUD
 */
export function addStore(storeObj) {
  const impl = getImpl()
  if (typeof impl.addStore === 'function') {
    return impl.addStore(storeObj)
  }
  console.warn('[datasource] addStore 尚未在此模式實作')
}

export function renameStore(id, newName) {
  const impl = getImpl()
  if (typeof impl.renameStore === 'function') {
    return impl.renameStore(id, newName)
  }
  console.warn('[datasource] renameStore 尚未在此模式實作')
}

export function deleteStore(id) {
  const impl = getImpl()
  if (typeof impl.deleteStore === 'function') {
    return impl.deleteStore(id)
  }
  console.warn('[datasource] deleteStore 尚未在此模式實作')
}

export function setDefaultStore(id) {
  const impl = getImpl()
  if (typeof impl.setDefaultStore === 'function') {
    return impl.setDefaultStore(id)
  }
  console.warn('[datasource] setDefaultStore 尚未在此模式實作')
}

/**
 * 使用者 / 邀請碼 相關
 * - 老闆註冊時會新增 user
 * - 驗證邀請碼 / 標記邀請碼已用
 */
export function addUser(userObj) {
  const impl = getImpl()
  if (typeof impl.addUser === 'function') {
    return impl.addUser(userObj)
  }
  console.warn('[datasource] addUser 尚未在此模式實作')
}

export function emailExists(email) {
  const impl = getImpl()
  if (typeof impl.emailExists === 'function') {
    return impl.emailExists(email)
  }
  console.warn('[datasource] emailExists 尚未在此模式實作；預設回 false')
  return false
}

export function verifyInvite(code) {
  const impl = getImpl()
  if (typeof impl.verifyInvite === 'function') {
    return impl.verifyInvite(code)
  }
  console.warn('[datasource] verifyInvite 尚未在此模式實作；回傳無效碼')
  return { ok: false, reason: 'not_supported' }
}

export function markInviteUsed(code) {
  const impl = getImpl()
  if (typeof impl.markInviteUsed === 'function') {
    return impl.markInviteUsed(code)
  }
  console.warn('[datasource] markInviteUsed 尚未在此模式實作')
}

/**
 * 角色 / 權限群組 / 門市群組
 * 供 BossRoleGroups.vue 使用
 */
export function upsertRoleGroup(payload) {
  const impl = getImpl()
  if (typeof impl.upsertRoleGroup === 'function') {
    return impl.upsertRoleGroup(payload)
  }
  console.warn('[datasource] upsertRoleGroup 尚未在此模式實作')
}

export function renameRole(id, newName) {
  const impl = getImpl()
  if (typeof impl.renameRole === 'function') {
    return impl.renameRole(id, newName)
  }
  console.warn('[datasource] renameRole 尚未在此模式實作')
}

export function deleteRoleGroup(id) {
  const impl = getImpl()
  if (typeof impl.deleteRoleGroup === 'function') {
    return impl.deleteRoleGroup(id)
  }
  console.warn('[datasource] deleteRoleGroup 尚未在此模式實作')
}

export function setStoreGroups(storeId, roleIds) {
  const impl = getImpl()
  if (typeof impl.setStoreGroups === 'function') {
    return impl.setStoreGroups(storeId, roleIds)
  }
  console.warn('[datasource] setStoreGroups 尚未在此模式實作')
}

export function duplicateStoreGroups(srcStoreId, destIds) {
  const impl = getImpl()
  if (typeof impl.duplicateStoreGroups === 'function') {
    return impl.duplicateStoreGroups(srcStoreId, destIds)
  }
  console.warn('[datasource] duplicateStoreGroups 尚未在此模式實作')
}

// 啟動訊息（方便除錯）
console.info('[datasource] 啟動完成（模式：' + mode + '）')
