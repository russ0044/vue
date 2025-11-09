// src/store/datasource/firebase.js
// 佔位版 Firebase adaptor（未連 Firestore，先以記憶體模擬）
// 目標：API 與 local/mock 對齊，切到 Firebase 模式時畫面仍可正常預覽

/* ---------------------------------------------
 * 內部狀態
 * ---------------------------------------------*/
let firebaseConfig = null
let hydratedFromSeed = false

// 盡量與 seedData 結構一致，避免畫面找不到欄位
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
    roles: { emp: '員工', kitchen: '中央廚房' }, // 與 seed 對齊
    datasource: { mode: 'firebase' },
    i18n: { locale: 'zh-TW', timezone: 'Asia/Taipei' },
    theme: { mode: 'light' },
  },

  // 其他模組常用資料（與 seed 對齊）
  inventory: [],
  thresholds: [],
  vendors: [],
  products: [],
  kitchenRequests: [],
  kitchenOrders: [],
  kitchenRecords: [],
}

/* ---------------------------------------------
 * 工具
 * ---------------------------------------------*/
const clone = (o) => JSON.parse(JSON.stringify(o))
const listeners = []
function notifyAll() {
  const snap = read()
  listeners.forEach((fn) => { try { fn(snap) } catch (e) { console.warn(e) } })
}

function warn(msg = 'Firebase 模式尚未串接後端，目前以記憶體模擬。') {
  console.warn('[datasource/firebase] ' + msg)
}

function toDateOnlyStr(s) {
  if (!s) return null
  // 支援毫秒 timestamp / Date / yyyy-mm-dd
  if (typeof s === 'number') {
    return new Date(s).toISOString().slice(0, 10)
  }
  if (s instanceof Date) return s.toISOString().slice(0, 10)
  const str = String(s)
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  // 其他可解析字串
  const d = new Date(str)
  return isNaN(d) ? null : d.toISOString().slice(0, 10)
}

/* ---------------------------------------------
 * 與 seed 自動對齊：切到 Firebase 模式時也有資料可看
 * ---------------------------------------------*/
async function hydrateFromSeedIfNeeded() {
  if (hydratedFromSeed) return
  try {
    // 動態載入，避免循環依賴
    const mod = await import('@/seed/seedData')
    const seed = (typeof mod.default === 'function' ? mod.default() : (mod.seedData || {})) || {}

    // roleGroups（沿用 seed.roleGroups）
    cache.roleGroups = Array.isArray(seed.roleGroups) ? clone(seed.roleGroups) : []

    // stores
    cache.stores = Array.isArray(seed.stores)
      ? seed.stores.map(s => ({
          id: s.id || s.storeId || String(Math.random()).slice(2),
          name: s.name || '未命名店面',
          storeId: s.id || s.storeId || '',
          isCentral: !!s.isCentral,
          type: s.isCentral ? 'central' : 'branch',
        }))
      : []

    // storeGroups
    cache.storeGroups = seed.storeGroups ? clone(seed.storeGroups) : {}

    // users
    cache.users = Array.isArray(seed.users) ? clone(seed.users) : []

    // invites（seed 的 invites 為 {code, roleGroupId, storeId, used}）
    cache.invites = Array.isArray(seed.invites)
      ? seed.invites.map(v => ({
          code: String(v.code || '').toUpperCase(),
          role: v.role || (v.roleGroupId ? 'employee' : 'employee'),
          storeId: v.storeId || '',
          used: !!v.used,
          // 這裡不處理 usesAllowed/Left，單純 used 布林對齊此 adaptor
          expiresAt: null, // 可後續在 UI 設定
        }))
      : []

    // settings
    if (seed.settings) {
      cache.settings = clone(seed.settings)
      // 以 Firebase 模式覆寫
      cache.settings.datasource = { ...(cache.settings.datasource || {}), mode: 'firebase' }
      // 時區修正
      if (cache.settings.i18n) cache.settings.i18n.timezone = 'Asia/Taipei'
    } else {
      cache.settings.datasource = { mode: 'firebase' }
      cache.settings.i18n = { locale: 'zh-TW', timezone: 'Asia/Taipei' }
    }

    // 其餘資料直接帶入
    cache.inventory       = Array.isArray(seed.inventory) ? clone(seed.inventory) : []
    cache.thresholds      = Array.isArray(seed.thresholds) ? clone(seed.thresholds) : []
    cache.vendors         = Array.isArray(seed.vendors) ? clone(seed.vendors) : []
    cache.products        = Array.isArray(seed.products) ? clone(seed.products) : []
    cache.kitchenRequests = Array.isArray(seed.kitchenRequests) ? clone(seed.kitchenRequests) : []
    cache.kitchenOrders   = Array.isArray(seed.kitchenOrders) ? clone(seed.kitchenOrders) : []
    cache.kitchenRecords  = Array.isArray(seed.kitchenRecords) ? clone(seed.kitchenRecords) : []

    // 如果預設門市未設定，挑第一個
    if (!cache.settings?.store?.defaultStoreId) {
      cache.settings.store = cache.settings.store || {}
      cache.settings.store.defaultStoreId = cache.stores[0]?.id || ''
    }

    hydratedFromSeed = true
    notifyAll()
  } catch (e) {
    // 若 seed 載入失敗，維持空集合；畫面依舊可運行，但資料為空
    console.warn('[datasource/firebase] hydrateFromSeedIfNeeded failed:', e)
  }
}

