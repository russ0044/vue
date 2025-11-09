// ---- 共用工具 ----
const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms))
export const todayStr = () => new Date().toISOString().slice(0, 10)

/** 更穩健的隨機碼（大寫） */
export const genCodeService = () =>
  (Math.random().toString(36).slice(2, 6) + '-' + Math.random().toString(36).slice(2, 6))
    .toUpperCase()

/** 更穩健的 id 產生器（優先 crypto.randomUUID，其次亂數字串） */
const rid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  // 退而求其次：用 getRandomValues 拼接
  try {
    const arr = new Uint32Array(2)
    globalThis.crypto?.getRandomValues?.(arr)
    return `id-${arr[0].toString(36)}${arr[1].toString(36)}`
  } catch {
    return 'id-' + Math.random().toString(36).slice(2, 10)
  }
}

const KEYS = {
  stores:  'boss-stores',
  presets: 'boss-permission-presets',
  invites: 'boss-invite-codes',
}

/* 小工具：安全 parse JSON */
function safeParse(json, fallback) {
  if (!json || typeof json !== 'string') return fallback
  try { return JSON.parse(json) } catch { return fallback }
}

/* 權限鍵清單（擴充與全系統對齊） */
function permKeys() {
  return [
    // 庫存
    'inventory.view', 'inventory.edit',
    // 訂單 / 流程
    'orders.view', 'orders.create', 'orders.approve', 'orders.config',
    // 主檔與管理
    'ingredients.view', 'stores.manage', 'thresholds.manage', 'roles.manage', 'invite.generate',
    // 配送 / 警示
    'delivery.view', 'alerts.manage',
    // 報表
    'reports.view',
    // 中央廚房
    'kitchen.manage',
  ]
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
      { id: rid(), name: '店長權限',     defaultRole: 'manager',  permissions: base(permKeys()) },
      { id: rid(), name: '庫存權限',     defaultRole: 'employee', permissions: base(['inventory.view','inventory.edit','orders.create','reports.view']) },
      { id: rid(), name: '工讀生權限',   defaultRole: 'employee', permissions: base(['inventory.view','orders.create']) },
      { id: rid(), name: '中央廚房權限', defaultRole: 'kitchen',  permissions: base(['inventory.view','inventory.edit','orders.approve','alerts.manage','kitchen.manage','orders.view','orders.create']) },
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
  if (!Array.isArray(list)) return []
  // 依照 type（central 優先）與名稱排序
  return [...list].sort((a, b) => {
    const ta = a?.type || ''
    const tb = b?.type || ''
    if (ta === tb) return String(a?.name || '').localeCompare(String(b?.name || ''))
    return ta === 'central' ? -1 : 1
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
  const allKeys = permKeys()
  const blankPerms = allKeys.reduce((o, k) => (o[k] = false, o), {})
  const incoming = (data?.permissions && typeof data.permissions === 'object') ? data.permissions : {}
  // 僅吸收白名單鍵，避免髒鍵
  const merged = { ...blankPerms }
  for (const k of allKeys) {
    if (k in incoming) merged[k] = !!incoming[k]
  }

  const p = {
    id: rid(),
    name: (data?.name || '未命名樣板').toString(),
    defaultRole: (data?.defaultRole || 'employee').toString(),
    permissions: merged,
  }
  localStorage.setItem(KEYS.presets, JSON.stringify([p, ...list]))
  return p
}

export async function updatePresetService(id, patch) {
  await delay()
  const list = await listPresets()
  const i = list.findIndex((x) => x.id === id)
  if (i >= 0) {
    const item = { ...list[i] }
    if (patch?.name != null) item.name = String(patch.name)
    if (patch?.defaultRole != null) item.defaultRole = String(patch.defaultRole)

    if (patch?.permissions && typeof patch.permissions === 'object') {
      const allKeys = permKeys()
      const next = { ...item.permissions }
      for (const k of allKeys) {
        if (k in patch.permissions) next[k] = !!patch.permissions[k]
      }
      item.permissions = next
    }

    list[i] = item
    localStorage.setItem(KEYS.presets, JSON.stringify(list))
    return item
  }
  throw new Error('preset not found')
}

export async function deletePresetService(id) {
  await delay()
  const list = await listPresets()
  localStorage.setItem(KEYS.presets, JSON.stringify(list.filter((x) => x.id !== id)))
  return true
}

// ---- Invites ----
export async function listInvites() {
  await delay()
  const raw = localStorage.getItem(KEYS.invites)
  const list = safeParse(raw, [])
  if (!Array.isArray(list)) return []
  // 依建立時間新到舊
  return [...list].sort((a, b) =>
    String(b?.createdAt || '').localeCompare(String(a?.createdAt || ''))
  )
}

export async function createInvite(data) {
  await delay()
  const list = await listInvites()

  // 產生唯一 code（Case-insensitive & Trim）
  let code = (data?.code?.toString().trim() || genCodeService()).toUpperCase()
  const codes = new Set(list.map((v) => String(v.code || '').toUpperCase()))
  while (codes.has(code)) code = genCodeService()

  const uses = Number.isFinite(+data?.usesAllowed) ? +data.usesAllowed : 1

  const item = {
    id: rid(),
    code,
    role: (data?.role || 'employee').toString(), // employee | manager | kitchen | ...
    storeId: (data?.storeId || '').toString(),   // 綁定門市（可選）
    presetId: (data?.presetId || '').toString(), // 綁定權限樣板（可選）
    createdAt: todayStr(),
    usesAllowed: uses,
    usesLeft: uses,
    note: (data?.note || '').toString().trim(),
    expiresAt: data?.expiresAt ? String(data.expiresAt) : null, // yyyy-mm-dd（可選）
    enabled: true,
  }
  localStorage.setItem(KEYS.invites, JSON.stringify([item, ...list]))
  return item
}

export async function updateInvite(id, patch) {
  await delay()
  const list = await listInvites()
  const i = list.findIndex((x) => x.id === id)
  if (i < 0) throw new Error('invite not found')

  const draft = { ...list[i] }

  // 若更新 code，要檢查唯一性（Case-insensitive & Trim）
  if (patch?.code && String(patch.code).trim().toUpperCase() !== String(draft.code).toUpperCase()) {
    const nextCode = String(patch.code).trim().toUpperCase()
    const codes = new Set(list.filter(v => v.id !== id).map((v) => String(v.code || '').toUpperCase()))
    if (codes.has(nextCode)) throw new Error('invite code duplicated')
    draft.code = nextCode
  }

  if (patch?.role != null) draft.role = String(patch.role)
  if (patch?.storeId != null) draft.storeId = String(patch.storeId)
  if (patch?.presetId != null) draft.presetId = String(patch.presetId)
  if (patch?.note != null) draft.note = String(patch.note).trim()
  if (patch?.expiresAt !== undefined) draft.expiresAt = patch.expiresAt ? String(patch.expiresAt) : null
  if (patch?.enabled !== undefined) draft.enabled = !!patch.enabled

  if (patch?.usesAllowed != null && Number.isFinite(+patch.usesAllowed)) {
    draft.usesAllowed = Math.max(0, +patch.usesAllowed)
    // 校正 usesLeft 範圍
    if (!Number.isFinite(+draft.usesLeft)) draft.usesLeft = 0
    draft.usesLeft = Math.max(0, Math.min(+draft.usesLeft, +draft.usesAllowed))
  }

  if (patch?.usesLeft != null && Number.isFinite(+patch.usesLeft)) {
    draft.usesLeft = Math.max(0, Math.min(+patch.usesLeft, +draft.usesAllowed ?? +draft.usesLeft))
  }

  // 若用罄則自動關閉
  if (Number.isFinite(+draft.usesLeft) && +draft.usesLeft === 0) draft.enabled = false

  list[i] = draft
  localStorage.setItem(KEYS.invites, JSON.stringify(list))
  return draft
}

export async function deleteInvite(id) {
  await delay()
  const list = await listInvites()
  localStorage.setItem(KEYS.invites, JSON.stringify(list.filter((x) => x.id !== id)))
  return true
}

export async function bulkCreateInvites(base, count) {
  await delay()
  const n = Math.max(0, Math.min(1000, Number.isFinite(+count) ? +count : 0))
  if (n === 0) return []
  const list = await listInvites()
  const created = []
  const codes = new Set(list.map((v) => String(v.code || '').toUpperCase()))
  const uses = Number.isFinite(+base?.usesAllowed) ? +base.usesAllowed : 1

  for (let i = 0; i < n; i++) {
    let code = genCodeService()
    while (codes.has(code)) code = genCodeService()
    codes.add(code)
    created.push({
      id: rid(),
      code,
      role: (base?.role || 'employee').toString(),
      storeId: (base?.storeId || '').toString(),
      presetId: (base?.presetId || '').toString(),
      createdAt: todayStr(),
      usesAllowed: uses,
      usesLeft: uses,
      note: (base?.note || '').toString().trim(),
      expiresAt: base?.expiresAt ? String(base.expiresAt) : null,
      enabled: true,
    })
  }
  localStorage.setItem(KEYS.invites, JSON.stringify([...created, ...list]))
  return created
}

/* 取得單一邀請碼（by code，Case-insensitive） */
export async function getInviteByCode(code) {
  await delay()
  const list = await listInvites()
  const target = String(code || '').trim().toUpperCase()
  return list.find((v) => String(v.code || '').toUpperCase() === target) || null
}

/* 核銷邀請碼（註冊／綁定時使用），自動扣次數、失效處理 */
export async function redeemInvite(code) {
  await delay()
  const list = await listInvites()
  const target = String(code || '').trim().toUpperCase()
  const i = list.findIndex((v) => String(v.code || '').toUpperCase() === target)
  if (i < 0) return { ok: false, reason: 'not_found' }

  const inv = { ...list[i] }

  // 驗效期與啟用狀態
  if (inv.enabled === false) return { ok: false, reason: 'disabled' }
  if (inv.expiresAt && todayStr() > String(inv.expiresAt)) return { ok: false, reason: 'expired' }
  if (!Number.isFinite(+inv.usesLeft) || +inv.usesLeft <= 0) return { ok: false, reason: 'usedup' }

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
  const payload = {
    __version: 1,
    __exportedAt: new Date().toISOString(),
    invites,
    presets,
    stores,
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

export async function importAll(jsonText) {
  await delay()
  const obj = safeParse(jsonText, null)
  if (!obj || typeof obj !== 'object') throw new Error('invalid json')

  // 基本驗證與容錯
  const presets = Array.isArray(obj.presets) ? obj.presets : []
  const invites = Array.isArray(obj.invites) ? obj.invites : []
  const stores  = Array.isArray(obj.stores)  ? obj.stores  : []

  // 只寫入可解析的陣列，避免覆蓋成 null
  localStorage.setItem(KEYS.presets, JSON.stringify(presets))
  localStorage.setItem(KEYS.invites, JSON.stringify(invites))
  localStorage.setItem(KEYS.stores,  JSON.stringify(stores))

  return { ok: true, counts: { presets: presets.length, invites: invites.length, stores: stores.length } }
}
