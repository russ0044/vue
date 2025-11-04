// src/store/datastore/dataService.js
const KEY = 'smart-inv-demo'

/* ---------- 小工具 ---------- */
const normEmail = (e) => String(e || '').trim().toLowerCase()
const int = (v, min = -Infinity) => Math.max(min, Math.trunc(Number(v) || 0))
const nextId = (prefix, n) => `${prefix}${String(n + 1).padStart(3, '0')}`

/* ---------- 事件訂閱（畫面即時更新用） ---------- */
let listeners = []
export function onChange(cb) {
  if (typeof cb === 'function') listeners.push(cb)
  return () => { listeners = listeners.filter(f => f !== cb) }
}
function notifyAll() {
  const d = readAll()
  listeners.forEach(fn => { try { fn(d) } catch {} })
}

/* ---------- 基礎 I/O ---------- */
export function ensureSeed(seed) {
  if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(seed))
}
export function readAll() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  let d
  try { d = JSON.parse(raw) } catch { return null }

  // 補欄位避免 undefined 造成畫面錯誤
  d.users ??= []
  d.roleGroups ??= []
  d.stores ??= []
  d.thresholds ??= []
  d.ingredients ??= []
  d.inventory ??= []
  d.inventoryChanges ??= []
  d.invites ??= []                     // 🔸邀請碼集合
  d.settings ??= {}
  d.settings.store ??= { defaultStoreId: d.stores[0]?.id || '' }
  d.settings.roles ??= {               // 🔸角色自訂顯示名稱（可給系統設定頁使用）
    boss: '老闆',
    emp: '員工',
    kitchen: '中央廚房'
  }
  return d
}
export function writeAll(payload) {
  localStorage.setItem(KEY, JSON.stringify(payload))
  notifyAll()
}
export function update(mutator) {
  const data = readAll()
  if (!data) throw new Error('資料未初始化：請先呼叫 ensureSeed()')
  const next = mutator(structuredClone(data))
  writeAll(next)
  return next
}

/* ---------- 使用者 / 註冊 ---------- */
export function emailExists(email) {
  const d = readAll()
  return d.users.some(u => normEmail(u.email) === normEmail(email))
}
export function addUser({ email, name, phone, roleGroupId }) {
  return update(d => {
    if (!email || !name) throw new Error('缺少必要欄位（email/name）')
    if (emailExists(email)) throw new Error('此電子郵件已被註冊，請使用其他信箱註冊')
    const id = nextId('U', d.users.length)
    d.users.push({ id, email, name, phone: String(phone || ''), roleGroupId, createdAt: Date.now() })
    return d
  })
}

/* ---------- 店面 ---------- */
export function addStore({ name, address, phone, type = 'branch' }) {
  return update(d => {
    if (!name) throw new Error('店面名稱不得為空')
    if (d.stores.some(s => s.name === name)) throw new Error('店面名稱已存在')
    const id = nextId('S', d.stores.length)
    d.stores.push({ id, name, address: String(address || ''), phone: String(phone || ''), type })
    d.thresholds.push({ storeId: id, minQty: 10, expDays: 3 })
    // 若尚未有預設店，補上
    if (!d.settings?.store?.defaultStoreId) {
      d.settings ??= {}
      d.settings.store ??= {}
      d.settings.store.defaultStoreId = id
    }
    return d
  })
}
export function renameStore(id, newName) {
  return update(d => {
    if (!newName) throw new Error('店面名稱不得為空')
    if (d.stores.some(s => s.name === newName && s.id !== id)) throw new Error('店面名稱已存在')
    const i = d.stores.findIndex(s => s.id === id)
    if (i > -1) d.stores[i].name = newName
    return d
  })
}
export function deleteStore(id) {
  // 依 UC-13：刪店面會連動門檻/庫存/異動
  return update(d => {
    d.stores = d.stores.filter(s => s.id !== id)
    d.thresholds = d.thresholds.filter(t => t.storeId !== id)
    d.inventory = d.inventory.filter(i => i.storeId !== id)
    d.inventoryChanges = d.inventoryChanges.filter(c => c.storeId !== id)
    if (d.settings.store.defaultStoreId === id) {
      d.settings.store.defaultStoreId = d.stores[0]?.id || ''
    }
    return d
  })
}
// ✅ 你註冊後會呼叫這個
export function setDefaultStore(storeId) {
  return update(d => {
    if (!d.stores.some(s => s.id === storeId)) throw new Error('找不到指定店面')
    d.settings.store.defaultStoreId = storeId
    return d
  })
}

