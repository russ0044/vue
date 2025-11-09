// src/store/datastore/dataService.js
// 本地資料層（LocalStorage 驅動）
// - 安全補欄位、事件訂閱、不可變寫回
// - 兼容你現有 seedData 結構（settings / invites 的 roleGroupId / storeId）
// - 和「假資料 / Firebase 切換」無衝突（純本地存取，不綁 UI）

const KEY = 'smart-inv-demo'

/* ========== 小工具 ========== */
const normEmail = (e) => String(e || '').trim().toLowerCase()
const int = (v, min = -Infinity) => Math.max(min, Math.trunc(Number(v) || 0))
const nextId = (prefix, n) => `${prefix}${String(n + 1).padStart(3, '0')}`
const now = () => Date.now()
const daysFrom = (n) => now() + n * 24 * 60 * 60 * 1000

/* ========== 事件訂閱（畫面即時更新） ========== */
let listeners = []
export function onChange(cb) {
  if (typeof cb === 'function') listeners.push(cb)
  return () => { listeners = listeners.filter(f => f !== cb) }
}
function notifyAll() {
  const d = readAll()
  listeners.forEach(fn => { try { fn(d) } catch {} })
}

/* ========== 讀寫基礎 ========== */
export function ensureSeed(seed) {
  // 第一次啟動才灌入；若已有資料則不覆蓋
  if (!localStorage.getItem(KEY)) {
    const safe = migrate(seed || {})
    localStorage.setItem(KEY, JSON.stringify(safe))
  }
}

export function readAll() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const obj = JSON.parse(raw)
    return migrate(obj)
  } catch {
    return null
  }
}

export function writeAll(payload) {
  localStorage.setItem(KEY, JSON.stringify(migrate(payload)))
  notifyAll()
}

export function update(mutator) {
  const data = readAll()
  if (!data) throw new Error('資料未初始化：請先呼叫 ensureSeed()')
  const next = mutator(structuredClone(data))
  writeAll(next)
  return next
}

/* ========== 結構補強 / 遷移 ========== */
function migrate(d) {
  const obj = (d && typeof d === 'object') ? d : {}

  obj.users               ||= []
  obj.roleGroups          ||= []
  obj.stores              ||= []
  obj.storeGroups         ||= {}               // { [storeId]: ['rg-xxx'] }
  obj.thresholds          ||= []
  obj.ingredients         ||= []
  obj.inventory           ||= []
  obj.inventoryChanges    ||= []
  obj.invites             ||= []
  obj.kitchenRequests     ||= []               // 兼容中央廚房流程
  obj.kitchenOrders       ||= []
  obj.kitchenRecords      ||= []

  obj.settings            ||= {}
  obj.settings.store      ||= { allowNegativeStock:false, defaultStoreId: obj.stores[0]?.id || '', defaultExpDays: 3 }
  obj.settings.roles      ||= { boss:'老闆', emp:'員工', kitchen:'中央廚房' }
  obj.settings.datasource ||= { mode: localStorage.getItem('ds-mode') || 'mock' } // mock | firebase
  obj.settings.i18n       ||= { locale:'zh-TW', timezone:'Asia/Taipei' }
  obj.runtime             ||= { theme: localStorage.getItem('theme') || 'light' }

  // roleGroups 欄位統一：把 perms -> permissions
  if (Array.isArray(obj.roleGroups)) {
    obj.roleGroups = obj.roleGroups.map(rg => ({
      id: String(rg.id || '').toLowerCase(),
      name: rg.name || '未命名群組',
      permissions: Array.isArray(rg.permissions) ? rg.permissions.slice()
                : Array.isArray(rg.perms) ? rg.perms.slice()
                : []
    }))
  }

  // storeGroups → 群組 id 小寫
  Object.keys(obj.storeGroups).forEach(sid => {
    obj.storeGroups[sid] = (obj.storeGroups[sid] || []).map(x => String(x).toLowerCase())
  })

  // users.roleGroupId 小寫
  obj.users = obj.users.map(u => ({ ...u, roleGroupId: String(u.roleGroupId || '').toLowerCase() }))

  // invites 兼容：若已有 roleGroupId 就保留；舊版只有 role（Boss/Employee/Kitchen）亦可保留並加上 mappedRole（不強轉）
  obj.invites = obj.invites.map(iv => {
    const v = { ...iv }
    if (v.roleGroupId) v.roleGroupId = String(v.roleGroupId).toLowerCase()
    return v
  })

  // thresholds 兼容：允許 { id, storeId, minQty } 或 { storeId, minQty }
  obj.thresholds = obj.thresholds.map(t => ({
    id: t.id || t.storeId,
    storeId: t.storeId || t.id,
    minQty: Number.isFinite(+t.minQty) ? +t.minQty : 0,
    expDays: Number.isFinite(+t.expDays) ? +t.expDays : (obj.settings.store.defaultExpDays || 3)
  }))

  return obj
}

