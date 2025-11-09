// src/store/datasource.js
// ─────────────────────────────────────────────────────────────────────────────
// 單一入口：統一管理資料來源（mock/local｜firebase）
// 所有頁面、元件一律只 import 這個檔案匯出的 API。
// - 模式記在 localStorage('ds-mode')：'mock' | 'firebase'（預設 'mock'）
// - 各功能以「有實作就呼叫、沒有就安全提示」為原則，避免打爆 UI。
// - 與你現有的元件相容：getMode()/setMode()、read()/subscribe()、setTheme()…
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable no-console */
import * as localImpl from './datasource/local'    // 已實作（含 seed / 角色群組 / 庫存等）
import * as fbImpl    from './datasource/firebase' // 可為 stub；本檔已做防呆

// 目前運行模式：localStorage 優先，否則 'mock'
let mode = (() => {
  try { return localStorage.getItem('ds-mode') || 'mock' } catch { return 'mock' }
})()

function getImpl() {
  // 若設定 firebase 但未提供實作，退回 local
  if (mode === 'firebase') {
    const hasAny = typeof fbImpl?.read === 'function' || typeof fbImpl?.subscribe === 'function'
    if (hasAny) return fbImpl
    console.warn('[datasource] 目前模式為 firebase，但未找到對應實作，改用 mock/local。')
    return localImpl
  }
  return localImpl
}

/** 讓外部知道目前模式（UI 可顯示） */
export function getMode() { return mode }

/** 在「系統設置」切換資料來源時呼叫：'mock'｜'firebase' */
export async function setMode(nextMode) {
  if (nextMode !== 'mock' && nextMode !== 'firebase') {
    console.warn('[datasource] setMode: 非法模式', nextMode)
    return
  }
  mode = nextMode
  try { localStorage.setItem('ds-mode', mode) } catch {}
  console.info('[datasource] 模式已切換為：', mode)
}

// ─────────────────────────────────────────────────────────────────────────────
// 共用呼叫封裝：有實作就呼叫；沒有就警告（不拋例外，避免中斷 UI）
// ─────────────────────────────────────────────────────────────────────────────
function callOrWarn(fnName, ...args) {
  const impl = getImpl()
  const fn = impl?.[fnName]
  if (typeof fn === 'function') return fn(...args)
  console.warn(`[datasource] ${fnName} 尚未在「${mode}」模式實作`)
}

function callOrWarnWithDefault(fnName, defaultValue, ...args) {
  const impl = getImpl()
  const fn = impl?.[fnName]
  if (typeof fn === 'function') return fn(...args)
  console.warn(`[datasource] ${fnName} 尚未在「${mode}」模式實作；使用預設值`, defaultValue)
  return defaultValue
}

// ─────────────────────────────────────────────────────────────────────────────
// 基本：讀取／訂閱
// ─────────────────────────────────────────────────────────────────────────────
/** 讀整包資料（stores, inventory, thresholds, settings, roleGroups, invites...） */
export function read() {
  const impl = getImpl()
  if (typeof impl.read === 'function') return impl.read()
  console.warn('[datasource] 目前實作層沒有 read，回傳空物件')
  return {}
}

/** 訂閱資料變動：若實作層無 subscribe，至少先丟一次快照並回傳空取消函式 */
export function subscribe(cb) {
  const impl = getImpl()
  if (typeof impl.subscribe === 'function') return impl.subscribe(cb)
  // 沒有 subscribe 時，先回吐一次快照，避免畫面空白
  try { cb?.(impl.read?.() || {}) } catch {}
  return () => {}
}

/** 可選：有些頁面會手動要求 refresh */
export function refresh() { return callOrWarn('refresh') }

// ─────────────────────────────────────────────────────────────────────────────
// 店面 CRUD
// ─────────────────────────────────────────────────────────────────────────────
export function addStore(storeObj)     { return callOrWarn('addStore', storeObj) }
export function renameStore(id, name)  { return callOrWarn('renameStore', id, name) }
export function deleteStore(id)        { return callOrWarn('deleteStore', id) }
export function setDefaultStore(id)    { return callOrWarn('setDefaultStore', id) }

// ─────────────────────────────────────────────────────────────────────────────
// 使用者／邀請碼
// ─────────────────────────────────────────────────────────────────────────────
export function addUser(userObj)       { return callOrWarn('addUser', userObj) }
export function emailExists(email)     { return callOrWarnWithDefault('emailExists', false, email) }
export function verifyInvite(code)     { return callOrWarnWithDefault('verifyInvite', { ok:false, reason:'not_supported' }, code) }
export function markInviteUsed(code)   { return callOrWarn('markInviteUsed', code) }

// ─────────────────────────────────────────────────────────────────────────────
// 角色／權限群組／門市群組（BossRoleGroups.vue 會用）
// ─────────────────────────────────────────────────────────────────────────────
export function upsertRoleGroup(payload)           { return callOrWarn('upsertRoleGroup', payload) }
export function renameRole(id, newName)            { return callOrWarn('renameRole', id, newName) }
export function deleteRoleGroup(id)                { return callOrWarn('deleteRoleGroup', id) }
export function setStoreGroups(storeId, roleIds)   { return callOrWarn('setStoreGroups', storeId, roleIds) }
export function duplicateStoreGroups(src, destIds) { return callOrWarn('duplicateStoreGroups', src, destIds) }

// ─────────────────────────────────────────────────────────────────────────────
// 庫存／門檻（Emp / Boss / Kitchen 3 端共用）
// ─────────────────────────────────────────────────────────────────────────────
export function upsertInventory(item)         { return callOrWarn('upsertInventory', item) }
export function deleteInventory(storeId, sku) { return callOrWarn('deleteInventory', storeId, sku) }
export function setThreshold(storeId, min)    { return callOrWarn('setThreshold', storeId, min) }

// ─────────────────────────────────────────────────────────────────────────────
/** （可選）產 ID：有些實作層提供 newId() */
export function newId() {
  const impl = getImpl()
  if (typeof impl.newId === 'function') return impl.newId()
  // fallback：簡單隨機
  return 'id-' + Math.random().toString(36).slice(2, 10)
}

// ─────────────────────────────────────────────────────────────────────────────
// 主題／模式（視覺）代理：若資料源有 setTheme，走資料源；否則直接切 html.dark
// 讓「系統設置」可以單一呼叫這裡，確保 3 端一致。
// ─────────────────────────────────────────────────────────────────────────────
export function setTheme(theme) {
  const impl = getImpl()
  if (typeof impl.setTheme === 'function') return impl.setTheme(theme)

  // 保留原值（'light' | 'dark' | 'auto'）
  try { localStorage.setItem('theme', theme) } catch {}

  // 計算實際要套用的 class（你的樣式與元件皆以 .dark 判斷）
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const final = theme === 'auto' ? (prefersDark ? 'dark' : 'light') : theme
  const root = document.documentElement
  if (final === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

console.info('[datasource] 啟動完成（模式：' + mode + '）')
