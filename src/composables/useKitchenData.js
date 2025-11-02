// src/composables/useKitchenData.js
// ---------------------------------------
// 中央廚房的單一資料來源 (Single Source of Truth)
// - 管理 stores / requests / orders / records
// - 儲存在 localStorage
// - Firebase 模式目前預留（不會出錯）
// - 給 KitchenRequests / KitchenOrders / KitchenRecords 共用
// ---------------------------------------

import { reactive, ref } from 'vue'

/* 工具方法 */
const todayStr = () => new Date().toISOString().slice(0, 10)
const rid = () => 'id-' + Math.random().toString(36).slice(2, 10)

function sampleRequest(storeId, date) {
  return {
    id: rid(),
    storeId,
    date,
    status: 'pending', // pending | partial | done
    allowPartial: false,
    items: [
      { key: rid(), cat: '熟食區', name: '新鮮雞腿', unit: '份', qty: 50, ready: 0, note: '' },
      { key: rid(), cat: '熟食區', name: '新鮮豬腿', unit: '公斤', qty: 40, ready: 0, note: '' },
      { key: rid(), cat: '熟食區', name: '新鮮牛腱', unit: '公斤', qty: 20, ready: 0, note: '' },
      { key: rid(), cat: '熟食區', name: '新鮮雞翅', unit: '份', qty: 15, ready: 0, note: '' },
      { key: rid(), cat: '雜項區', name: '豬骨高湯', unit: '桶', qty: 2, ready: 0, note: '' },
      { key: rid(), cat: '雜項區', name: '米漿醬油', unit: '瓶', qty: 1, ready: 0, note: '' },
    ]
  }
}

/* ===== 反應式資料庫 ===== */
const db = reactive({
  stores: [],
  requests: [],
  orders: [],
  records: []
})

/* ===== 資料來源模式 (local / firebase[預留]) ===== */
const dataSourceMode = ref(localStorage.getItem('km-mode') || 'local')

/* 儲存至 LocalStorage */
function saveLocalDB() {
  try {
    localStorage.setItem('kitchen-db', JSON.stringify(db))
  } catch (err) {
    console.warn('[kitchen-db] 無法儲存 localStorage：', err)
  }
}

/* 載入 LocalStorage（若無則自動產生假資料） */
function loadLocalDB() {
  const raw = localStorage.getItem('kitchen-db')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      Object.assign(db, parsed)
      return
    } catch (e) {
      console.warn('[kitchen-db] JSON parse 錯誤，將重置假資料')
    }
  }

  // 初始化假資料
  db.stores = [
    { id: 's1', name: '雲科店' },
    { id: 's2', name: '東門店' },
    { id: 's3', name: '西門店' },
  ]

  db.requests = [
    sampleRequest('s1', todayStr()),
    sampleRequest('s2', todayStr()),
    sampleRequest('s3', todayStr())
  ]

  db.orders = []

  db.records = [{
    id: rid(),
    storeId: 's1',
    date: todayStr(),
    summary: '昨日出貨：熟食 3 項、雜項 2 項，合計 5 項。',
    items: [
      { key: rid(), name: '新鮮雞腿', unit: '份', qty: 50, note: '' },
      { key: rid(), name: '新鮮豬腿', unit: '公斤', qty: 40, note: '' },
    ]
  }]

  saveLocalDB()
}

/* Firebase 模式（目前預留，不會出錯） */
async function fetchAllFromFirebase() {
  console.info('[kitchen-db] Firebase 模式暫未實作，使用 Local 模式 fallback')
  loadLocalDB()
}

async function saveAllToFirebase() {
  console.info('[kitchen-db] Firebase 模式暫未實作，使用 Local 模式 fallback')
  saveLocalDB()
}

/* 通用讀取函式（自動依 mode） */
async function fetchAll() {
  if (dataSourceMode.value === 'firebase') {
    await fetchAllFromFirebase()
  } else {
    loadLocalDB()
  }
}

/* 通用儲存函式（自動依 mode） */
async function saveAll() {
  if (dataSourceMode.value === 'firebase') {
    await saveAllToFirebase()
  } else {
    saveLocalDB()
  }
}

/* 切換資料來源模式 */
function setMode(newMode) {
  dataSourceMode.value = newMode
  localStorage.setItem('km-mode', newMode)
  fetchAll()
}

/* 門市名稱工具 */
function storeName(id) {
  return db.stores.find(s => s.id === id)?.name || '—'
}

/* ================== 業務邏輯 ================== */

