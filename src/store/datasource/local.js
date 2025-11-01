// src/store/datasource/local.js
// 假資料模式：使用 seedData.js + reactive 當作全系統單一真相來源
import { reactive } from 'vue'
import { seedData } from '@/seed/seedData'

// 建 reactive 副本，避免直接動到 seedData 常數本體
const db = reactive(JSON.parse(JSON.stringify(seedData)))

// 安全欄位：避免頁面取用時 undefined
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

// 讓畫面能收到更新
const listeners = []
function notifyAll() {
  const snap = read()
  listeners.forEach(fn => { try { fn(snap) } catch(e) { console.warn(e) } })
}

/* 讀整包資料（提供乾淨拷貝，避免外面直接改 reactive） */
export function read() {
  return JSON.parse(JSON.stringify(db))
}

/* 訂閱（BossRoleGroups 等畫面會用） */
export function subscribe(cb) {
  if (typeof cb === 'function') {
    listeners.push(cb)
    cb(read()) // 立即丟一次
  }
  return () => {
    const i = listeners.indexOf(cb)
    if (i >= 0) listeners.splice(i, 1)
  }
}

/* ----------------- 店面 CRUD ----------------- */
export function addStore(store) {
  const newId = `S${String(db.stores.length + 1).padStart(3, '0')}`
  db.stores.push({
    id: newId,
    name: store.name || `未命名店面${db.stores.length + 1}`,
    address: store.address || '',
    phone: store.phone || '',
    type: store.type || 'branch', // branch | central
  })
  // 確保有預設店面
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
    // 如果刪掉的是預設店面，移到第一個
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

/* ----------------- 使用者 / 邀請碼 ----------------- */
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
  })
  notifyAll()
  return newId
}

// 假邀請碼格式：{ code, role, storeId, used:false, expiresAt: timestamp }
export function verifyInvite(code) {
  const inv = db.invites.find(v => v.code === code)
  if (!inv) {
    return { ok:false, reason:'not_found' }
  }
  if (inv.used) {
    return { ok:false, reason:'used' }
  }
  const now = Date.now()
  if (inv.expiresAt && inv.expiresAt < now) {
    return { ok:false, reason:'expired' }
  }
  return { ok:true, role:inv.role, storeId:inv.storeId, expiresAt:inv.expiresAt }
}

export function markInviteUsed(code) {
  const inv = db.invites.find(v => v.code === code)
  if (inv) {
    inv.used = true
    notifyAll()
  }
}

/* ----------------- 角色 / 門市群組 ----------------- */
export function upsertRoleGroup(payload) {
  // payload: { id?, name, permissions[] }
  if (payload.id) {
    const tgt = db.roleGroups.find(r => r.id === payload.id)
    if (tgt) {
      tgt.name = payload.name
      tgt.permissions = [...(payload.permissions || [])]
      notifyAll()
      return tgt.id
    }
  }
  const newId = 'RG-' + Math.random().toString(36).slice(2,8).toUpperCase()
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
  // 從角色列表刪
  db.roleGroups = db.roleGroups.filter(g => g.id !== id)

  // 從 storeGroups 解除綁定
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
