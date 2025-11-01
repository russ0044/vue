// src/composables/useKitchenData.js
// ---------------------------------------
// 中央廚房的單一資料來源 (Single Source of Truth)
// - 管 stores / requests / orders / records
// - 把資料存 localStorage
// - Firebase 模式目前先 fallback，不會爆
// - 給 KitchenRequests / KitchenOrders / KitchenRecords 共用
// ---------------------------------------

import { reactive, ref } from 'vue'

/* 工具 */
const todayStr = () => new Date().toISOString().slice(0,10)
const rid = () => 'id-' + Math.random().toString(36).slice(2,10)

function sampleRequest(storeId, date){
  return {
    id: rid(),
    storeId,
    date,
    status:'pending',       // pending | partial | done
    allowPartial:false,
    items:[
      { key:rid(), cat:'熟食區', name:'新鮮雞腿', unit:'份',   qty:50, ready:0, note:'' },
      { key:rid(), cat:'熟食區', name:'新鮮豬腿', unit:'公斤', qty:40, ready:0, note:'' },
      { key:rid(), cat:'熟食區', name:'新鮮牛腱', unit:'公斤', qty:20, ready:0, note:'' },
      { key:rid(), cat:'熟食區', name:'新鮮雞翅', unit:'份',   qty:15, ready:0, note:'' },
      { key:rid(), cat:'雜項區', name:'豬骨高湯', unit:'桶',   qty:2,  ready:0, note:'' },
      { key:rid(), cat:'雜項區', name:'米漿醬油', unit:'瓶',   qty:1,  ready:0, note:'' },
    ]
  }
}

/* ===== 反應式 DB ===== */
const db = reactive({
  stores:   [],
  requests: [],
  orders:   [],
  records:  []
})

/* ===== 資料來源模式 (local / firebase[預留]) ===== */
const dataSourceMode = ref(localStorage.getItem('km-mode') || 'local')

/* Local 儲存 */
function saveLocalDB(){
  localStorage.setItem('kitchen-db', JSON.stringify(db))
}

/* Local 載入（含假資料初始化） */
function loadLocalDB(){
  const raw = localStorage.getItem('kitchen-db')
  if (raw) {
    try {
      Object.assign(db, JSON.parse(raw))
      return
    } catch(e){
      console.warn('[kitchen-db] parse error，將重置假資料')
    }
  }

  // 初始化假資料（門市 + 請貨單 + 空訂單 + 範例紀錄）
  db.stores = [
    { id:'s1', name:'雲科店' },
    { id:'s2', name:'東門店' },
    { id:'s3', name:'西門店' },
  ]

  db.requests = [
    sampleRequest('s1', todayStr()),
    sampleRequest('s2', todayStr()),
    sampleRequest('s3', todayStr())
  ]

  db.orders = []

  db.records = [{
    id: rid(),
    storeId:'s1',
    date: todayStr(),
    summary:'昨日出貨：熟食 3 項、雜項 2 項，合計 5 項。',
    items: [
      { key:rid(), name:'新鮮雞腿', unit:'份',   qty:50, note:'' },
      { key:rid(), name:'新鮮豬腿', unit:'公斤', qty:40, note:'' },
    ]
  }]

  saveLocalDB()
}

/* Firebase 讀/寫（目前預留；實際上先 fallback 到 local，不會噴錯） */
async function fetchAllFromFirebase(){
  // TODO: 串 Firestore 時改這裡
  loadLocalDB()
}
async function saveAllToFirebase(){
  // TODO: 串 Firestore 時改這裡
  saveLocalDB()
}

/* 對外 fetch/save: 自動依 mode 決定用哪路徑 */
async function fetchAll(){
  if (dataSourceMode.value === 'firebase') {
    await fetchAllFromFirebase()
  } else {
    loadLocalDB()
  }
}

async function saveAll(){
  if (dataSourceMode.value === 'firebase') {
    await saveAllToFirebase()
  } else {
    saveLocalDB()
  }
}

/* 切換 local/firebase 模式 */
function setMode(newMode){
  dataSourceMode.value = newMode
  localStorage.setItem('km-mode', newMode)
  fetchAll()
}

/* 門市名稱工具 */
function storeName(id){
  return db.stores.find(s=>s.id===id)?.name || '—'
}

/* ================== 業務邏輯 ================== */

/* 請貨單：一鍵全部就緒 */
function applyAllReady(req){
  if (!req) return
  req.items.forEach(it => { it.ready = it.qty })
  saveAll()
}