/* 請貨單：一鍵就緒 */
function applyAllReady(req) {
  if (!req) return
  req.items.forEach(it => { it.ready = it.qty })
  saveAll()
}

/* 請貨單 → 建立訂單 */
function approveRequest(req) {
  if (!req) return { ok: false, msg: '沒有可處理的請貨單' }

  if (!req.allowPartial && req.items.some(it => (it.ready || 0) < it.qty)) {
    return { ok: false, msg: '尚未全部就緒（或勾選允許部分出貨）' }
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
      qty: it.ready || 0,
      note: it.note || ''
    }))
  }

  db.orders.unshift(newOrder)
  req.status = req.items.every(it => (it.ready || 0) >= it.qty) ? 'done' : 'partial'

  saveAll()
  return { ok: true, newOrderId: newOrder.id, msg: '已接收並建立訂單' }
}

/* 就緒率 */
function readyRate(req) {
  if (!req || !req.items.length) return 0
  const total = req.items.reduce((acc, it) => acc + (it.qty || 0), 0)
  const ready = req.items.reduce((acc, it) => acc + Math.min(it.ready || 0, it.qty || 0), 0)
  return total ? Math.round((ready / total) * 100) : 0
}

/* 缺料數 */
function shortageCount(req) {
  if (!req || !req.items.length) return 0
  return req.items.filter(it => (it.ready || 0) < (it.qty || 0)).length
}

/* 產生今日訂單 */
function generateTodayOrderForStore(storeId, date) {
  if (!storeId || !date) return { ok: false, msg: '缺少門市或日期' }

  if (db.orders.some(o => o.storeId === storeId && o.date === date)) {
    return { ok: false, msg: '今日此門市已有訂單' }
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
      qty: Math.ceil(it.qty * 0.6),
      note: ''
    }))
  }

  db.orders.unshift(ord)
  saveAll()
  return { ok: true, newOrderId: ord.id, msg: '已生成今日訂單（AI 建議示意）' }
}

/* 數量校正 */
function recalcOrder(order) {
  if (!order) return
  order.items.forEach(it => { it.qty = Math.max(0, Math.round(+it.qty || 0)) })
  saveAll()
}

/* 複製到其他門市 */
function duplicateToOtherStores(order) {
  if (!order) return { ok: false, msg: '沒有訂單' }

  db.stores.filter(s => s.id !== order.storeId).forEach(s => {
    db.orders.unshift({
      id: rid(),
      storeId: s.id,
      date: order.date,
      items: order.items.map(it => ({ ...it, key: rid() }))
    })
  })

  saveAll()
  return { ok: true, msg: '已複製到其他門市' }
}

/* 關單（寫入紀錄） */
function closeOrder(order) {
  if (!order) return { ok: false, msg: '沒有訂單可關閉' }

  db.records.unshift({
    id: rid(),
    storeId: order.storeId,
    date: order.date,
    summary: `完成出貨：${order.items.length} 項`,
    items: order.items.map(it => ({ ...it }))
  })

  db.orders = db.orders.filter(o => o.id !== order.id)
  saveAll()
  return { ok: true, msg: '已完成並存檔' }
}

/* 合計數量 */
function totalQty(order) {
  if (!order || !order.items.length) return 0
  return order.items.reduce((sum, it) => sum + (+it.qty || 0), 0)
}

/* 匯出 JSON（手動備份） */
function exportJSON() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kitchen.json'
  a.click()
  URL.revokeObjectURL(url)
}

/* 匯入 JSON（手動還原） */
function importJSONFile(file, onOk, onFail) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result))
      if (!obj.stores || !obj.requests || !obj.orders || !obj.records) throw new Error()
      Object.assign(db, obj)
      saveAll()
      onOk && onOk()
    } catch {
      onFail && onFail()
    }
  }
  reader.readAsText(file, 'utf-8')
}

/* 對外暴露接口 */
export function useKitchenData() {
  return {
    db,
    dataSourceMode,
    fetchAll,
    saveAll,
    setMode,
    todayStr,
    rid,
    storeName,
    applyAllReady,
    approveRequest,
    readyRate,
    shortageCount,
    generateTodayOrderForStore,
    recalcOrder,
    duplicateToOtherStores,
    closeOrder,
    totalQty,
    exportJSON,
    importJSONFile,
  }
}

if (import.meta.env?.DEV) {
  console.log('%c[useKitchenData] Local 模式初始化完成', 'color:#16a34a;font-weight:bold')
}