/* ---------------------------------------------
 * 公開：環境與生命周期
 * ---------------------------------------------*/
export function setConfig(cfg) {
  // 記錄設定（apiKey, projectId, ...），尚未實際連後端
  firebaseConfig = cfg && typeof cfg === 'object' ? clone(cfg) : null
  warn('setConfig(): 已接收 Firebase Web Config（尚未連線，使用記憶體模擬）。')
}

export function getConfig() {
  return clone(firebaseConfig)
}

/** 初始化：若尚未有資料，嘗試從 seed 載入，以便畫面可預覽 */
export async function init() {
  await hydrateFromSeedIfNeeded()
  notifyAll()
  return true
}

/** 清空目前記憶體（測試/重載用） */
export function reset() {
  hydratedFromSeed = false
  cache = {
    roleGroups: [],
    stores: [],
    storeGroups: {},
    users: [],
    invites: [],
    settings: {
      store: { defaultStoreId: '', allowNegativeStock: false, defaultExpDays: 3 },
      roles: { emp: '員工', kitchen: '中央廚房' },
      datasource: { mode: 'firebase' },
      i18n: { locale: 'zh-TW', timezone: 'Asia/Taipei' },
      theme: { mode: 'light' },
    },
    inventory: [],
    thresholds: [],
    vendors: [],
    products: [],
    kitchenRequests: [],
    kitchenOrders: [],
    kitchenRecords: [],
  }
  notifyAll()
}

/* ---------------------------------------------
 * 讀取 / 訂閱
 * ---------------------------------------------*/
export function read() {
  return clone(cache)
}

export function subscribe(cb) {
  if (typeof cb === 'function') {
    listeners.push(cb)
    // 立即回推一次
    cb(read())
  }
  return () => {
    const i = listeners.indexOf(cb)
    if (i >= 0) listeners.splice(i, 1)
  }
}

/* ---------------------------------------------
 * 店面 CRUD
 * ---------------------------------------------*/
export function addStore(storeObj) {
  warn('addStore()')
  const newId = 'FB-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  cache.stores.push({
    id: newId,
    name: storeObj?.name || '未命名店面',
    address: storeObj?.address || '',
    phone: storeObj?.phone || '',
    type: storeObj?.type || (storeObj?.isCentral ? 'central' : 'branch'),
    isCentral: !!storeObj?.isCentral,
  })
  if (!cache.settings.store.defaultStoreId) {
    cache.settings.store.defaultStoreId = newId
  }
  notifyAll()
  return newId
}

export function renameStore(id, newName) {
  warn('renameStore()')
  const s = cache.stores.find((x) => x.id === id)
  if (s) s.name = String(newName || '')
  notifyAll()
}

export function deleteStore(id) {
  warn('deleteStore()')
  cache.stores = cache.stores.filter((x) => x.id !== id)
  if (cache.settings.store.defaultStoreId === id) {
    cache.settings.store.defaultStoreId = cache.stores[0]?.id || ''
  }
  // 同步移除 storeGroups 對應
  if (cache.storeGroups && cache.storeGroups[id]) {
    const sg = { ...cache.storeGroups }
    delete sg[id]
    cache.storeGroups = sg
  }
  notifyAll()
}

