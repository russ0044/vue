// ---- 共用工具 ----
const delay = (ms=80) => new Promise(r=>setTimeout(r, ms))
export const todayStr = () => new Date().toISOString().slice(0,10)
export const genCodeService = () =>
  Math.random().toString(36).slice(2,6).toUpperCase() + '-' +
  Math.random().toString(36).slice(2,6).toUpperCase()
const rid = () => (crypto?.randomUUID?.() || ('id-'+Math.random().toString(36).slice(2,10)))

const KEYS = {
  stores: 'boss-stores',
  presets: 'boss-permission-presets',
  invites: 'boss-invite-codes',
}

// ---- Stores ----
export async function listStores(){
  await delay()
  const raw = localStorage.getItem(KEYS.stores)
  if (raw) { try { return JSON.parse(raw) } catch {} }
  const seed = [
    { id: rid(), name: '某某餐飲-總店' },
    { id: rid(), name: '某某餐飲-東門店' },
    { id: rid(), name: '某某餐飲-西門店' },
  ]
  localStorage.setItem(KEYS.stores, JSON.stringify(seed))
  return seed
}

// ---- Permission Presets ----
export async function listPresets(){
  await delay()
  const raw = localStorage.getItem(KEYS.presets)
  if (raw) { try { return JSON.parse(raw) } catch {} }
  const base = (list)=> (permKeys().reduce((o,k)=> (o[k]=list.includes(k), o), {}))
  const def = [
    { id: rid(), name: '店長權限',   defaultRole:'manager',  permissions: base(permKeys()) },
    { id: rid(), name: '庫存權限',   defaultRole:'employee', permissions: base(['inventory.view','inventory.edit','orders.create','reports.view']) },
    { id: rid(), name: '工讀生權限', defaultRole:'employee', permissions: base(['inventory.view','orders.create']) },
  ]
  localStorage.setItem(KEYS.presets, JSON.stringify(def))
  return def
}
export async function createPresetService(data){
  await delay()
  const list = await listPresets()
  const p = { id: rid(), ...data }
  localStorage.setItem(KEYS.presets, JSON.stringify([p, ...list]))
  return p
}
export async function updatePresetService(id, patch){
  await delay()
  const list = await listPresets()
  const i = list.findIndex(x=>x.id===id)
  if (i>=0) list[i] = { ...list[i], ...patch }
  localStorage.setItem(KEYS.presets, JSON.stringify(list))
  return list[i]
}
export async function deletePresetService(id){
  await delay()
  const list = await listPresets()
  localStorage.setItem(KEYS.presets, JSON.stringify(list.filter(x=>x.id!==id)))
  return true
}

// ---- Invites ----
export async function listInvites(){
  await delay()
  const raw = localStorage.getItem(KEYS.invites)
  if (raw) { try { return JSON.parse(raw) } catch {} }
  localStorage.setItem(KEYS.invites, JSON.stringify([]))
  return []
}
export async function createInvite(data){
  await delay()
  const list = await listInvites()
  const item = {
    ...data,
    id: rid(),
    code: data.code?.trim() || genCodeService(),
    createdAt: todayStr(),
    usesLeft: Number.isFinite(+data.usesAllowed) ? +data.usesAllowed : 1,
  }
  localStorage.setItem(KEYS.invites, JSON.stringify([item, ...list]))
  return item
}
export async function updateInvite(id, patch){
  await delay()
  const list = await listInvites()
  const i = list.findIndex(x=>x.id===id)
  if (i<0) throw new Error('invite not found')
  list[i] = { ...list[i], ...patch }
  localStorage.setItem(KEYS.invites, JSON.stringify(list))
  return list[i]
}
export async function deleteInvite(id){
  await delay()
  const list = await listInvites()
  localStorage.setItem(KEYS.invites, JSON.stringify(list.filter(x=>x.id!==id)))
  return true
}
export async function bulkCreateInvites(base, count){
  await delay()
  const list = await listInvites()
  const created=[]
  for(let i=0;i<count;i++){
    created.push({
      ...base,
      id: rid(),
      code: genCodeService(),
      createdAt: todayStr(),
      usesLeft: Number.isFinite(+base.usesAllowed) ? +base.usesAllowed : 1,
    })
  }
  localStorage.setItem(KEYS.invites, JSON.stringify([...created, ...list]))
  return created
}

// ---- Import / Export ----
export async function exportAll(){
  await delay()
  const invites = await listInvites()
  const presets = await listPresets()
  return new Blob([JSON.stringify({ invites, presets }, null, 2)], { type:'application/json' })
}
export async function importAll(jsonText){
  await delay()
  const obj = JSON.parse(jsonText)
  if (obj.presets) localStorage.setItem(KEYS.presets, JSON.stringify(obj.presets))
  if (obj.invites) localStorage.setItem(KEYS.invites, JSON.stringify(obj.invites))
  return true
}

// ---- 共享 ----
function permKeys(){
  return [
    'inventory.view','inventory.edit',
    'orders.create','orders.approve',
    'alerts.manage','reports.view','roles.manage'
  ]
}
