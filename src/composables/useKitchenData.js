// src/composables/useKitchenData.js
import { reactive, ref } from 'vue'
import seed from '@/seed/seedData'

const LS_KEY = 'kitchen-db-v1'

function clone(v){ return JSON.parse(JSON.stringify(v)) }
function todayStr(){ return new Date().toISOString().slice(0,10) }
function nextId(prefix, n){ return `${prefix}${String(n + 1).padStart(4, '0')}` }

/* 例用：出貨 / 請貨的基本項目 */
function sampleItems(){
  return [
    { key:'HNC-LEG', name:'海南雞腿', unit:'份', qty:12, cat:'熟食區', note:'', ready:0 },
    { key:'HNC-BRE', name:'海南雞胸', unit:'份', qty:8,  cat:'熟食區', note:'', ready:0 },
    { key:'SOUP-CH', name:'雞湯',     unit:'桶', qty:1,  cat:'熟食區', note:'', ready:0 },
    { key:'PACK-BOX',name:'外帶盒(大)',unit:'個', qty:20,cat:'雜項區', note:'', ready:0 },
    { key:'SAUCE-1', name:'辣醬',     unit:'包', qty:20, cat:'雜項區', note:'', ready:0 },
  ]
}

/* LocalStorage */
function readLS(){
  try{
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { orders: [], requests: [], records: [] }
    const obj = JSON.parse(raw)
    obj.orders  ||= []
    obj.requests||= []
    obj.records ||= []
    return obj
  }catch{
    return { orders: [], requests: [], records: [] }
  }
}
function writeLS(payload){
  localStorage.setItem(LS_KEY, JSON.stringify(payload))
}

