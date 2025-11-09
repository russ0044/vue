// src/store/datasource/local.js
// 假資料模式：使用 seedData.js + reactive 當作全系統單一真相來源
import { reactive } from 'vue'
import { seedData } from '@/seed/seedData'

/* ------------------ 初始化資料 ------------------ */
// 建 reactive 副本（避免直接修改 seedData 常數）
const db = reactive(JSON.parse(JSON.stringify(seedData || {})))

// 確保主要欄位存在（先用 seed，缺的再補）
db.runtime     ||= { mode: localStorage.getItem('mode') || 'local', theme: localStorage.getItem('theme') || 'light' }
db.storeGroups ||= {}     // { [storeId]: ['rg-boss','rg-staff'] }
db.stores      ||= []
db.inventory   ||= []
db.thresholds  ||= []
db.settings    ||= { store: { allowNegativeStock:false, defaultStoreId:'', defaultExpDays:3 } }
db.users       ||= []
db.invites     ||= []
db.products    ||= []     // ingredients 對應
db.tags        ||= []     // 額外補齊：供 upsertTag / deleteTag 使用

/** 建立預設 roleGroups（小寫 id），並把 seedData 的 perms 轉成 permissions */
function buildDefaultRoleGroupsFromSeed() {
  if (Array.isArray(db.roleGroups) && db.roleGroups.length) {
    // 轉換 seed 的 perms -> permissions
    db.roleGroups = db.roleGroups.map(rg => ({
      id: String(rg.id || '').toLowerCase(),            // 一律小寫
      name: rg.name || '未命名群組',
      permissions: Array.isArray(rg.permissions) ? rg.permissions.slice()
                  : Array.isArray(rg.perms) ? rg.perms.slice()
                  : [],
    }))
    return
  }
  // 若 seed 沒提供，給一組內建（小寫 id）
  db.roleGroups = [
    {
      id: 'rg-boss',
      name: 'Boss（老闆）',
      permissions: [
        'inventory.view','ingredients.view','roles.manage','stores.manage','thresholds.manage',
        'orders.config','invite.generate','reports.view','orders.view','delivery.view','kitchen.manage',
      ],
    },
    {
      id: 'rg-store-manager',
      name: 'StoreManager（店長）',
      permissions: ['inventory.view','ingredients.view','orders.view','delivery.view','reports.view'],
    },
    {
      id: 'rg-staff',
      name: 'Staff（店員）',
      permissions: ['inventory.view','orders.view'],
    },
    {
      id: 'rg-kitchen',
      name: 'Kitchen（中央廚房）',
      permissions: ['kitchen.manage','reports.view'],
    },
  ]
}

/** 將舊大寫 RG- 前綴 → 新小寫 rg-xxx，並把 perms → permissions */
function normalizeRoleGroupsAndRefs() {
  // 角色群組先處理
  buildDefaultRoleGroupsFromSeed()

  // 建立映射表（含常見舊代碼）
  const mapOldToNew = {
    'RG-BOSS': 'rg-boss',
    'RG-EMP': 'rg-staff',
    'RG-CK': 'rg-kitchen',
    'RG-MANAGER': 'rg-store-manager',
  }

  // 1) roleGroups：確保 id 小寫、欄位為 permissions
  db.roleGroups = db.roleGroups.map(rg => {
    const idRaw = String(rg.id || '')
    const id = (mapOldToNew[idRaw] || idRaw).toLowerCase()
    const permissions = Array.isArray(rg.permissions) ? rg.permissions.slice()
                      : Array.isArray(rg.perms) ? rg.perms.slice()
                      : []
    return { id, name: rg.name || '未命名群組', permissions }
  })

  // 2) storeGroups：把陣列裡的舊 id 轉成新小寫
  Object.keys(db.storeGroups || {}).forEach(storeId => {
    const list = db.storeGroups[storeId] || []
    db.storeGroups[storeId] = list.map(x => (mapOldToNew[x] || x).toLowerCase())
  })

  // 3) users：roleGroupId 轉成新小寫
  db.users = db.users.map(u => {
    const old = String(u.roleGroupId || '')
    return { ...u, roleGroupId: (mapOldToNew[old] || old).toLowerCase() }
  })
}
normalizeRoleGroupsAndRefs()

/* ------------------ 觀察者機制 ------------------ */
const listeners = []

function notifyAll() {
  const snap = read()
  listeners.forEach(fn => {
    try { fn(snap) } catch (err) { console.warn('[local.js] listener error:', err) }
  })
}

/* ------------------ 公開 API ------------------ */

/** 讀取完整資料快照（深拷貝，避免外部直接改 reactive 本體） */
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

/** 取得目前資料來源模式（供 UI 顯示） */
export function getMode() {
  // local 假資料固定回傳 'mock'
  return 'mock'
}

/** 供入口在 setMode('mock') 時呼叫（保留擴充點，目前為 no-op） */
export async function init() {
  // 假資料模式本身已在模組載入時完成 hydrate，這裡直接回傳
  return true
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
  return db.users.some(u => u.email?.toLowerCase() === String(email || '').toLowerCase())
}