/* ========== 使用者 / 註冊 ========== */
export function emailExists(email) {
  const d = readAll()
  return d?.users?.some(u => normEmail(u.email) === normEmail(email)) || false
}

export function addUser({ email, name, phone, roleGroupId, storeId }) {
  return update(d => {
    if (!email || !name) throw new Error('缺少必要欄位（email/name）')
    if (emailExists(email)) throw new Error('此電子郵件已被註冊，請使用其他信箱註冊')
    const id = nextId('U', d.users.length)
    d.users.push({
      id,
      email: String(email).trim(),
      name: String(name).trim(),
      phone: String(phone || ''),
      roleGroupId: String(roleGroupId || 'rg-staff').toLowerCase(),
      storeId: storeId || d.settings.store.defaultStoreId || '',
      createdAt: now()
    })
    return d
  })
}

/* ========== 店面 ========== */
export function addStore({ name, address, phone, type = 'branch' }) {
  return update(d => {
    if (!name) throw new Error('店面名稱不得為空')
    if (d.stores.some(s => s.name === name)) throw new Error('店面名稱已存在')
    const id = nextId('S', d.stores.length)
    d.stores.push({ id, name: String(name).trim(), address: String(address || ''), phone: String(phone || ''), type })
    d.thresholds.push({ id, storeId: id, minQty: 10, expDays: d.settings.store.defaultExpDays || 3 })
    if (!d.settings.store.defaultStoreId) d.settings.store.defaultStoreId = id
    // 初始化 storeGroups
    d.storeGroups[id] ||= []
    return d
  })
}

export function renameStore(id, newName) {
  return update(d => {
    if (!newName) throw new Error('店面名稱不得為空')
    if (d.stores.some(s => s.name === newName && s.id !== id)) throw new Error('店面名稱已存在')
    const i = d.stores.findIndex(s => s.id === id)
    if (i > -1) d.stores[i].name = String(newName).trim()
    return d
  })
}

export function deleteStore(id) {
  return update(d => {
    d.stores = d.stores.filter(s => s.id !== id)
    d.thresholds = d.thresholds.filter(t => t.storeId !== id)
    d.inventory = d.inventory.filter(i => i.storeId !== id)
    d.inventoryChanges = d.inventoryChanges.filter(c => c.storeId !== id)
    delete d.storeGroups[id]
    if (d.settings.store.defaultStoreId === id) {
      d.settings.store.defaultStoreId = d.stores[0]?.id || ''
    }
    return d
  })
}

export function setDefaultStore(storeId) {
  return update(d => {
    if (!d.stores.some(s => s.id === storeId)) throw new Error('找不到指定店面')
    d.settings.store.defaultStoreId = storeId
    return d
  })
}

/* ========== 警示門檻 ========== */
export function saveThreshold(storeId, { minQty, expDays }) {
  return update(d => {
    if (!storeId) throw new Error('缺少 storeId')
    const rec = { id: storeId, storeId, minQty: int(minQty, 0), expDays: int(expDays, 0) }
    const idx = d.thresholds.findIndex(t => (t.storeId || t.id) === storeId)
    if (idx > -1) d.thresholds[idx] = rec
    else d.thresholds.push(rec)
    return d
  })
}

/* ========== 庫存異動（入庫/出庫/調整） ========== */
export function recordInventoryChange(change) {
  // change: {storeId, sku, name, delta, reason, operatorId, unit?, exp?}
  return update(d => {
    if (!change?.storeId || !change?.sku || !change?.name) throw new Error('缺少必要欄位（storeId/sku/name）')
    const delta = int(change.delta)
    if (!delta) throw new Error('異動數量不得為 0')
    if (!change.reason) throw new Error('請填寫異動原因')

    const allowNegative = !!d.settings?.store?.allowNegativeStock
    const id = `CHG-${String(d.inventoryChanges.length + 1).padStart(4, '0')}`
    d.inventoryChanges.push({ id, ...change, delta, at: now() })

    const idx = d.inventory.findIndex(x => x.storeId === change.storeId && x.sku === change.sku)
    if (idx > -1) {
      const nextQty = (Number(d.inventory[idx].qty) || 0) + delta
      if (!allowNegative && nextQty < 0) throw new Error('庫存不得為負數（已在系統設定中關閉允許負庫存）')
      d.inventory[idx] = {
        ...d.inventory[idx],
        qty: nextQty,
        exp: change.exp || d.inventory[idx].exp
      }
    } else {
      if (delta < 0 && !allowNegative) throw new Error('新建品項不可為負異動')
      d.inventory.push({
        storeId: change.storeId,
        sku: change.sku,
        name: change.name,
        unit: String(change.unit || ''),
        qty: delta,
        exp: change.exp || ''
      })
    }
    return d
  })
}