export function useKitchenData(){
  const dataSourceMode = ref('seed')
  function setMode(_){} // 先保留介面

  // ✅ 加入 records
  const db = reactive({ stores:[], orders:[], requests:[], records:[] })

  async function fetchAll(){
    const s = seed() || {}
    db.stores = (s.stores && s.stores.length) ? clone(s.stores) : [
      { id:'S1', name:'某某餐飲-總店' },
      { id:'S2', name:'某某餐飲-東門店' },
      { id:'S3', name:'某某餐飲-西門店' },
      { id:'CK', name:'中央廚房' },
    ]
    const ls = readLS()
    db.orders   = clone(ls.orders)
    db.requests = clone(ls.requests)
    db.records  = clone(ls.records)   // ✅
  }

  function saveAll(){
    writeLS({
      orders  : clone(db.orders),
      requests: clone(db.requests),
      records : clone(db.records),     // ✅
    })
  }

  function storeName(id){ return db.stores.find(s=>s.id===id)?.name || id }

  /* ---------------- 訂單 ---------------- */
  function ensureOrderFor(storeId,date){
    const exist = db.orders.find(o=>o.storeId===storeId && o.date===date)
    if (exist) return exist.id
    const id = nextId('OD-', db.orders.length)
    db.orders.push({
      id, storeId, date, status:'pending',
      items: sampleItems(),
      createdAt: Date.now(), updatedAt: Date.now()
    })
    saveAll(); return id
  }

  function generateTodayOrderForStore(storeId, date=todayStr()){
    if (!storeId) return null
    const exist = db.orders.find(o=>o.storeId===storeId && o.date===date)
    return exist ? exist.id : ensureOrderFor(storeId, date)
  }

  function recalcOrder(order){
    if (!order) return
    order.items.forEach(it=>{
      it.qty = Math.max(0, Number(it.qty)||0)
    })
    order.status = order.items.some(i => !i.qty) ? 'partial' : 'pending'
    order.updatedAt = Date.now()
    saveAll()
  }

  function duplicateToOtherStores(order){
    if (!order) return
    const others = db.stores.filter(s=>s.id !== order.storeId)
    others.forEach(s=>{
      if (db.orders.some(o=>o.date===order.date && o.storeId===s.id)) return
      const id = nextId('OD-', db.orders.length)
      db.orders.push({
        id, storeId:s.id, date:order.date, status:'pending',
        items: clone(order.items),
        createdAt: Date.now(), updatedAt: Date.now()
      })
    })
    saveAll()
  }

  /* ---------------- 出貨紀錄 records ---------------- */
  function ensureRecordFor(storeId, date, fromOrder){
    const exist = db.records.find(r=> r.storeId===storeId && r.date===date)
    if (exist) return exist.id
    const id = nextId('RC-', db.records.length)
    const total = (fromOrder?.items||[]).reduce((a,b)=> a + (Number(b.qty)||0), 0)
    const summary = `從訂單 ${fromOrder?.id||'-'} 建立，品項 ${fromOrder?.items?.length||0}，總數量 ${total}`
    db.records.push({
      id, storeId, date,
      summary,
      items: clone(fromOrder?.items||[]),
      createdAt: Date.now(),
    })
    return id
  }

  function closeOrder(order){
    if (!order) return false
    order.status = 'done'
    order.updatedAt = Date.now()
    // ✅ 完成出貨時寫一筆出貨紀錄
    ensureRecordFor(order.storeId, order.date, order)
    saveAll()
    return true
  }

  function totalQty(order){
    return order?.items?.reduce((a,b)=> a + (Number(b.qty)||0), 0) || 0
  }

  /* ---------------- 請貨 ---------------- */
  function ensureRequestFor(storeId,date){
    const exist = db.requests.find(r=>r.storeId===storeId && r.date===date)
    if (exist) return exist.id
    const id = nextId('RQ-', db.requests.length)
    db.requests.push({
      id, storeId, date, status:'pending',
      items: sampleItems(),
      createdAt: Date.now(), updatedAt: Date.now()
    })
    saveAll(); return id
  }

  function applyAllReady(request){
    request.items.forEach(it=> it.ready = it.qty)
    request.status='done'
    request.updatedAt=Date.now()
    saveAll()
  }

  function approveRequest(request){
    if(!request) return { ok:false, msg:'沒有請貨單' }
    const anyShort = request.items.some(it => Number(it.ready||0) < Number(it.qty||0))
    if (anyShort) return { ok:false, msg:'尚有缺料，無法建立訂單' }
    const newId = ensureOrderFor(request.storeId, request.date)
    request.status='done'
    saveAll()
    return { ok:true, id:newId }
  }

  function readyRate(request){
    if(!request?.items?.length) return 0
    const total = request.items.reduce((a,b)=> a + (Number(b.qty)||0), 0)
    const ready = request.items.reduce((a,b)=> a + Math.min(Number(b.ready)||0, Number(b.qty)||0), 0)
    return total ? Math.round((ready/total)*100) : 0
  }

  function shortageCount(request){
    if(!request?.items?.length) return 0
    return request.items.filter(it => (Number(it.ready||0) < Number(it.qty||0))).length
  }

  /* ---------------- 匯入 / 匯出 ---------------- */
  function exportJSON(){
    const blob = new Blob([JSON.stringify({
      orders  : db.orders,
      requests: db.requests,
      records : db.records, // ✅
    }, null, 2)], { type:'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kitchen-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function importJSONFile(file, onOk, onErr){
    const r = new FileReader()
    r.onload = ()=>{
      try{
        const obj = JSON.parse(String(r.result||'{}'))
        db.orders   = clone(obj.orders||[])
        db.requests = clone(obj.requests||[])
        db.records  = clone(obj.records||[]) // ✅
        saveAll(); onOk?.()
      }catch{ onErr?.() }
    }
    r.onerror = ()=> onErr?.()
    r.readAsText(file)
  }

  return {
    db,
    dataSourceMode, setMode,
    fetchAll, saveAll, storeName,
    generateTodayOrderForStore, recalcOrder, duplicateToOtherStores, closeOrder, totalQty,
    applyAllReady, approveRequest, readyRate, shortageCount,
    exportJSON, importJSONFile,
  }
}