export function addUser(user) {
  const newId = `U${String(db.users.length + 1).padStart(3, '0')}`
  db.users.push({
    id: newId,
    name: user.name || '未命名使用者',
    email: user.email,
    phone: user.phone || '',
    roleGroupId: (user.roleGroupId || 'rg-staff').toLowerCase(),
    storeId: user.storeId || db.settings.store.defaultStoreId || '',
  })
  notifyAll()
  return newId
}

export function verifyInvite(code) {
  const inv = (db.invites || []).find(v => v.code === code)
  if (!inv) return { ok:false, reason:'not_found' }
  if (inv.used) return { ok:false, reason:'used' }
  const now = Date.now()
  if (inv.expiresAt && inv.expiresAt < now) return { ok:false, reason:'expired' }
  // 與 seedData 對齊：回傳 roleGroupId
  return { ok:true, roleGroupId: inv.roleGroupId, storeId: inv.storeId, expiresAt: inv.expiresAt }
}

export function markInviteUsed(code) {
  const inv = (db.invites || []).find(v => v.code === code)
  if (inv) {
    inv.used = true
    notifyAll()
  }
}

/* ------------------ 角色 / 群組 ------------------ */
export function upsertRoleGroup(payload) {
  // payload: { id?, name, permissions: string[] }
  const norm = {
    id: payload.id ? String(payload.id).toLowerCase() : null,
    name: payload.name || '未命名群組',
    permissions: Array.isArray(payload.permissions) ? [...payload.permissions] : [],
  }
  if (norm.id) {
    const tgt = db.roleGroups.find(r => r.id === norm.id)
    if (tgt) {
      tgt.name = norm.name
      tgt.permissions = norm.permissions
      notifyAll()
      return tgt.id
    }
  }
  const newId = 'rg-' + Math.random().toString(36).slice(2, 8)
  db.roleGroups.push({ id: newId, name: norm.name, permissions: norm.permissions })
  notifyAll()
  return newId
}

export function renameRole(id, newName) {
  const r = db.roleGroups.find(g => g.id === String(id || '').toLowerCase())
  if (r) {
    r.name = newName
    notifyAll()
  }
}

export function deleteRoleGroup(id) {
  const rid = String(id || '').toLowerCase()
  db.roleGroups = db.roleGroups.filter(g => g.id !== rid)
  Object.keys(db.storeGroups).forEach(storeId => {
    db.storeGroups[storeId] = (db.storeGroups[storeId] || []).filter(x => x !== rid)
  })
  notifyAll()
}

export function setStoreGroups(storeId, roleIds) {
  db.storeGroups[storeId] = (roleIds || []).map(x => String(x).toLowerCase())
  notifyAll()
}

export function duplicateStoreGroups(srcStoreId, destIds) {
  const src = db.storeGroups[srcStoreId] || []
  ;(destIds || []).forEach(did => {
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

/* ------------------ Ingredients（對應 products）/ Tags ------------------ */
// upsertIngredient：以產品 id 為 key，存在則覆蓋，不在則新增
export function upsertIngredient(payload) {
  // payload: { id, name, unit, safeStock, cat, vendorIds }
  if (!payload || !payload.id) return
  const i = db.products.findIndex(p => p.id === payload.id)
  const next = {
    id: payload.id,
    name: payload.name ?? '',
    unit: payload.unit ?? '',
    safeStock: Number.isFinite(+payload.safeStock) ? +payload.safeStock : 0,
    cat: payload.cat ?? '',
    vendorIds: Array.isArray(payload.vendorIds) ? [...payload.vendorIds] : [],
  }
  if (i >= 0) db.products[i] = { ...db.products[i], ...next }
  else db.products.push(next)
  notifyAll()
}

export function deleteIngredient(id) {
  db.products = db.products.filter(p => p.id !== id)
  notifyAll()
}

// tags 結構自訂為：{ id: 'tag-***', name: '調味', color?: '#...' }
export function upsertTag(payload) {
  if (!payload) return
  let id = payload.id || ('tag-' + Math.random().toString(36).slice(2, 8))
  const i = db.tags.findIndex(t => t.id === id)
  const next = { id, name: payload.name || '未命名', color: payload.color || '' }
  if (i >= 0) db.tags[i] = { ...db.tags[i], ...next }
  else db.tags.push(next)
  notifyAll()
  return id
}

export function deleteTag(id) {
  db.tags = db.tags.filter(t => t.id !== id)
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
  console.log('%c[LocalDB] 假資料啟動完成 (normalized)', 'color:#22c55e;font-weight:bold')
  console.log(db)
}

export default {
  read,
  subscribe,
  refresh,
  getMode,
  init,
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
  // ingredients / tags
  upsertIngredient,
  deleteIngredient,
  upsertTag,
  deleteTag,
  // runtime
  setMode,
  setTheme,
}
