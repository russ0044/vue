// src/store/datasource/mock.js
// 假資料（LocalStorage 驅動）— 與其它頁面保持一致 API
import { reactive } from 'vue'

const CH_KEY = 'ds-broadcast'
const LS_KEY = 'boss-role-groups-ds'

/* ---------- 初始假資料 ---------- */
function initial() {
  const rid = () => crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2, 10)

  // 角色群組（用隨機 id 也沒關係，因為本檔把 storeGroups 一起初始化）
  const roleGroups = [
    {
      id: rid(),
      name: '店長權限',
      permissions: [
        '查看儀表板', '盤點作業', '入庫（進貨/退料）', '出庫（銷售/領料）',
        '庫存調整', '調撥（門市↔中央廚房）', '報廢/毀損處理',
        '建立/編輯商品', '批號/效期管理', '安全庫存與警示',
        '供應商管理', '庫存地點/倉別管理', '價格/成本管理',
        '採購單與到貨驗收', '補貨建議與審核', '門市要貨單審核',
        '查看報表', '匯出報表（CSV/Excel/PDF）',
        '管理使用者', '角色與權限管理', '門市與組織管理', '通知/警示設定', '系統設定',
      ],
    },
    {
      id: rid(),
      name: '庫存權限',
      permissions: [
        '查看儀表板', '盤點作業', '入庫（進貨/退料）', '出庫（銷售/領料）',
        '建立/編輯商品', '批號/效期管理', '安全庫存與警示', '查看報表',
      ],
    },
    {
      id: rid(),
      name: '工讀生權限',
      permissions: [
        '查看儀表板', '盤點作業', '入庫（進貨/退料）', '出庫（銷售/領料）',
      ],
    },
  ]

  // 門市
  const stores = [
    { id: 'S1', name: '某某餐飲-總店' },
    { id: 'S2', name: '某某餐飲-東門店' },
    { id: 'S3', name: '某某餐飲-西門店' },
    { id: 'CK', name: '中央廚房' },
  ]

  // 門市套用群組
  const storeGroups = {
    S1: [roleGroups[0].id], // 總店 → 店長權限
    S2: [roleGroups[2].id], // 東門 → 工讀生
    S3: [],                 // 西門 → 尚未配置
    CK: [roleGroups[1].id], // 中央廚房 → 庫存權限
  }

  // 設定（一定要有，避免頁面讀取时报 undefined）
  const settings = {
    store: { defaultStoreId: 'S1', allowNegativeStock: false, defaultExpDays: 3 },
    i18n: { locale: 'zh-TW', timezone: 'tw-taipei' },
    theme: { mode: localStorage.getItem('theme') || 'light' }, // light | dark
    datasource: { mode: localStorage.getItem('mode') || 'mock' }, // mock | firebase
  }

  // 庫存與門檻（Emp / Boss 頁會用到）
  const today = new Date()
  const plus = (d) => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10)
  const inventory = [
    { storeId: 'S1', sku: 'CK-001', name: '新鮮雞腿',   unit: '份',   qty: 24, exp: plus(2) },
    { storeId: 'S1', sku: 'PK-002', name: '新鮮豬腿',   unit: '公斤', qty: 3,  exp: plus(1) },
    { storeId: 'S1', sku: 'VE-010', name: '高麗菜',     unit: '顆',   qty: 12, exp: plus(5) },
    { storeId: 'S2', sku: 'CK-001', name: '新鮮雞腿',   unit: '份',   qty: 5,  exp: plus(1) },
    { storeId: 'S2', sku: 'VE-010', name: '高麗菜',     unit: '顆',   qty: 0,  exp: plus(2) },
    { storeId: 'S3', sku: 'CK-001', name: '新鮮雞腿',   unit: '份',   qty: -1, exp: plus(2) },
    { storeId: 'CK', sku: 'BF-777', name: '滷牛腱',     unit: '盒',   qty: 30, exp: plus(10) },
  ]
  const thresholds = [
    { storeId: 'S1', minQty: 5 },
    { storeId: 'S2', minQty: 3 },
    { storeId: 'S3', minQty: 1 },
    { storeId: 'CK', minQty: 10 },
  ]

  return { roleGroups, stores, storeGroups, settings, inventory, thresholds }
}

/* ---------- 載入或初始化 + 舊資料遷移 ---------- */
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const obj = JSON.parse(raw)

      // 安全補欄位（避免舊資料結構缺少）
      obj.roleGroups ||= []
      obj.stores ||= []
      obj.storeGroups ||= {}
      obj.settings ||= {}
      obj.settings.store ||= { defaultStoreId: obj.stores[0]?.id || 'S1', allowNegativeStock: false, defaultExpDays: 3 }
      obj.settings.i18n ||= { locale: 'zh-TW', timezone: 'tw-taipei' }
      obj.settings.theme ||= { mode: localStorage.getItem('theme') || 'light' }
      obj.settings.datasource ||= { mode: localStorage.getItem('mode') || 'mock' }
      obj.inventory ||= []
      obj.thresholds ||= []

      // 若完全沒門市，補初始資料
      if (!obj.stores.length) {
        const init = initial()
        localStorage.setItem(LS_KEY, JSON.stringify(init))
        return init
      }
      localStorage.setItem(LS_KEY, JSON.stringify(obj))
      return obj
    }
  } catch {
    // ignore parse error
  }
  const init = initial()
  localStorage.setItem(LS_KEY, JSON.stringify(init))
  return init
}

const state = reactive(load())

function persistAndNotify() {
  localStorage.setItem(LS_KEY, JSON.stringify(state))
  try {
    const ch = new BroadcastChannel(CH_KEY)
    ch.postMessage({ type: 'sync', at: Date.now() })
    ch.close()
  } catch {
    // Safari(私密) 可能沒有 BroadcastChannel
  }
}

