<template>
  <section class="km-page">
    <!-- 頁首 -->
    <header class="km-header">
      <div class="title">中央廚房作業中心</div>
      <div class="spacer"></div>

      <!-- 資料來源切換（local / firebase） -->
      <div class="ds">
        <label class="muted small">資料來源</label>
        <select v-model="dataSource.mode" class="input sm" @change="onModeChanged">
          <option value="local">Local（假資料）</option>
          <option value="firebase">Firebase（預留）</option>
        </select>
      </div>

      <button class="btn ghost small" @click="goHome">回到主頁</button>
    </header>

    <!-- 分頁切換 -->
    <div class="km-tabs">
      <button :class="['tab', tab==='requests' && 'active']" @click="switchTab('requests')">請貨處理</button>
      <button :class="['tab', tab==='orders'   && 'active']" @click="switchTab('orders')">中央廚房訂單</button>
      <button :class="['tab', tab==='records'  && 'active']" @click="switchTab('records')">出貨紀錄</button>
      <div class="spacer"></div>

      <!-- 篩選條件（門市 + 日期） -->
      <div class="filter-row">
        <select v-model="selectedStoreId" class="input sm" @change="persistFilter">
          <option value="">全部門市</option>
          <option v-for="s in storesList" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <input type="date" class="input sm" v-model="dateStr" @change="persistFilter">
      </div>

      <!-- 類別 Tag 只對請貨 / 訂單顯示 -->
      <div class="chips" v-if="tab!=='records'">
        <button
          v-for="tg in tags"
          :key="tg"
          class="chip"
          :class="{on: tagFilter.has(tg)}"
          @click="toggleTag(tg)"
        >#{{ tg }}</button>
      </div>

      <!-- 生成今日訂單（只在訂單分頁顯示） -->
      <button
        v-if="tab==='orders'"
        class="btn primary small"
        @click="generateTodayOrder"
      >＋ 生成今日訂單</button>

      <!-- 手機開側欄 -->
      <button class="icon-btn only-mobile" title="清單" @click="drawerOpen = true">☰</button>
    </div>

    <!-- 主體：左（清單） + 右（內容） -->
    <div class="km-grid">
      <!-- 左欄：清單 -->
      <aside class="km-side" :class="{open: drawerOpen}">
        <!-- 左欄列表：請貨單 -->
        <div class="side-list" v-if="tab==='requests'">
          <div
            class="side-item"
            v-for="r in filteredRequests"
            :key="r.id"
            :class="{active: r.id===selectedId}"
            @click="selectLeft(r.id)"
          >
            <div class="grow">
              <div class="name"><strong>{{ storeName(r.storeId) }}</strong></div>
              <div class="muted small">申請：{{ r.date }}｜品項：{{ r.items.length }}</div>
            </div>
            <div class="badge" :class="r.status">{{ statusText(r.status) }}</div>
          </div>
          <p v-if="!filteredRequests.length" class="muted center side-empty">沒有請貨單</p>
        </div>

        <!-- 左欄列表：目前訂單 -->
        <div class="side-list" v-else-if="tab==='orders'">
          <div
            class="side-item"
            v-for="o in filteredOrders"
            :key="o.id"
            :class="{active: o.id===selectedId}"
            @click="selectLeft(o.id)"
          >
            <div class="grow">
              <div class="name"><strong>{{ storeName(o.storeId) }}</strong></div>
              <div class="muted small">{{ o.date }}｜總品項：{{ o.items.length }}</div>
            </div>
            <div class="badge primary">訂單</div>
          </div>
          <p v-if="!filteredOrders.length" class="muted center side-empty">沒有訂單</p>
        </div>

        <!-- 左欄列表：已出貨紀錄 -->
        <div class="side-list" v-else>
          <div
            class="side-item"
            v-for="rec in filteredRecords"
            :key="rec.id"
            :class="{active: rec.id===selectedId}"
            @click="selectLeft(rec.id)"
          >
            <div class="grow">
              <div class="name"><strong>{{ storeName(rec.storeId) }}</strong></div>
              <div class="muted small">{{ rec.date }}｜{{ rec.summary }}</div>
            </div>
            <div class="badge">記錄</div>
          </div>
          <p v-if="!filteredRecords.length" class="muted center side-empty">沒有出貨紀錄</p>
        </div>
      </aside>

      <!-- 手機遮罩 -->
      <transition name="fade">
        <div
          v-if="drawerOpen"
          class="backdrop"
          @click="drawerOpen=false"
        />
      </transition>

      <!-- 右欄內容 -->
      <main class="km-main card">
        <!-- 標題列 + 操作列 -->
        <div class="main-head">
          <div class="left">
            <div class="view-title" v-if="tab==='requests'">請貨處理</div>
            <div class="view-title" v-else-if="tab==='orders'">中央廚房訂單</div>
            <div class="view-title" v-else>出貨紀錄</div>

            <!-- 小摘要區：針對當前單 -->
            <div
              v-if="tab==='requests' && currentRequest"
              class="mini-stats"
            >
              <div class="mini-box">
                <div class="mini-label">就緒率</div>
                <div class="mini-value">
                  {{ readyRate(currentRequest) }}%
                </div>
              </div>
              <div class="mini-box">
                <div class="mini-label">缺料項數</div>
                <div class="mini-value warn">
                  {{ shortageCount(currentRequest) }}
                </div>
              </div>
            </div>

            <div
              v-else-if="tab==='orders' && currentOrder"
              class="mini-stats"
            >
              <div class="mini-box">
                <div class="mini-label">總數量</div>
                <div class="mini-value">
                  {{ totalQty(currentOrder) }}
                </div>
              </div>
              <div class="mini-box">
                <div class="mini-label">品項</div>
                <div class="mini-value">{{ currentOrder.items.length }}</div>
              </div>
            </div>
          </div>

          <div class="spacer"></div>

          <!-- 右側動作（請貨單） -->
          <div class="row gap" v-if="tab==='requests' && currentRequest">
            <button
              class="btn"
              @click="applyAllReady"
              :disabled="!currentRequest.items.length"
            >全部就緒</button>

            <button
              class="btn primary"
              @click="approveRequest"
            >接收並建立訂單</button>
          </div>

          <!-- 右側動作（訂單） -->
          <div class="row gap" v-else-if="tab==='orders' && currentOrder">
            <button class="btn" @click="recalc(currentOrder)">數量校正</button>
            <button class="btn ghost small" @click="duplicateToOtherStores">複製到其他門市</button>
            <button class="btn primary" @click="closeOrder">完成並存檔</button>
          </div>
        </div>

        <!-- 右區主卡片內容 -->
        <!-- [A] 請貨處理 -->
        <template v-if="tab==='requests'">
          <div v-if="!currentRequest" class="km-empty">
            <div class="ico">📄</div>
            <div class="muted">請從左側選擇一張請貨單</div>
          </div>

          <div v-else class="paper">
            <div class="paper-head">
              <div>門市：{{ storeName(currentRequest.storeId) }}</div>
              <div>日期：{{ currentRequest.date }}</div>
            </div>

            <div
              class="section"
              v-for="group in groupedReq"
              :key="group.name"
            >
              <div class="sec-title">{{ group.name }}</div>

              <div class="table">
                <div class="th">
                  <div class="w200">品名</div>
                  <div class="w90">單位</div>
                  <div class="w120">請貨數</div>
                  <div class="w120">就緒數</div>
                  <div class="grow">備註</div>
                </div>

                <div
                  class="tr"
                  v-for="it in group.rows"
                  :key="it.key"
                >
                  <div class="w200">{{ it.name }}</div>
                  <div class="w90">{{ it.unit }}</div>
                  <div class="w120">{{ it.qty }}</div>
                  <div class="w120">
                    <input
                      type="number"
                      class="input"
                      min="0"
                      v-model.number="it.ready"
                      @change="saveDB"
                    />
                  </div>
                  <div class="grow">
                    <input
                      class="input"
                      v-model.trim="it.note"
                      placeholder="備註…"
                      @change="saveDB"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="row justify-end allow-row">
              <label class="chk">
                <input
                  type="checkbox"
                  v-model="currentRequest.allowPartial"
                  @change="saveDB"
                />
                <span></span>
              </label>
              <span class="muted">允許部分出貨</span>
            </div>
          </div>
        </template>

        <!-- [B] 中央廚房訂單 -->
        <template v-else-if="tab==='orders'">
          <div v-if="!currentOrder" class="km-empty">
            <div class="ico">📄</div>
            <div class="muted">請從左側選擇訂單或按「生成今日訂單」</div>
          </div>

          <div v-else class="paper">
            <div class="paper-head">
              <div>門市：{{ storeName(currentOrder.storeId) }}</div>
              <div>日期：{{ currentOrder.date }}</div>
            </div>

            <div
              class="section"
              v-for="group in groupedOrd"
              :key="group.name"
            >
              <div class="sec-title">{{ group.name }}</div>

              <div class="table">
                <div class="th">
                  <div class="w200">品名</div>
                  <div class="w90">單位</div>
                  <div class="w120">數量</div>
                  <div class="grow">備註</div>
                </div>

                <div
                  class="tr"
                  v-for="it in group.rows"
                  :key="it.key"
                >
                  <div class="w200">{{ it.name }}</div>
                  <div class="w90">{{ it.unit }}</div>
                  <div class="w120">
                    <input
                      type="number"
                      class="input"
                      min="0"
                      v-model.number="it.qty"
                      @change="saveDB"
                    />
                  </div>
                  <div class="grow">
                    <input
                      class="input"
                      v-model.trim="it.note"
                      placeholder="備註…"
                      @change="saveDB"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 訂單摘要（出貨總覽） -->
            <div class="order-summary">
              <div class="summary-box">
                <div class="summary-label">出貨總數量</div>
                <div class="summary-value">{{ totalQty(currentOrder) }}</div>
              </div>
              <div class="summary-box">
                <div class="summary-label">品項數</div>
                <div class="summary-value">{{ currentOrder.items.length }}</div>
              </div>
              <div class="summary-box">
                <div class="summary-label">狀態</div>
                <div class="summary-value status-chip">
                  準備中
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- [C] 出貨紀錄 -->
        <template v-else>
          <div v-if="!currentRecord" class="km-empty">
            <div class="ico">📄</div>
            <div class="muted">請從左側選擇一筆出貨紀錄</div>
          </div>

          <div v-else class="paper">
            <div class="paper-head">
              <div>門市：{{ storeName(currentRecord.storeId) }}</div>
              <div>日期：{{ currentRecord.date }}</div>
            </div>

            <div class="section">
              <div class="sec-title">摘要</div>
              <div class="muted">{{ currentRecord.summary }}</div>
            </div>

            <div class="section">
              <div class="sec-title">詳細清單</div>

              <div class="table">
                <div class="th">
                  <div class="w200">品名</div>
                  <div class="w90">單位</div>
                  <div class="w120">數量</div>
                  <div class="grow">備註</div>
                </div>

                <div
                  class="tr"
                  v-for="it in currentRecord.items"
                  :key="it.key"
                >
                  <div class="w200">{{ it.name }}</div>
                  <div class="w90">{{ it.unit }}</div>
                  <div class="w120">{{ it.qty }}</div>
                  <div class="grow">{{ it.note || '—' }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- 底部工具列：統一字體大小 -->
    <footer class="footer-bar">
      <div class="left-info">
        <div class="tagline">中央廚房作業 · 即時分貨 / 出貨 / 留檔</div>
      </div>

      <div class="spacer"></div>

      <div class="footer-actions">
        <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
        <label class="btn ghost small file-btn">
          匯入 JSON
          <input type="file" accept="application/json" @change="importJSON">
        </label>
      </div>
    </footer>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

/* Router / Toast / Utils */
const router = useRouter()
const toast = ref('')
function tip(m){ toast.value=m; setTimeout(()=>toast.value='',1400) }

const todayStr = () => new Date().toISOString().slice(0,10)
const rid = () => 'id-' + Math.random().toString(36).slice(2,10)

function statusText(s){
  if (s === 'pending') return '待處理'
  if (s === 'partial') return '部分就緒'
  if (s === 'done')    return '完成'
  return s || '—'
}

/* ======================================================
   資料層：三端資料統一
   mode = 'local' (假資料 / LocalStorage)
   mode = 'firebase' (預留，未爆錯)
====================================================== */
const dataSource = reactive({
  mode: localStorage.getItem('km-mode') || 'local',
  async fetchAll () {
    if (this.mode === 'firebase') {
      // 之後可改成向 Firestore 要資料
      await fetchAllFromFirebase()
    } else {
      loadDB()
    }
  },
  async saveAll () {
    if (this.mode === 'firebase') {
      await saveAllToFirebase()
    } else {
      saveDB()
    }
  }
})

async function fetchAllFromFirebase(){
  // TODO: 串接 Firestore 讀取 (目前不做，保證不爆)
  // 假裝成功，fallback 回 localStorage
  loadDB()
}
async function saveAllToFirebase(){
  // TODO: 串接 Firestore 寫入
  saveDB()
}

function onModeChanged(){
  localStorage.setItem('km-mode', dataSource.mode)
  tip('資料來源模式已切換')
  dataSource.fetchAll()
}

/* ======================================================
   本地 DB 結構
====================================================== */
const db = reactive({
  stores: [],
  requests: [],
  orders: [],
  records: []
})

function sampleRequest(storeId, date){
  return {
    id: rid(),
    storeId,
    date,
    status:'pending',
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

function loadDB(){
  const raw = localStorage.getItem('kitchen-db')
  if (raw) {
    try {
      Object.assign(db, JSON.parse(raw))
      return
    } catch(e){
      console.warn('[kitchen-db] parse error，重置假資料')
    }
  }

  // 初始化假資料
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

  saveDB()
}

function saveDB(){
  localStorage.setItem('kitchen-db', JSON.stringify(db))
}

/* ======================================================
   介面狀態
====================================================== */
const tab = ref('requests') // 'requests' | 'orders' | 'records'
const drawerOpen = ref(false)

function switchTab(t){
  tab.value = t
  drawerOpen.value = false
  selectedId.value = null
}

/* 篩選條件（門市 / 日期 / 類別 chip） */
const storesList = computed(()=> db.stores)
const selectedStoreId = ref(localStorage.getItem('km-store') || '')
const dateStr         = ref(localStorage.getItem('km-date')  || todayStr())

const tags = ['熟食區','雜項區']
const tagFilter = reactive(new Set())

function toggleTag(t){
  tagFilter.has(t) ? tagFilter.delete(t) : tagFilter.add(t)
}

function persistFilter(){
  localStorage.setItem('km-store', selectedStoreId.value)
  localStorage.setItem('km-date',  dateStr.value)
}

/* 共用小工具 */
const storeName = (id)=> storesList.value.find(s=>s.id===id)?.name || '—'

/* 左欄目前選取哪張單 */
const selectedId = ref(null)
function selectLeft(id){
  selectedId.value = id
  drawerOpen.value = false
}

/* 列出左側清單：請貨單 / 訂單 / 記錄 */
const filteredRequests = computed(()=>{
  return db.requests
    .filter(r => !selectedStoreId.value || r.storeId === selectedStoreId.value)
    .filter(r => r.date === dateStr.value)
    .filter(r => !tagFilter.size || r.items.some(it=> tagFilter.has(it.cat)))
    .sort((a,b)=> (a.storeId > b.storeId ? 1 : -1))
})
const filteredOrders = computed(()=>{
  return db.orders
    .filter(o => !selectedStoreId.value || o.storeId === selectedStoreId.value)
    .filter(o => o.date === dateStr.value)
    .filter(o => !tagFilter.size || o.items.some(it=> tagFilter.has(it.cat)))
    .sort((a,b)=> (a.storeId > b.storeId ? 1 : -1))
})
const filteredRecords = computed(()=>{
  return db.records
    .filter(r => !selectedStoreId.value || r.storeId === selectedStoreId.value)
    .filter(r => !dateStr.value || r.date <= dateStr.value)
    .sort((a,b)=> (a.date > b.date ? -1 : 1))
})

/* 目前右側正在看的單 */
const currentRequest = computed(()=> db.requests.find(r=>r.id===selectedId.value) || null)
const currentOrder   = computed(()=> db.orders.find(o=>o.id===selectedId.value)   || null)
const currentRecord  = computed(()=> db.records.find(o=>o.id===selectedId.value)  || null)

/* 分類群組顯示（右側表格） */
const groupedReq = computed(()=>{
  if (!currentRequest.value) return []
  const g = {}
  currentRequest.value.items.forEach(it=>{
    if (!g[it.cat]) g[it.cat] = []
    g[it.cat].push(it)
  })
  return Object.keys(g).map(name=>({ name, rows:g[name] }))
})
const groupedOrd = computed(()=>{
  if (!currentOrder.value) return []
  const g = {}
  currentOrder.value.items.forEach(it=>{
    if (!g[it.cat]) g[it.cat] = []
    g[it.cat].push(it)
  })
  return Object.keys(g).map(name=>({ name, rows:g[name] }))
})

/* ===== 請貨相關邏輯 ===== */
function applyAllReady(){
  if (!currentRequest.value) return
  currentRequest.value.items.forEach(it => { it.ready = it.qty })
  tip('已全部設定為就緒')
  saveDB()
}

function approveRequest(){
  const r = currentRequest.value
  if (!r) return

  // 如果未允許部分出貨，檢查是否全部達標
  if (!r.allowPartial && r.items.some(it => (it.ready || 0) < it.qty)){
    return tip('尚未全部就緒（或勾選「允許部分出貨」）')
  }

  // 建立新訂單
  const newOrder = {
    id: rid(),
    storeId: r.storeId,
    date: r.date,
    items: r.items.map(it => ({
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
  const allOK   = r.items.every(it => (it.ready || 0) >= it.qty)
  r.status      = allOK ? 'done' : 'partial'

  // 自動切到剛生成的訂單顯示
  selectedId.value = newOrder.id
  saveDB()
  tip('已接收並建立訂單')
}

/* ===== 訂單相關邏輯 ===== */
function generateTodayOrder(){
  // 取目前篩選的門市（或 fallback 第一間）
  const sid  = selectedStoreId.value || (db.stores[0]?.id || '')
  const date = dateStr.value || todayStr()
  if (!sid) {
    tip('沒有可用的門市'); return
  }

  const exists = db.orders.some(o => o.storeId===sid && o.date===date)
  if (exists){
    tip('今日此門市已有訂單')
    return
  }

  // 用一張假的請貨單來生 AI 建議
  const base = sampleRequest(sid, date)
  const ord = {
    id: rid(),
    storeId: sid,
    date,
    items: base.items.map(it => ({
      key: rid(),
      cat: it.cat,
      name: it.name,
      unit: it.unit,
      qty:  Math.ceil(it.qty * 0.6), // 假裝AI建議
      note: ''
    }))
  }

  db.orders.unshift(ord)
  selectedId.value = ord.id
  saveDB()
  tip('已生成今日訂單（AI 建議示意）')
}

function recalc(order){
  order.items.forEach(it => {
    it.qty = Math.max(0, Math.round(+it.qty || 0))
  })
  saveDB()
  tip('數量已校正')
}

function duplicateToOtherStores(){
  const o = currentOrder.value
  if (!o) return

  db.stores
    .filter(s=> s.id !== o.storeId)
    .forEach(s=>{
      db.orders.unshift({
        id: rid(),
        storeId: s.id,
        date: o.date,
        items: o.items.map(it => ({
          ...it,
          key: rid()
        }))
      })
    })

  saveDB()
  tip('已複製到其他門市')
}

function closeOrder(){
  const o = currentOrder.value
  if (!o) return

  db.records.unshift({
    id: rid(),
    storeId: o.storeId,
    date: o.date,
    summary: `完成出貨：${o.items.length} 項`,
    items: o.items.map(it => ({ ...it }))
  })

  // 從進行中訂單移除
  db.orders = db.orders.filter(x => x.id !== o.id)
  selectedId.value = null

  saveDB()
  tip('已完成並存檔')
}

/* ===== 計算用的小摘要 ===== */
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

function shortageCount(req){
  if (!req || !req.items.length) return 0
  return req.items.filter(it => (it.ready || 0) < (it.qty || 0)).length
}

function totalQty(order){
  if (!order || !order.items.length) return 0
  return order.items.reduce((sum, it)=> sum + (+it.qty||0), 0)
}

/* ===== 匯入 / 匯出 & 導回 ===== */
function exportJSON(){
  const blob = new Blob([JSON.stringify(db, null, 2)], { type:'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = 'kitchen.json'
  a.click()
  URL.revokeObjectURL(url)
  tip('已匯出資料')
}

function importJSON(e){
  const f = e.target.files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = ()=>{
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj.stores || !obj.requests || !obj.orders || !obj.records) throw new Error()
      Object.assign(db, obj)
      saveDB()
      tip('已匯入資料')
    }catch{
      tip('匯入失敗：格式錯誤')
    }
  }
  reader.readAsText(f, 'utf-8')
}

function goHome(){
  // 依你的路由名稱調整
  router.push({ name:'boss-inventory' })
}

/* 掛載初始化 */
onMounted(async()=>{
  await dataSource.fetchAll()
})
</script>

<style scoped>
:root{
  --bg:#f6f8fc;
  --card:#fff;
  --border:#e6eaf2;
  --muted:#64748b;
  --text:#0f172a;
  --accent:#2563eb;
}

.km-page{
  background:var(--bg);
  min-height:100vh;
  display:flex;
  flex-direction:column;
  padding-bottom:72px; /* 留給 footer-bar */
  box-sizing:border-box;
  padding-left:16px;
  padding-right:16px;
  padding-top:16px;
}

/* 頁首 */
.km-header{
  display:flex;
  align-items:center;
  gap:12px;
  flex-wrap:wrap;
  margin-bottom:8px;
}
.title{
  font-size:20px;
  font-weight:800;
  color:var(--text);
}
.spacer{ flex:1; }

.ds{
  display:flex;
  align-items:center;
  gap:6px;
  flex-wrap:wrap;
}

.input{
  border:1px solid var(--border);
  border-radius:10px;
  padding:8px 10px;
  outline:none;
  background:#fff;
  font-size:14px;
  line-height:1.2;
  min-width:0;
}
.input.sm{
  padding:6px 8px;
  font-size:13px;
}
.input:focus{
  border-color:#9ec5ff;
  box-shadow:0 0 0 3px rgba(99,162,255,.15);
}

/* Tabs row */
.km-tabs{
  background:#fff;
  border:1px solid var(--border);
  border-radius:14px;
  padding:12px;
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:8px;
  margin-bottom:12px;
  box-shadow:0 8px 24px rgba(0,0,0,.04);
}

.tab{
  border:1px solid var(--border);
  background:#fff;
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:14px;
  line-height:1.2;
  color:var(--text);
}
.tab.active{
  background:#e6f4ff;
  border-color:#cfe9ff;
  color:#1e3a8a;
  font-weight:600;
}

.filter-row{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px;
}

.chips{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.chip{
  border:1px solid var(--border);
  border-radius:999px;
  background:#fff;
  padding:6px 10px;
  cursor:pointer;
  font-size:13px;
  line-height:1.2;
  color:#0f172a;
}
.chip.on{
  background:#eef2ff;
  border-color:#c7d2fe;
  color:#3730a3;
}

.btn{
  border:1px solid #cfe0ff;
  background:#fff;
  color:#2563eb;
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:14px;
  line-height:1.2;
  white-space:nowrap;
}
.btn.primary{
  background:#2563eb;
  border-color:#2563eb;
  color:#fff;
}
.btn.ghost{
  border-color:var(--border);
  color:#334155;
  background:#fff;
}
.btn.small{
  padding:6px 10px;
  font-size:13px;
}

.file-btn{
  position:relative;
  overflow:hidden;
}
.file-btn input{
  position:absolute;
  inset:0;
  opacity:0;
  cursor:pointer;
}

.icon-btn{
  border:none;
  background:transparent;
  cursor:pointer;
  font-size:18px;
  line-height:1;
  opacity:.85;
  padding:6px 8px;
  border-radius:8px;
  border:1px solid transparent;
}
.icon-btn:hover{
  opacity:1;
  border-color:#dbeafe;
  background:#eff6ff;
  color:#1e40af;
}
.only-mobile{ display:none; }

/* 兩欄版型 */
.km-grid{
  display:grid;
  grid-template-columns:320px 1fr;
  gap:12px;
  min-width:0;
}

/* 左邊清單 */
.km-side{
  background:#fff;
  border:1px solid var(--border);
  border-radius:16px;
  overflow:hidden;
  position:relative;
  box-shadow:0 8px 24px rgba(0,0,0,.04);
}

.side-list{
  max-height:calc(100vh - 240px);
  overflow:auto;
  padding:10px;
}
.side-item{
  display:flex;
  gap:10px;
  align-items:flex-start;
  border:1px solid var(--border);
  border-radius:10px;
  padding:10px;
  margin-bottom:8px;
  background:#fff;
  cursor:pointer;
  font-size:14px;
  line-height:1.4;
  box-shadow:0 2px 6px rgba(0,0,0,.03);
}
.side-item.active{
  outline:2px solid #9ec5ff;
  background:#f8fafc;
}
.name{
  font-weight:700;
  color:var(--text);
  font-size:14px;
}
.muted{
  color:var(--muted);
  font-size:13px;
}
.small{
  font-size:12px;
  line-height:1.2;
}
.center{
  text-align:center;
}
.side-empty{
  font-size:13px;
  padding:20px 0 8px;
}

.badge{
  border:1px solid var(--border);
  border-radius:999px;
  padding:2px 8px;
  font-size:12px;
  line-height:1.2;
  height:24px;
  display:flex;
  align-items:center;
  color:#475569;
  background:#fff;
}
.badge.primary{
  border-color:#bfdbfe;
  background:#eff6ff;
  color:#1e40af;
  font-weight:600;
}
.badge.done{
  background:#f0fdf4;
  border-color:#bbf7d0;
  color:#166534;
}
.badge.pending{
  background:#fffbeb;
  border-color:#fde68a;
  color:#92400e;
}
.badge.partial{
  background:#fafafa;
  border-color:#e5e7eb;
  color:#1f2937;
}

/* 遮罩：手機左欄抽屜 */
.backdrop{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.25);
  z-index:30;
}

/* 右側卡片 */
.card{
  background:#fff;
  border:1px solid var(--border);
  border-radius:16px;
  padding:12px;
  min-width:0;
  box-shadow:0 8px 24px rgba(0,0,0,.04);
}
.km-main .main-head{
  display:flex;
  align-items:flex-start;
  gap:12px;
  margin-bottom:12px;
  flex-wrap:wrap;
}
.view-title{
  font-size:16px;
  font-weight:700;
  color:var(--text);
  line-height:1.3;
  margin-bottom:4px;
}
.mini-stats{
  display:flex;
  gap:12px;
  flex-wrap:wrap;
}
.mini-box{
  background:#fff;
  border:1px solid var(--border);
  border-radius:10px;
  padding:8px 10px;
  min-width:90px;
  box-shadow:0 4px 12px rgba(0,0,0,.03);
}
.mini-label{
  font-size:11px;
  color:#64748b;
  line-height:1.2;
  margin-bottom:4px;
}
.mini-value{
  font-size:16px;
  font-weight:700;
  color:#0f172a;
  line-height:1.2;
}
.mini-value.warn{
  color:#b45309;
}

/* 單據紙 + 表格 */
.paper{
  background:#fff;
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 4px 16px rgba(0,0,0,.04);
  overflow:hidden;
}
.paper-head{
  display:flex;
  justify-content:space-between;
  flex-wrap:wrap;
  padding:12px 16px;
  border-bottom:1px dashed var(--border);
  font-size:14px;
  color:#0f172a;
  background:#fafcff;
}
.section{
  padding:16px;
}
.sec-title{
  font-weight:700;
  font-size:14px;
  color:#1e293b;
  margin-bottom:10px;
}
.table{
  border:1px solid var(--border);
  border-radius:10px;
  overflow:hidden;
  font-size:14px;
}
.th,
.tr{
  display:flex;
  gap:10px;
  align-items:center;
  border-bottom:1px solid #f1f5f9;
  padding:10px 12px;
}
.th{
  background:#fafcff;
  font-weight:600;
  color:#334155;
}
.tr:last-child{
  border-bottom:none;
}
.w200{ width:200px; }
.w120{ width:120px; }
.w90 { width:90px; }
.grow{ flex:1; min-width:0; }

.input{
  width:100%;
  border:1px solid var(--border);
  border-radius:8px;
  padding:.5rem .6rem;
  background:#fff;
  font-size:14px;
  line-height:1.2;
  color:#0f172a;
}
.input:focus{
  border-color:#9ec5ff;
  box-shadow:0 0 0 3px rgba(99,162,255,.15);
  outline:none;
}

.row{
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:8px;
}
.row.gap{
  gap:8px;
}
.justify-end{
  justify-content:flex-end;
}
.allow-row{
  padding:12px 16px;
}

.chk{
  display:inline-flex;
  align-items:center;
}
.chk input{
  display:none;
}
.chk span{
  width:18px;
  height:18px;
  border:1px solid #cbd5e1;
  border-radius:4px;
  background:#fff;
  position:relative;
  display:inline-block;
}
.chk input:checked + span::after{
  content:'';
  position:absolute;
  inset:3px;
  background:#2563eb;
  border-radius:2px;
}

/* 空狀態 */
.km-empty{
  border:1px dashed var(--border);
  border-radius:12px;
  padding:40px;
  text-align:center;
  background:#fff;
  color:#475569;
}
.km-empty .ico{
  font-size:28px;
  margin-bottom:8px;
  line-height:1;
}

/* 訂單摘要 */
.order-summary{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  padding:16px;
  border-top:1px dashed var(--border);
}
.summary-box{
  background:#fff;
  border:1px solid var(--border);
  border-radius:10px;
  padding:10px 12px;
  min-width:110px;
  box-shadow:0 4px 12px rgba(0,0,0,.03);
}
.summary-label{
  font-size:11px;
  color:#64748b;
  line-height:1.2;
  margin-bottom:4px;
}
.summary-value{
  font-size:16px;
  font-weight:700;
  color:#0f172a;
  line-height:1.2;
}
.status-chip{
  color:#1e40af;
}

/* Footer 工具列（匯入/匯出） */
.footer-bar{
  position:fixed;
  left:0;
  right:0;
  bottom:0;
  background:#fff;
  border-top:1px solid var(--border);
  box-shadow:0 -6px 30px rgba(0,0,0,.07);
  min-height:56px;
  display:flex;
  align-items:center;
  padding:10px 16px;
  gap:12px;
  z-index:50;
  font-size:14px;
  line-height:1.4;
}
.footer-bar .left-info .tagline{
  font-size:13px;
  color:#64748b;
  line-height:1.3;
}
.footer-actions{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}

/* Toast */
.toast{
  position:fixed;
  right:16px;
  bottom:72px; /* 避免被 footer 蓋住 */
  background:#111827;
  color:#fff;
  padding:10px 12px;
  border-radius:10px;
  opacity:.95;
  font-size:13px;
  line-height:1.3;
  z-index:70;
}

/* 手機版側欄：抽屜 */
@media (max-width:1024px){
  .km-grid{
    grid-template-columns:1fr;
  }

  .km-side{
    position:fixed;
    inset:0 auto 0 0;
    width:82%;
    max-width:340px;
    z-index:40;
    transform:translateX(-100%);
    transition:.2s;
    box-shadow:8px 0 24px rgba(0,0,0,.2);
  }
  .km-side.open{
    transform:translateX(0);
  }

  .only-mobile{
    display:inline-flex;
  }

  .side-list{
    max-height:none;
  }
}
</style>