/* ---------- 警示門檻 ---------- */
export function saveThreshold(storeId, { minQty, expDays }) {
  return update(d => {
    if (!storeId) throw new Error('缺少 storeId')
    const rec = { storeId, minQty: int(minQty, 0), expDays: int(expDays, 0) }
    const idx = d.thresholds.findIndex(t => t.storeId === storeId)
    if (idx > -1) d.thresholds[idx] = rec
    else d.thresholds.push(rec)
    return d
  })
}

/* ---------- 庫存異動（UC-03） ---------- */
export function recordInventoryChange(change) {
  // change: {storeId, sku, name, delta, reason, operatorId, unit?, exp?}
  return update(d => {
    if (!change?.storeId || !change?.sku || !change?.name) throw new Error('缺少必要欄位（storeId/sku/name）')
    const delta = int(change.delta)
    if (!delta) throw new Error('異動數量不得為 0')
    if (!change.reason) throw new Error('請填寫異動原因')

    const id = `CHG-${String(d.inventoryChanges.length + 1).padStart(4, '0')}`
    d.inventoryChanges.push({ id, ...change, delta, at: Date.now() })

    const idx = d.inventory.findIndex(x => x.storeId === change.storeId && x.sku === change.sku)
    if (idx > -1) {
      const nextQty = (d.inventory[idx].qty || 0) + delta
      if (nextQty < 0) throw new Error('庫存不得為負數')
      d.inventory[idx] = {
        ...d.inventory[idx],
        qty: nextQty,
        exp: change.exp || d.inventory[idx].exp
      }
    } else {
      if (delta < 0) throw new Error('新建品項不可為負異動')
      d.inventory.push({
        storeId: change.storeId,
        sku: change.sku,
        name: change.name,
        unit: String(change.unit || ''),
        qty: delta,
        low: 10,
        exp: change.exp || ''
      })
    }
    return d
  })
}

/* ---------- 邀請碼（BossInvite / 註冊會用） ---------- */
function now() { return Date.now() }
function daysFrom(n) { return now() + n * 24 * 60 * 60 * 1000 }

export function listInvites() {
  const d = readAll()
  return d.invites
    .map(x => ({
      ...x,
      status: x.used ? 'used' : (now() >= x.expiresAt ? 'expired' : 'valid')
    }))
    .sort((a,b)=> b.createdAt - a.createdAt)
}

export function createInvite({ role = 'Employee', days = 7, note = '' }) {
  return update(d => {
    const id = nextId('IV', d.invites.length)
    const code = `${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
    d.invites.push({
      id,
      code,
      role,                   // 'Boss' | 'Employee' | 'Kitchen'
      note: String(note || ''),
      createdAt: now(),
      expiresAt: daysFrom(int(days, 1)),
      used: false
    })
    return d
  })
}

export function revokeInvite(id) {
  return update(d => {
    d.invites = d.invites.filter(i => i.id !== id)
    return d
  })
}

export function purgeExpiredInvites() {
  return update(d => {
    d.invites = d.invites.filter(i => !(i.used || now() >= i.expiresAt))
    return d
  })
}

export function getInviteByCode(code) {
  const d = readAll()
  return d.invites.find(i => i.code === String(code || '').trim())
}

export function verifyInvite(code) {
  const rec = getInviteByCode(code)
  if (!rec) return { ok:false, reason:'not_found' }
  if (rec.used) return { ok:false, reason:'used' }
  if (now() >= rec.expiresAt) return { ok:false, reason:'expired' }
  return { ok:true, role:rec.role, note:rec.note, expiresAt:rec.expiresAt, id:rec.id, code:rec.code }
}

export function markInviteUsed(code) {
  return update(d => {
    const idx = d.invites.findIndex(i => i.code === code)
    if (idx > -1) d.invites[idx].used = true
    return d
  })
}
