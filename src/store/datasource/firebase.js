// src/store/datasource/firebase.js
// 目前是佔位，之後接 Firestore
// 但名稱 / 結構必須跟 local.js 對齊，畫面才不會壞

let cache = {
  roleGroups: [],
  stores: [],
  storeGroups: {},
  users: [],
  invites: [],
  settings: {
    store: {
      defaultStoreId: '',
      allowNegativeStock: false,
      defaultExpDays: 3,
    },
    i18n: { locale: 'zh-TW', timezone: 'tw-taipei' },
    theme: { mode: 'light' },
  },
}

let listeners = []
function notifyAll() {
  const snap = read()
  listeners.forEach(fn => { try { fn(snap) } catch(e) { console.warn(e) } })
}

function warn(msg = 'Firebase 模式尚未串接，操作以略過處理。') {
  console.warn('[datasource/firebase] ' + msg)
}

export function read() {
  return JSON.parse(JSON.stringify(cache))
}

export function subscribe(cb) {
  if (typeof cb === 'function') {
    listeners.push(cb)
    cb(read())
  }
  return () => {
    const i = listeners.indexOf(cb)
    if (i >= 0) listeners.splice(i, 1)
  }
}

/* 店面 CRUD */
export function addStore(storeObj) {
  warn('addStore()'); 
  // 模擬 push
  const newId = 'FB-' + Math.random().toString(36).slice(2,8).toUpperCase()
  cache.stores.push({
    id: newId,
    name: storeObj.name || '未命名店面',
    address: storeObj.address || '',
    phone: storeObj.phone || '',
    type: storeObj.type || 'branch',
  })
  if (!cache.settings.store.defaultStoreId) {
    cache.settings.store.defaultStoreId = newId
  }
  notifyAll()
  return newId
}

export function renameStore(id, newName) {
  warn('renameStore()')
  const s = cache.stores.find(x => x.id === id)
  if (s) s.name = newName
  notifyAll()
}

export function deleteStore(id) {
  warn('deleteStore()')
  cache.stores = cache.stores.filter(x => x.id !== id)
  if (cache.settings.store.defaultStoreId === id) {
    cache.settings.store.defaultStoreId = cache.stores[0]?.id || ''
  }
  notifyAll()
}

export function setDefaultStore(id) {
  warn('setDefaultStore()')
  cache.settings.store.defaultStoreId = id
  notifyAll()
}

/* 使用者 / 邀請碼 */
export function emailExists(email) {
  return cache.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
}

export function addUser(userObj) {
  warn('addUser()')
  const newId = 'FB-U-' + Math.random().toString(36).slice(2,8).toUpperCase()
  cache.users.push({
    id: newId,
    name: userObj.name || '未命名使用者',
    email: userObj.email,
    phone: userObj.phone || '',
    roleGroupId: userObj.roleGroupId || 'RG-EMP',
  })
  notifyAll()
  return newId
}

export function verifyInvite(code) {
  warn('verifyInvite()')
  const inv = cache.invites.find(v => v.code === code)
  if (!inv) return { ok:false, reason:'not_found' }
  if (inv.used) return { ok:false, reason:'used' }
  const now = Date.now()
  if (inv.expiresAt && inv.expiresAt < now) {
    return { ok:false, reason:'expired' }
  }
  return { ok:true, role:inv.role, storeId:inv.storeId, expiresAt:inv.expiresAt }
}

export function markInviteUsed(code) {
  warn('markInviteUsed()')
  const inv = cache.invites.find(v => v.code === code)
  if (inv) inv.used = true
  notifyAll()
}

/* 角色 / 門市群組 */
export function upsertRoleGroup(payload) {
  warn('upsertRoleGroup()')
  if (payload.id) {
    const tgt = cache.roleGroups.find(r => r.id === payload.id)
    if (tgt) {
      tgt.name = payload.name
      tgt.permissions = [...(payload.permissions || [])]
      notifyAll()
      return tgt.id
    }
  }
  const newId = 'FB-RG-' + Math.random().toString(36).slice(2,8).toUpperCase()
  cache.roleGroups.push({
    id: newId,
    name: payload.name || '未命名群組',
    permissions: [...(payload.permissions || [])],
  })
  notifyAll()
  return newId
}

export function renameRole(id, newName) {
  warn('renameRole()')
  const r = cache.roleGroups.find(g => g.id === id)
  if (r) r.name = newName
  notifyAll()
}

export function deleteRoleGroup(id) {
  warn('deleteRoleGroup()')
  cache.roleGroups = cache.roleGroups.filter(g => g.id !== id)
  Object.keys(cache.storeGroups).forEach(storeId => {
    cache.storeGroups[storeId] =
      (cache.storeGroups[storeId] || []).filter(rid => rid !== id)
  })
  notifyAll()
}

export function setStoreGroups(storeId, roleIds) {
  warn('setStoreGroups()')
  cache.storeGroups[storeId] = [...roleIds]
  notifyAll()
}

export function duplicateStoreGroups(srcStoreId, destIds) {
  warn('duplicateStoreGroups()')
  const src = cache.storeGroups[srcStoreId] || []
  destIds.forEach(did => {
    cache.storeGroups[did] = [...src]
  })
  notifyAll()
}
