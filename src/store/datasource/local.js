// src/store/datasource/local.js
// --------------------------------------------------
// 使用 localStorage 的本地資料層 (開發/預覽用)
// ⚠ 正式環境建議切換到 firebase.js
// --------------------------------------------------

const KEY = 'smart-inv-demo'

/* --------- 小工具 --------- */
const normEmail = (e) => String(e || '').trim().toLowerCase()
const int = (v, min = -Infinity) => Math.max(min, Math.trunc(Number(v) || 0))
const nextId = (prefix, n) => `${prefix}${String(n + 1).padStart(3, '0')}`

/* --------- I/O --------- */
export function ensureSeed(seed) {
  if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(seed))
}

function readAll() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  let d
  try { d = JSON.parse(raw) } catch { return null }

  // 補欄位避免白屏
  d.users ??= []; d.roleGroups ??= []; d.stores ??= []; d.thresholds ??= []
  d.ingredients ??= []; d.inventory ??= []; d.inventoryChanges ??= []
  d.invites ??= []; d.settings ??= {}
  d.settings.store ??= { defaultStoreId: d.stores[0]?.id || '' }
  d.settings.roles ??= { emp:'員工', kitchen:'中央廚房' }
  // 🔹 UI 偏好：深色、疏密度、語言、日期、幣別、重量單位
  d.settings.ui ??= {
    theme: 'light',                  // light | dark | system
    density: 'comfortable',          // comfortable | compact
    lang: 'zh-TW',
    dateFmt: 'YYYY-MM-DD',
    currency: 'TWD',
    units: { weightInput:'g', weightDisplay:'kg', ratio:1000 } // g↔kg
  }
  return d
}

export function read() { return readAll() }
function writeAll(d) { localStorage.setItem(KEY, JSON.stringify(d)) }
function update(fn) { const next = fn(structuredClone(readAll())); writeAll(next); return next }

/* --------- 註冊 / 使用者 --------- */
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

/* --------- 店面 / 門檻 --------- */
export function addStore({ name, address, phone, type = 'branch' }) {
  return update(d => {
    if (!name) throw new Error('店面名稱不得為空')
    if (d.stores.some(s => s.name === name)) throw new Error('店面名稱已存在')
    const id = nextId('S', d.stores.length)
    d.stores.push({ id, name, address: String(address || ''), phone: String(phone || ''), type })
    d.thresholds.push({ storeId: id, minQty: 10, expDays: 3 })
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
// 🔹 新增：可修改地址/電話/類型
export function updateStore({ id, name, address, phone, type }) {
  return update(d => {
    const i = d.stores.findIndex(s => s.id === id)
    if (i < 0) throw new Error('查無此店面')
    if (name && d.stores.some(s => s.name === name && s.id !== id)) throw new Error('店面名稱已存在')
    d.stores[i] = {
      ...d.stores[i],
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(address !== undefined ? { address: String(address).trim() } : {}),
      ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
      ...(type  !== undefined ? { type: String(type) } : {})
    }
    return d
  })
}
export function deleteStore(id) {
  // 依 UC-13：刪店面會連動門檻/庫存/異動（含警告由前端提示）
  return update(d => {
    d.stores = d.stores.filter(s => s.id !== id)
    d.thresholds = d.thresholds.filter(t => t.storeId !== id)
    d.inventory = d.inventory.filter(i => i.storeId !== id)
    d.inventoryChanges = d.inventoryChanges.filter(c => c.storeId !== id)
    if (d.settings.store?.defaultStoreId === id) {
      d.settings.store.defaultStoreId = d.stores[0]?.id || ''
    }
    return d
  })
}
// 🔹 新增：設定預設店面
export function setDefaultStore(id){
  return update(d => { d.settings.store = { ...(d.settings.store||{}), defaultStoreId:id }; return d })
}

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

/* --------- 庫存異動（UC-03） --------- */
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
      d.inventory[idx] = { ...d.inventory[idx], qty: nextQty, exp: change.exp || d.inventory[idx].exp }
    } else {
      if (delta < 0) throw new Error('新建品項不可為負異動')
      d.inventory.push({
        storeId: change.storeId, sku: change.sku, name: change.name,
        unit: String(change.unit || ''), qty: delta, low: 10, exp: change.exp || ''
      })
    }
    return d
  })
}

