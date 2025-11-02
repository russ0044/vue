// ---- 共用工具 ----
const delay = (ms = 80) => new Promise(r => setTimeout(r, ms))
export const todayStr = () => new Date().toISOString().slice(0, 10)
export const genCodeService = () =>
  Math.random().toString(36).slice(2, 6).toUpperCase() + '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase()
const rid = () => (globalThis.crypto?.randomUUID?.() || ('id-' + Math.random().toString(36).slice(2, 10)))

const KEYS = {
  stores:  'boss-stores',
  presets: 'boss-permission-presets',
  invites: 'boss-invite-codes',
}

/* 小工具：安全 parse JSON */
function safeParse(json, fallback) {
  try { return JSON.parse(json) } catch { return fallback }
}

/* 初始化：若無資料則放入預設種子 */
function ensureSeeds() {
  // 門市
  if (!localStorage.getItem(KEYS.stores)) {
    const seedStores = [
      { id: rid(), name: '海南雞 台北店',       storeId: 'hn-taipei',       type: 'branch'  },
      { id: rid(), name: '海南雞 台中店',       storeId: 'hn-taichung',     type: 'branch'  },
      { id: rid(), name: '海南雞 高雄店',       storeId: 'hn-kaohsiung',    type: 'branch'  },
      { id: rid(), name: '海南雞 中央廚房',     storeId: 'central-kitchen', type: 'central' },
    ]
    localStorage.setItem(KEYS.stores, JSON.stringify(seedStores))
  }

  // 權限樣板
  if (!localStorage.getItem(KEYS.presets)) {
    const base = (list) => permKeys().reduce((o, k) => (o[k] = list.includes(k), o), {})
    const def = [
      { id: rid(), name: '店長權限',   defaultRole: 'manager',  permissions: base(permKeys()) },
      { id: rid(), name: '庫存權限',   defaultRole: 'employee', permissions: base(['inventory.view','inventory.edit','orders.create','reports.view']) },
      { id: rid(), name: '工讀生權限', defaultRole: 'employee', permissions: base(['inventory.view','orders.create']) },
      { id: rid(), name: '中央廚房權限', defaultRole: 'kitchen', permissions: base(['inventory.view','inventory.edit','orders.approve','alerts.manage']) },
    ]
    localStorage.setItem(KEYS.presets, JSON.stringify(def))
  }

  // 邀請碼
  if (!localStorage.getItem(KEYS.invites)) {
    localStorage.setItem(KEYS.invites, JSON.stringify([]))
  }
}

// 先確保種子
ensureSeeds()

// ---- Stores ----
export async function listStores() {
  await delay()
  const raw = localStorage.getItem(KEYS.stores)
  const list = safeParse(raw, [])
  // 依照 type（central 優先）與名稱排序，觀感較好
  return [...list].sort((a, b) => {
    if ((a.type || '') === (b.type || '')) return String(a.name || '').localeCompare(String(b.name || ''))
    return (a.type === 'central') ? -1 : 1
  })
}

// ---- Permission Presets ----
export async function listPresets() {
  await delay()
  const raw = localStorage.getItem(KEYS.presets)
  const list = safeParse(raw, null)
  if (Array.isArray(list)) return list
  // 若壞掉就重建
  localStorage.removeItem(KEYS.presets)
  ensureSeeds()
  return safeParse(localStorage.getItem(KEYS.presets), [])
}

export async function createPresetService(data) {
  await delay()
  const list = await listPresets()
  const p = {
    id: rid(),
    name: data?.name || '未命名樣板',
    defaultRole: data?.defaultRole || 'employee',
    permissions: typeof data?.permissions === 'object' ? { ...data.permissions } : permKeys().reduce((o, k) => (o[k] = false, o), {})
  }
  localStorage.setItem(KEYS.presets, JSON.stringify([p, ...list]))
  return p
}

export async function updatePresetService(id, patch) {
  await delay()
  const list = await listPresets()
  const i = list.findIndex(x => x.id === id)
  if (i >= 0) {
    list[i] = {
      ...list[i],
      ...patch,
      permissions: patch?.permissions
        ? { ...list[i].permissions, ...patch.permissions }
        : list[i].permissions
    }
    localStorage.setItem(KEYS.presets, JSON.stringify(list))
    return list[i]
  }
  throw new Error('preset not found')
}

export async function deletePresetService(id) {
  await delay()
  const list = await listPresets()
  localStorage.setItem(KEYS.presets, JSON.stringify(list.filter(x => x.id !== id)))
  return true
}