export function setDefaultStore(id) {
  warn('setDefaultStore()')
  cache.settings.store.defaultStoreId = id
  notifyAll()
}

/* ---------------------------------------------
 * 使用者 / 邀請碼
 * ---------------------------------------------*/
export function emailExists(email) {
  const e = String(email || '').toLowerCase()
  return cache.users.some((u) => (u.email || '').toLowerCase() === e)
}

export function addUser(userObj) {
  warn('addUser()')
  const newId = 'FB-U-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  cache.users.push({
    id: newId,
    name: userObj?.name || '未命名使用者',
    email: userObj?.email || '',
    phone: userObj?.phone || '',
    roleGroupId: userObj?.roleGroupId || 'rg-staff',
    role: userObj?.role || 'Employee',
    storeId: userObj?.storeId || cache.settings.store.defaultStoreId || '',
  })
  notifyAll()
  return newId
}

/**
 * 支援 expiresAt 字串(yyyy-mm-dd) 或毫秒 timestamp
 * 回傳: { ok:true, role, storeId, expiresAt } 或 { ok:false, reason }
 */
export function verifyInvite(code) {
  warn('verifyInvite()')
  const c = String(code || '').trim().toUpperCase()
  const inv = cache.invites.find((v) => String(v.code || '').toUpperCase() === c)
  if (!inv) return { ok: false, reason: 'not_found' }
  if (inv.used) return { ok: false, reason: 'used' }

  // 驗效期（允許 yyyy-mm-dd / 整數毫秒）
  const expStr = toDateOnlyStr(inv.expiresAt)
  if (expStr) {
    const today = toDateOnlyStr(new Date())
    if (today > expStr) return { ok: false, reason: 'expired' }
  }
  return { ok: true, role: inv.role || 'employee', storeId: inv.storeId || '', expiresAt: expStr }
}

export function markInviteUsed(code) {
  warn('markInviteUsed()')
  const c = String(code || '').trim().toUpperCase()
  const inv = cache.invites.find((v) => String(v.code || '').toUpperCase() === c)
  if (inv) inv.used = true
  notifyAll()
}

/* ---------------------------------------------
 * 角色群組 / 門市群組
 * ---------------------------------------------*/
export function upsertRoleGroup(payload) {
  warn('upsertRoleGroup()')
  if (payload?.id) {
    const tgt = cache.roleGroups.find((r) => r.id === payload.id)
    if (tgt) {
      tgt.name = payload.name || tgt.name
      // permissions：這裡沿用陣列形式（與你現有頁面對齊）
      tgt.permissions = Array.isArray(payload.permissions) ? [...payload.permissions] : (tgt.permissions || [])
      notifyAll()
      return tgt.id
    }
  }
  const newId = 'FB-RG-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  cache.roleGroups.push({
    id: newId,
    name: payload?.name || '未命名群組',
    permissions: Array.isArray(payload?.permissions) ? [...payload.permissions] : [],
  })
  notifyAll()
  return newId
}

export function renameRole(id, newName) {
  warn('renameRole()')
  const r = cache.roleGroups.find((g) => g.id === id)
  if (r) r.name = String(newName || '')
  notifyAll()
}

export function deleteRoleGroup(id) {
  warn('deleteRoleGroup()')
  cache.roleGroups = cache.roleGroups.filter((g) => g.id !== id)
  // 從每個 store 的已套用群組中移除
  Object.keys(cache.storeGroups || {}).forEach((storeId) => {
    cache.storeGroups[storeId] = (cache.storeGroups[storeId] || []).filter((rid) => rid !== id)
  })
  notifyAll()
}

export function setStoreGroups(storeId, roleIds) {
  warn('setStoreGroups()')
  cache.storeGroups[storeId] = Array.isArray(roleIds) ? [...roleIds] : []
  notifyAll()
}

export function duplicateStoreGroups(srcStoreId, destIds) {
  warn('duplicateStoreGroups()')
  const src = cache.storeGroups[srcStoreId] || []
  ;(Array.isArray(destIds) ? destIds : []).forEach((did) => {
    cache.storeGroups[did] = [...src]
  })
  notifyAll()
}

/* ---------------------------------------------
 * 其他：你若日後要補 Firestore，可把上面各函式換成 async 操作
 * 並在成功後更新 cache 再呼叫 notifyAll() 即可。
 * ---------------------------------------------*/