/* ---------- 對外 API ---------- */
export function read() {
  return JSON.parse(JSON.stringify(state))
}

export function subscribe(cb) {
  function onStorage(e) {
    if (e.key === LS_KEY && e.newValue) {
      try {
        Object.assign(state, JSON.parse(e.newValue))
        cb?.(read())
      } catch {}
    }
  }
  window.addEventListener('storage', onStorage)

  let ch
  try {
    ch = new BroadcastChannel(CH_KEY)
    ch.onmessage = (msg) => { if (msg?.data?.type === 'sync') cb?.(read()) }
  } catch {}
  cb?.(read())
  return () => {
    window.removeEventListener('storage', onStorage)
    try { ch?.close?.() } catch {}
  }
}

export function newId() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2, 10)
}

/* ===== 角色群組 ===== */
export function upsertRoleGroup({ id, name, permissions }) {
  if (!name || !Array.isArray(permissions)) return
  if (!id) {
    id = newId()
    state.roleGroups.push({ id, name: name.trim(), permissions: [...permissions] })
  } else {
    const i = state.roleGroups.findIndex(x => x.id === id)
    if (i >= 0) state.roleGroups[i] = { id, name: name.trim(), permissions: [...permissions] }
  }
  persistAndNotify()
  return id
}
export function renameRole(id, newName) {
  const rg = state.roleGroups.find(x => x.id === id)
  if (rg && newName) { rg.name = String(newName).trim(); persistAndNotify() }
}
export function deleteRoleGroup(id) {
  Object.keys(state.storeGroups).forEach(k => {
    state.storeGroups[k] = (state.storeGroups[k] || []).filter(x => x !== id)
  })
  state.roleGroups = state.roleGroups.filter(x => x.id !== id)
  persistAndNotify()
}

/* ===== 門市 ↔ 群組套用 ===== */
export function setStoreGroups(storeId, roleIds) {
  state.storeGroups[storeId] = Array.from(new Set(roleIds))
  persistAndNotify()
}
export function duplicateStoreGroups(fromStoreId, toStoreIds = []) {
  const src = state.storeGroups[fromStoreId] || []
  toStoreIds.forEach(id => { state.storeGroups[id] = [...src] })
  persistAndNotify()
}

/* ===== 門市 CRUD（BossStores 用） ===== */
export function addStore(store) {
  const newId = (() => {
    const nums = state.stores
      .map(s => Number(String(s.id).replace(/[^\d]/g, '')) || 0)
      .sort((a, b) => b - a)
    return 'S' + String((nums[0] || 0) + 1).padStart(2, '0')
  })()
  state.stores.push({ id: newId, name: store?.name || `新門市 ${newId}` })
  if (!state.settings?.store?.defaultStoreId) state.settings.store.defaultStoreId = newId
  persistAndNotify()
  return newId
}
export function renameStore(id, name) {
  const s = state.stores.find(x => x.id === id)
  if (s && name) { s.name = String(name).trim(); persistAndNotify() }
}
export function deleteStore(id) {
  state.stores = state.stores.filter(s => s.id !== id)
  delete state.storeGroups[id]
  if (state.settings?.store?.defaultStoreId === id) {
    state.settings.store.defaultStoreId = state.stores[0]?.id || ''
  }
  // 清除相關資料
  state.inventory = state.inventory.filter(i => i.storeId !== id)
  state.thresholds = state.thresholds.filter(t => (t.storeId || t.id) !== id)
  persistAndNotify()
}
export function setDefaultStore(id) {
  state.settings ||= {}
  state.settings.store ||= {}
  state.settings.store.defaultStoreId = id || state.stores[0]?.id || ''
  persistAndNotify()
}

/* ===== 庫存 / 門檻（Emp / Boss 報表等會用） ===== */
export function upsertInventory(item) {
  // item: { storeId, sku, name, qty, unit, exp }
  if (!item?.storeId || !item?.sku) return
  const idx = state.inventory.findIndex(i => i.storeId === item.storeId && i.sku === item.sku)
  if (idx >= 0) state.inventory[idx] = { ...state.inventory[idx], ...item }
  else state.inventory.push({ ...item })
  persistAndNotify()
}
export function deleteInventory(storeId, sku) {
  state.inventory = state.inventory.filter(i => !(i.storeId === storeId && i.sku === sku))
  persistAndNotify()
}
export function setThreshold(storeId, minQty) {
  const t = state.thresholds.find(x => x.storeId === storeId)
  if (t) t.minQty = minQty
  else state.thresholds.push({ storeId, minQty })
  persistAndNotify()
}

/* ===== 模式 / 主題（與系統設定接軌） ===== */
export function setMode(mode) {
  state.settings ||= {}
  state.settings.datasource ||= {}
  state.settings.datasource.mode = mode
  localStorage.setItem('mode', mode)
  persistAndNotify()
}
export function setTheme(theme) {
  state.settings ||= {}
  state.settings.theme ||= {}
  state.settings.theme.mode = theme
  localStorage.setItem('theme', theme)
  persistAndNotify()
}

/* Debug */
if (import.meta.env?.DEV) {
  console.log('%c[MockDB] 啟動完成', 'color:#22c55e;font-weight:bold')
  console.log(read())
}

export default {
  read,
  subscribe,
  newId,
  // 角色群組
  upsertRoleGroup,
  renameRole,
  deleteRoleGroup,
  // 門市群組
  setStoreGroups,
  duplicateStoreGroups,
  // 門市 CRUD
  addStore,
  renameStore,
  deleteStore,
  setDefaultStore,
  // 庫存 / 門檻
  upsertInventory,
  deleteInventory,
  setThreshold,
  // 模式 / 主題
  setMode,
  setTheme,
}