/* 請貨單 → 接收並建立出貨訂單 (orders) */
function approveRequest(req){
  if (!req) return { ok:false, msg:'沒有可處理的請貨單' }

  // 若沒允許部分出貨，檢查 ready 是否都 >= qty
  if (!req.allowPartial && req.items.some(it => (it.ready || 0) < it.qty)){
    return { ok:false, msg:'尚未全部就緒（或勾選「允許部分出貨」）' }
  }

  const newOrder = {
    id: rid(),
    storeId: req.storeId,
    date: req.date,
    items: req.items.map(it => ({
      key: rid(),
      cat: it.cat,
      name: it.name,
      unit: it.unit,
      qty:  it.ready || 0,
      note: it.note || ''
    }))
  }

  db.orders.unshift(newOrder)

  // 更新請貨單狀態
  const allOK = req.items.every(it => (it.ready || 0) >= it.qty)
  req.status  = allOK ? 'done' : 'partial'

  saveAll()
  return { ok:true, newOrderId:newOrder.id, msg:'已接收並建立訂單' }
}

/* 統計：就緒率 */
function readyRate(req){
  if (!req || !req.items.length) return 0
  let totalQty = 0
  let totalReady = 0
  req.items.forEach(it=>{
    totalQty   += (it.qty || 0)
    totalReady += Math.min(it.ready || 0, it.qty || 0)
  })
  if (!totalQty) return 0
  return Math.round((totalReady / totalQty) * 100)
}

/* 統計：缺料數量 */
function shortageCount(req){
  if (!req || !req.items.length) return 0
  return req.items.filter(it => (it.ready || 0) < (it.qty || 0)).length
}

/* 產生「今日訂單」（AI 建議示意用） */
function generateTodayOrderForStore(storeId, date){
  if (!storeId || !date) return { ok:false, msg:'缺少門市或日期' }

  const exists = db.orders.some(o => o.storeId===storeId && o.date===date)
  if (exists){
    return { ok:false, msg:'今日此門市已有訂單' }
  }

  const base = sampleRequest(storeId, date)
  const ord = {
    id: rid(),
    storeId,
    date,
    items: base.items.map(it => ({
      key: rid(),
      cat: it.cat,
      name: it.name,
      unit: it.unit,
      qty:  Math.ceil(it.qty * 0.6), // 假裝 AI 建議
      note: ''
    }))
  }

  db.orders.unshift(ord)
  saveAll()
  return { ok:true, newOrderId:ord.id, msg:'已生成今日訂單（AI 建議示意）' }
}

/* 訂單數量校正（四捨五入 + 不為負） */
function recalcOrder(order){
  if (!order) return
  order.items.forEach(it => {
    it.qty = Math.max(0, Math.round(+it.qty || 0))
  })
  saveAll()
}

/* 把一張訂單複製到其他門市（同日配貨） */
function duplicateToOtherStores(order){
  if (!order) return { ok:false, msg:'沒有訂單' }

  db.stores
    .filter(s=> s.id !== order.storeId)
    .forEach(s=>{
      db.orders.unshift({
        id: rid(),
        storeId: s.id,
        date: order.date,
        items: order.items.map(it => ({
          ...it,
          key: rid()
        }))
      })
    })

  saveAll()
  return { ok:true, msg:'已複製到其他門市' }
}

/* 關單：把訂單寫入 records，並從進行中移除 */
function closeOrder(order){
  if (!order) return { ok:false, msg:'沒有訂單可關閉' }

  db.records.unshift({
    id: rid(),
    storeId: order.storeId,
    date: order.date,
    summary: `完成出貨：${order.items.length} 項`,
    items: order.items.map(it => ({ ...it }))
  })

  db.orders = db.orders.filter(o => o.id !== order.id)

  saveAll()
  return { ok:true, msg:'已完成並存檔' }
}

/* 合計數量 */
function totalQty(order){
  if (!order || !order.items.length) return 0
  return order.items.reduce((sum, it)=> sum + (+it.qty||0), 0)
}

/* 匯出 JSON（for 手動備份） */
function exportJSON(){
  const blob = new Blob([JSON.stringify(db, null, 2)], { type:'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = 'kitchen.json'
  a.click()
  URL.revokeObjectURL(url)
}

/* 匯入 JSON（for 手動還原） */
function importJSONFile(file, onOk, onFail){
  if (!file) return
  const reader = new FileReader()
  reader.onload = ()=>{
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj.stores || !obj.requests || !obj.orders || !obj.records) throw new Error()
      Object.assign(db, obj)
      saveAll()
      onOk && onOk()
    }catch{
      onFail && onFail()
    }
  }
  reader.readAsText(file, 'utf-8')
}

/* 對外輸出這些東西給畫面使用 */
export function useKitchenData(){
  return {
    // 狀態
    db,
    dataSourceMode,

    // 模式 / 載入 / 儲存
    fetchAll,
    saveAll,
    setMode,

    // 工具
    todayStr,
    rid,
    storeName,

    // 請貨處理流程
    applyAllReady,
    approveRequest,
    readyRate,
    shortageCount,

    // 出貨訂單 / 運作中
    generateTodayOrderForStore,
    recalcOrder,
    duplicateToOtherStores,
    closeOrder,
    totalQty,

    // 匯入匯出
    exportJSON,
    importJSONFile,
  }
}