export function upsertInventory(item) {
  // item: { storeId, sku, name, qty, unit, exp }
  return update(d => {
    const i = d.inventory.findIndex(x => x.storeId === item.storeId && x.sku === item.sku)
    if (i > -1) d.inventory[i] = { ...d.inventory[i], ...item, qty: int(item.qty) }
    else d.inventory.push({ ...item, qty: int(item.qty) })
    return d
  })
}

export function deleteInventory(storeId, sku) {
  return update(d => {
    d.inventory = d.inventory.filter(i => !(i.storeId === storeId && i.sku === sku))
    return d
  })
}

/* ========== 邀請碼 ========== */
/**
 * 統一回傳格式（對齊 seedData）：
 * - { id, code, roleGroupId?, role?, storeId?, presetId?, createdAt, expiresAt, used?, enabled?, usesAllowed?, usesLeft?, note? }
 */
export function listInvites() {
  const d = readAll()
  return (d.invites || [])
    .map(x => ({
      ...x,
      status: x.used ? 'used' : (now() >= (x.expiresAt || 0) ? 'expired' : 'valid')
    }))
    .sort((a,b)=> (b.createdAt || 0) - (a.createdAt || 0))
}

export function createInvite(payload = {}) {
  // 支援兩種：1) 指定 roleGroupId（推薦） 2) 指定高階角色 role（兼容）
  return update(d => {
    const id = nextId('IV', d.invites.length)
    const code = `${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
    const days = Number.isFinite(+payload.days) ? Math.max(1, +payload.days) : 7
    d.invites.push({
      id,
      code,
      roleGroupId: payload.roleGroupId ? String(payload.roleGroupId).toLowerCase() : undefined,
      role: payload.role || undefined,       // 兼容舊欄位
      storeId: payload.storeId || undefined,
      presetId: payload.presetId || undefined,
      note: String(payload.note || ''),
      createdAt: now(),
      expiresAt: daysFrom(days),
      used: false,
      enabled: payload.enabled !== false,
      usesAllowed: Number.isFinite(+payload.usesAllowed) ? +payload.usesAllowed : 1,
      usesLeft: Number.isFinite(+payload.usesAllowed) ? +payload.usesAllowed : 1,
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
    d.invites = d.invites.filter(i => !(i.used || now() >= (i.expiresAt || 0)))
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
  if (rec.enabled === false) return { ok:false, reason:'disabled' }
  if (rec.used) return { ok:false, reason:'used' }
  if (now() >= (rec.expiresAt || 0)) return { ok:false, reason:'expired' }
  if (Number.isFinite(+rec.usesLeft) && +rec.usesLeft <= 0) return { ok:false, reason:'usedup' }

  // 對齊 seedData：優先吐 roleGroupId 與 storeId
  return {
    ok: true,
    id: rec.id,
    code: rec.code,
    roleGroupId: rec.roleGroupId,     // 供註冊時直接套群組
    role: rec.role,                   // 若是舊格式仍保留
    storeId: rec.storeId || null,
    presetId: rec.presetId || null,
    expiresAt: rec.expiresAt,
    note: rec.note || ''
  }
}

export function markInviteUsed(code) {
  return update(d => {
    const idx = d.invites.findIndex(i => i.code === code)
    if (idx > -1) {
      const item = { ...d.invites[idx] }
      // 扣額度
      if (Number.isFinite(+item.usesLeft)) {
        item.usesLeft = Math.max(0, (+item.usesLeft) - 1)
        if (item.usesLeft === 0) item.enabled = false
      } else {
        // 沒有額度欄位則標示 used=true（舊格式）
        item.used = true
      }
      d.invites[idx] = item
    }
    return d
  })
}

/* ========== 匯入 / 匯出（備份） ========== */
export function exportAll() {
  const d = readAll()
  return new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
}

export async function importAll(jsonText) {
  let obj
  try { obj = JSON.parse(jsonText) } catch { throw new Error('JSON 解析失敗') }
  writeAll(obj)
  return true
}