/* --------- 食材（UC-11） --------- */
export function listIngredients(){ return readAll()?.ingredients || [] }
export function addIngredient(payload){
  return update(d=>{
    if(d.ingredients.some(x=>x.name===payload.name)) throw new Error('名稱已重複，請重新輸入')
    const sku = payload.sku?.trim() || `HCH-${String(d.ingredients.length+1).padStart(3,'0')}`
    d.ingredients.push({
      sku, name: payload.name.trim(), unit: payload.unit?.trim() || '',
      cost: Number(payload.cost||0), supplier: payload.supplier?.trim() || ''
    })
    return d
  })
}
export function updateIngredient(sku, patch){
  return update(d=>{
    const idx = d.ingredients.findIndex(x=>x.sku===sku)
    if(idx<0) throw new Error('查無此食材')
    if(patch.name && d.ingredients.some(x=>x.name===patch.name && x.sku!==sku))
      throw new Error('名稱已重複，請重新輸入')
    d.ingredients[idx] = { ...d.ingredients[idx], ...patch }
    return d
  })
}
export function deleteIngredient(sku){
  return update(d=>{
    const used = d.inventory.some(i=>i.sku===sku && (i.qty||0)>0)
    if(used) throw new Error('該食材仍存在庫存，請先清空庫存再刪除')
    d.ingredients = d.ingredients.filter(x=>x.sku!==sku)
    return d
  })
}

/* --------- 邀請碼 --------- */
function ensureInvitesShape(d){
  d.invites = Array.isArray(d.invites) ? d.invites : []
  return d
}
export function listInvites(){
  const d = ensureInvitesShape(readAll())
  return [...d.invites].sort((a,b)=>b.createdAt-a.createdAt)
}
export function createInvite({ role, days=7, note='' }){
  return update(d=>{
    ensureInvitesShape(d)
    const id = nextId('INV-', d.invites.length)
    const code = Math.random().toString(36).slice(2,8).toUpperCase()
    const now = Date.now(); const expiresAt = now + days*24*60*60*1000
    d.invites.push({ id, code, role, note, createdAt:now, expiresAt, used:false })
    return d
  })
}
export function revokeInvite(id){
  return update(d=>{ ensureInvitesShape(d); d.invites = d.invites.filter(i=>i.id!==id); return d })
}
export function purgeExpiredInvites(){
  return update(d=>{ ensureInvitesShape(d); const t = Date.now(); d.invites = d.invites.filter(i=>!i.used && i.expiresAt>t); return d })
}
export function verifyInvite(code){
  const d = ensureInvitesShape(readAll())
  const i = d.invites.find(x=>x.code===String(code).trim())
  if(!i) return { ok:false, reason:'not_found' }
  if(i.used) return { ok:false, reason:'used' }
  if(Date.now()>=i.expiresAt) return { ok:false, reason:'expired' }
  return { ok:true, role:i.role, note:i.note, expiresAt:i.expiresAt, id:i.id, code:i.code }
}
export function markInviteUsed(code){
  return update(d=>{
    ensureInvitesShape(d)
    const idx = d.invites.findIndex(i=>i.code===code)
    if(idx>-1) d.invites[idx].used = true
    return d
  })
}

/* --------- 系統設定 --------- */
// 角色顯示名稱
export function setRoleLabels({ emp, kitchen }){
  return update(d=>{
    d.settings.roles = { emp: emp?.trim()||'員工', kitchen: kitchen?.trim()||'中央廚房' }
    return d
  })
}
// 🔹 UI 偏好（深色/疏密/語言/日期/幣別/重量單位）
export function setUI(patch){
  return update(d=>{
    d.settings.ui = { ...d.settings.ui, ...patch }
    return d
  })
}