// ---- Invites ----
export async function listInvites() {
  await delay()
  const raw = localStorage.getItem(KEYS.invites)
  const list = safeParse(raw, [])
  // 依建立時間新到舊
  return [...list].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

export async function createInvite(data) {
  await delay()
  const list = await listInvites()
  // 產生唯一 code，避免碰撞
  let code = (data?.code?.trim() || genCodeService()).toUpperCase()
  const codes = new Set(list.map(v => v.code))
  while (codes.has(code)) code = genCodeService()

  const item = {
    id: rid(),
    code,
    role: data?.role || 'employee',           // employee | manager | kitchen | ...
    storeId: data?.storeId || '',             // 綁定門市（可選）
    presetId: data?.presetId || '',           // 綁定權限樣板（可選）
    createdAt: todayStr(),
    usesAllowed: Number.isFinite(+data?.usesAllowed) ? +data.usesAllowed : 1,
    usesLeft:    Number.isFinite(+data?.usesAllowed) ? +data.usesAllowed : 1,
    note: (data?.note || '').trim(),
    expiresAt: data?.expiresAt || null,       // yyyy-mm-dd（可選）
    enabled: true,
  }
  localStorage.setItem(KEYS.invites, JSON.stringify([item, ...list]))
  return item
}

export async function updateInvite(id, patch) {
  await delay()
  const list = await listInvites()
  const i = list.findIndex(x => x.id === id)
  if (i < 0) throw new Error('invite not found')

  // 若更新 code，要檢查唯一性
  if (patch?.code && patch.code !== list[i].code) {
    const codes = new Set(list.map(v => v.code))
    if (codes.has(patch.code)) throw new Error('invite code duplicated')
  }

  list[i] = { ...list[i], ...patch }
  // 強制校正 usesLeft 範圍
  if (Number.isFinite(+list[i].usesLeft) && Number.isFinite(+list[i].usesAllowed)) {
    list[i].usesLeft = Math.max(0, Math.min(+list[i].usesLeft, +list[i].usesAllowed))
  }
  localStorage.setItem(KEYS.invites, JSON.stringify(list))
  return list[i]
}

export async function deleteInvite(id) {
  await delay()
  const list = await listInvites()
  localStorage.setItem(KEYS.invites, JSON.stringify(list.filter(x => x.id !== id)))
  return true
}

export async function bulkCreateInvites(base, count) {
  await delay()
  const list = await listInvites()
  const created = []
  const codes = new Set(list.map(v => v.code))
  for (let i = 0; i < count; i++) {
    let code = genCodeService()
    while (codes.has(code)) code = genCodeService()
    codes.add(code)
    created.push({
      id: rid(),
      code,
      role: base?.role || 'employee',
      storeId: base?.storeId || '',
      presetId: base?.presetId || '',
      createdAt: todayStr(),
      usesAllowed: Number.isFinite(+base?.usesAllowed) ? +base.usesAllowed : 1,
      usesLeft:    Number.isFinite(+base?.usesAllowed) ? +base.usesAllowed : 1,
      note: (base?.note || '').trim(),
      expiresAt: base?.expiresAt || null,
      enabled: true,
    })
  }
  localStorage.setItem(KEYS.invites, JSON.stringify([...created, ...list]))
  return created
}

/* 取得單一邀請碼（by code） */
export async function getInviteByCode(code) {
  await delay()
  const list = await listInvites()
  return list.find(v => v.code === code) || null
}

/* 核銷邀請碼（註冊／綁定時使用），自動扣次數、失效處理 */
export async function redeemInvite(code) {
  await delay()
  const list = await listInvites()
  const i = list.findIndex(v => v.code === code)
  if (i < 0) return { ok: false, reason: 'not_found' }

  const inv = { ...list[i] }

  // 驗效期與啟用狀態
  if (inv.enabled === false) return { ok: false, reason: 'disabled' }
  if (inv.expiresAt && todayStr() > String(inv.expiresAt)) return { ok: false, reason: 'expired' }
  if (!Number.isFinite(+inv.usesLeft) || inv.usesLeft <= 0) return { ok: false, reason: 'usedup' }

  inv.usesLeft = Math.max(0, (+inv.usesLeft) - 1)
  if (inv.usesLeft === 0) inv.enabled = false

  list[i] = inv
  localStorage.setItem(KEYS.invites, JSON.stringify(list))
  return { ok: true, invite: inv }
}

// ---- Import / Export ----
export async function exportAll() {
  await delay()
  const invites = await listInvites()
  const presets = await listPresets()
  const stores  = await listStores()
  return new Blob([JSON.stringify({ invites, presets, stores }, null, 2)], { type: 'application/json' })
}

export async function importAll(jsonText) {
  await delay()
  const obj = safeParse(jsonText, null)
  if (!obj || typeof obj !== 'object') throw new Error('invalid json')
  if (obj.presets) localStorage.setItem(KEYS.presets, JSON.stringify(obj.presets))
  if (obj.invites) localStorage.setItem(KEYS.invites, JSON.stringify(obj.invites))
  if (obj.stores)  localStorage.setItem(KEYS.stores,  JSON.stringify(obj.stores))
  return true
}

// ---- 共享 ----
function permKeys() {
  return [
    'inventory.view', 'inventory.edit',
    'orders.create',  'orders.approve',
    'alerts.manage',  'reports.view', 'roles.manage'
  ]
}
