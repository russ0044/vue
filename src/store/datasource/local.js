// src/store/datasource/local.js
// 假資料模式：使用 seedData.js + reactive 當作全系統單一真相來源
import { reactive } from 'vue'
import { seedData } from '@/seed/seedData'

/* ------------------ 初始化資料 ------------------ */
// 建 reactive 副本（避免直接修改 seedData 常數）
const db = reactive(JSON.parse(JSON.stringify(seedData || {})))

// 確保主要欄位存在
db.runtime      ||= { mode: 'local', theme: localStorage.getItem('theme') || 'light' }
db.roleGroups   ||= [
  { id: 'RG-BOSS', name: '老闆', permissions: ['管理使用者','查看報表','庫存調整'] },
  { id: 'RG-EMP',  name: '店員', permissions: ['入庫（進貨/退料）','出庫（銷售/領料）'] },
  { id: 'RG-CK',   name: '中央廚房', permissions: ['調撥（門市↔中央廚房）','盤點作業'] },
]
db.storeGroups  ||= {}     // { [storeId]: ['RG-BOSS','RG-EMP'] }
db.stores       ||= []
db.inventory    ||= []
db.thresholds   ||= []
db.settings     ||= { store: { allowNegativeStock:false, defaultStoreId:'', defaultExpDays:3 } }
db.users        ||= []
db.invites      ||= []

/* ------------------ 觀察者機制 ------------------ */
const listeners = []

function notifyAll() {
  const snap = read()
  listeners.forEach(fn => {
    try { fn(snap) } catch (err) { console.warn('[local.js] listener error:', err) }
  })
}

/* ------------------ 公開 API ------------------ */

/** 讀取完整資料快照 */
export function read() {
  return JSON.parse(JSON.stringify(db))
}

/** 訂閱資料更新 */
export function subscribe(cb) {
  if (typeof cb === 'function') {
    listeners.push(cb)
    cb(read()) // 初始推送一次
  }
  return () => {
    const i = listeners.indexOf(cb)
    if (i >= 0) listeners.splice(i, 1)
  }
}

/** 手動觸發更新（若外部修改） */
export function refresh() {
  notifyAll()
}

/* ------------------ 店面 CRUD ------------------ */
export function addStore(store) {
  const newId = `S${String(db.stores.length + 1).padStart(3, '0')}`
  db.stores.push({
    id: newId,
    name: store.name || `未命名店面${db.stores.length + 1}`,
    address: store.address || '',
    phone: store.phone || '',
    type: store.type || 'branch', // branch | central
  })
  if (!db.settings.store.defaultStoreId) {
    db.settings.store.defaultStoreId = newId
  }
  notifyAll()
  return newId
}

export function renameStore(id, newName) {
  const s = db.stores.find(x => x.id === id)
  if (s) {
    s.name = newName
    notifyAll()
  }
}

export function deleteStore(id) {
  const idx = db.stores.findIndex(x => x.id === id)
  if (idx !== -1) {
    db.stores.splice(idx, 1)
    if (db.settings.store.defaultStoreId === id) {
      db.settings.store.defaultStoreId = db.stores[0]?.id || ''
    }
    notifyAll()
  }
}

export function setDefaultStore(id) {
  db.settings.store.defaultStoreId = id
  notifyAll()
}

/* ------------------ 使用者 / 邀請 ------------------ */
export function emailExists(email) {
  return db.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
}

export function addUser(user) {
  const newId = `U${String(db.users.length + 1).padStart(3, '0')}`
  db.users.push({
    id: newId,
    name: user.name || '未命名使用者',
    email: user.email,
    phone: user.phone || '',
    roleGroupId: user.roleGroupId || 'RG-EMP',
    storeId: user.storeId || db.settings.store.defaultStoreId || '',
  })
  notifyAll()
  return newId
}

export function verifyInvite(code) {
  const inv = db.invites.find(v => v.code === code)
  if (!inv) return { ok:false, reason:'not_found' }
  if (inv.used) return { ok:false, reason:'used' }
  const now = Date.now()
  if (inv.expiresAt && inv.expiresAt < now) return { ok:false, reason:'expired' }
  return { ok:true, role:inv.role, storeId:inv.storeId, expiresAt:inv.expiresAt }
}

export function markInviteUsed(code) {
  const inv = db.invites.find(v => v.code === code)
  if (inv) {
    inv.used = true
    notifyAll()
  }
}

/* ------------------ 角色 / 群組 ------------------ */
export function upsertRoleGroup(payload) {
  if (payload.id) {
    const tgt = db.roleGroups.find(r => r.id === payload.id)
    if (tgt) {
      tgt.name = payload.name
      tgt.permissions = [...(payload.permissions || [])]
      notifyAll()
      return tgt.id
    }
  }
  const newId = 'RG-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  db.roleGroups.push({
    id: newId,
    name: payload.name || '未命名群組',
    permissions: [...(payload.permissions || [])],
  })
  notifyAll()
  return newId
}

export function renameRole(id, newName) {
  const r = db.roleGroups.find(g => g.id === id)
  if (r) {
    r.name = newName
    notifyAll()
  }
}

export function deleteRoleGroup(id) {
  db.roleGroups = db.roleGroups.filter(g => g.id !== id)
  Object.keys(db.storeGroups).forEach(storeId => {
    db.storeGroups[storeId] = (db.storeGroups[storeId] || []).filter(rid => rid !== id)
  })
  notifyAll()
}

export function setStoreGroups(storeId, roleIds) {
  db.storeGroups[storeId] = [...roleIds]
  notifyAll()
}

export function duplicateStoreGroups(srcStoreId, destIds) {
  const src = db.storeGroups[srcStoreId] || []
  destIds.forEach(did => {
    db.storeGroups[did] = [...src]
  })
  notifyAll()
}

/* ------------------ 庫存 / 門檻 ------------------ */
export function upsertInventory(item) {
  // item: { storeId, sku, name, qty, unit, exp }
  const idx = db.inventory.findIndex(i => i.storeId === item.storeId && i.sku === item.sku)
  if (idx >= 0) db.inventory[idx] = { ...db.inventory[idx], ...item }
  else db.inventory.push({ ...item })
  notifyAll()
}

export function deleteInventory(storeId, sku) {
  db.inventory = db.inventory.filter(i => !(i.storeId === storeId && i.sku === sku))
  notifyAll()
}

export function setThreshold(storeId, minQty) {
  const t = db.thresholds.find(x => x.storeId === storeId)
  if (t) t.minQty = minQty
  else db.thresholds.push({ storeId, minQty })
  notifyAll()
}

/* ------------------ 模式 / 主題切換 ------------------ */
export function setMode(mode) {
  db.runtime.mode = mode
  localStorage.setItem('mode', mode)
  notifyAll()
}

export function setTheme(theme) {
  db.runtime.theme = theme
  localStorage.setItem('theme', theme)
  notifyAll()
}

/* ------------------ Debug：開發環境用 ------------------ */
if (import.meta.env?.DEV) {
  console.log('%c[LocalDB] 假資料啟動完成', 'color:#22c55e;font-weight:bold')
  console.log(db)
}

export default {
  read,
  subscribe,
  refresh,
  addStore,
  renameStore,
  deleteStore,
  setDefaultStore,
  emailExists,
  addUser,
  verifyInvite,
  markInviteUsed,
  upsertRoleGroup,
  renameRole,
  deleteRoleGroup,
  setStoreGroups,
  duplicateStoreGroups,
  upsertInventory,
  deleteInventory,
  setThreshold,
  setMode,
  setTheme,
}
