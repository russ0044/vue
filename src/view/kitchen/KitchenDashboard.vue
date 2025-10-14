<template>
  <!-- 命名空間 km-，避免影響整站主功能欄樣式 -->
  <section class="km-page">
    <!-- 頁頭 -->
    <header class="km-header">
      <div class="title">中央廚房</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
      <label class="btn ghost small file-btn">
        匯入 JSON
        <input type="file" accept="application/json" @change="importJSON">
      </label>
      <button class="btn" @click="goHome">回到主頁</button>
    </header>

    <!-- 分頁 -->
    <div class="km-tabs">
      <button :class="['tab', tab==='requests' && 'active']" @click="switchTab('requests')">請貨處理</button>
      <button :class="['tab', tab==='orders'   && 'active']" @click="switchTab('orders')">中央廚房訂單</button>
      <button :class="['tab', tab==='records'  && 'active']" @click="switchTab('records')">中央廚房訂單記錄</button>
      <div class="spacer"></div>

      <!-- 來源切換：local / firebase，未來接 API 直接改這裡 -->
      <div class="ds">
        <label class="muted small">資料來源</label>
        <select v-model="dataSource.mode" class="input sm" @change="onModeChanged">
          <option value="local">Local（假資料）</option>
          <option value="firebase">Firebase（預留）</option>
        </select>
      </div>
    </div>

    <!-- 兩欄：左清單 + 右內容 -->
    <div class="km-grid">
      <!-- 左欄（手機為抽屜） -->
      <aside class="km-side" :class="{open: drawerOpen}">
        <div class="side-head">
          <div class="row">
            <label class="muted">門市</label>
            <select v-model="selectedStoreId" class="input grow" @change="persistFilter">
              <option value="">全部</option>
              <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="row">
            <label class="muted">日期</label>
            <input type="date" class="input" v-model="dateStr" @change="persistFilter">
          </div>

          <!-- 篩選 chips（requests & orders 共用） -->
          <div class="chips" v-if="tab!=='records'">
            <button
              v-for="tg in tags"
              :key="tg"
              class="chip"
              :class="{on: tagFilter.has(tg)}"
              @click="toggleTag(tg)"
            >#{{ tg }}</button>
          </div>

          <!-- 生成：在 Orders 分頁 -->
          <div v-if="tab==='orders'" class="row gap">
            <button class="btn primary w-full" @click="generateTodayOrder">＋ 生成今日訂單</button>
          </div>
        </div>

        <!-- 左欄清單：請貨 -->
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
          <p v-if="!filteredRequests.length" class="muted center">沒有請貨單</p>
        </div>

        <!-- 左欄清單：訂單 -->
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
          <p v-if="!filteredOrders.length" class="muted center">沒有訂單</p>
        </div>

        <!-- 左欄清單：記錄 -->
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
          <p v-if="!filteredRecords.length" class="muted center">沒有訂單記錄</p>
        </div>
      </aside>

      <!-- 手機遮罩 -->
      <transition name="fade"><div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false"></div></transition>

      <!-- 右欄 -->
      <main class="km-main card">
        <div class="main-head">
          <div class="left">
            <button class="icon-btn only-mobile" title="清單" @click="drawerOpen=true">☰</button>
            <div class="title" v-if="tab==='requests'">請貨處理</div>
            <div class="title" v-else-if="tab==='orders'">中央廚房訂單</div>
            <div class="title" v-else>中央廚房訂單記錄</div>
          </div>
          <div class="spacer"></div>

          <div class="row gap" v-if="tab==='requests' && currentRequest">
            <button class="btn" @click="applyAllReady" :disabled="!currentRequest.items.length">全部就緒</button>
            <button class="btn primary" @click="approveRequest">接收並建立訂單</button>
          </div>
          <div class="row gap" v-else-if="tab==='orders' && currentOrder">
            <button class="btn" @click="recalc(currentOrder)">重算</button>
            <button class="btn primary" @click="closeOrder">完成並存檔</button>
          </div>
        </div>

        <!-- 右欄內容：請貨 -->
        <template v-if="tab==='requests'">
          <div v-if="!currentRequest" class="km-empty">
            <div class="ico">📄</div><div class="muted">請從左側選擇請貨單</div>
          </div>
          <div v-else class="paper">
            <div class="paper-head">
              <div>門市：{{ storeName(currentRequest.storeId) }}</div>
              <div>日期：{{ currentRequest.date }}</div>
            </div>

            <div class="section" v-for="group in groupedReq" :key="group.name">
              <div class="sec-title">{{ group.name }}</div>
              <div class="table">
                <div class="th">
                  <div class="w200">品名</div>
                  <div class="w90">單位</div>
                  <div class="w120">請貨數</div>
                  <div class="w120">就緒數</div>
                  <div class="grow">備註</div>
                </div>
                <div class="tr" v-for="it in group.rows" :key="it.key">
                  <div class="w200">{{ it.name }}</div>
                  <div class="w90">{{ it.unit }}</div>
                  <div class="w120">{{ it.qty }}</div>
                  <div class="w120">
                    <input type="number" class="input" min="0" v-model.number="it.ready" @change="saveDB">
                  </div>
                  <div class="grow">
                    <input class="input" v-model.trim="it.note" placeholder="備註…" @change="saveDB">
                  </div>
                </div>
              </div>
            </div>

            <div class="row justify-end">
              <label class="chk">
                <input type="checkbox" v-model="currentRequest.allowPartial" @change="saveDB"><span></span>
              </label>
              <span class="muted">允許部分出貨</span>
            </div>
          </div>
        </template>

        <!-- 右欄內容：訂單 -->
        <template v-else-if="tab==='orders'">
          <div v-if="!currentOrder" class="km-empty">
            <div class="ico">📄</div><div class="muted">請從左側選擇訂單或點擊「生成今日訂單」</div>
          </div>
          <div v-else class="paper">
            <div class="paper-head">
              <div>門市：{{ storeName(currentOrder.storeId) }}</div>
              <div>日期：{{ currentOrder.date }}</div>
            </div>

            <div class="section" v-for="group in groupedOrd" :key="group.name">
              <div class="sec-title">{{ group.name }}</div>
              <div class="table">
                <div class="th">
                  <div class="w200">品名</div>
                  <div class="w90">單位</div>
                  <div class="w120">數量</div>
                  <div class="grow">備註</div>
                </div>
                <div class="tr" v-for="it in group.rows" :key="it.key">
                  <div class="w200">{{ it.name }}</div>
                  <div class="w90">{{ it.unit }}</div>
                  <div class="w120">
                    <input type="number" class="input" min="0" v-model.number="it.qty" @change="saveDB">
                  </div>
                  <div class="grow">
                    <input class="input" v-model.trim="it.note" @change="saveDB" placeholder="備註…">
                  </div>
                </div>
              </div>
            </div>

            <div class="row justify-end">
              <button class="btn ghost small" @click="duplicateToOtherStores">複製到其他門市</button>
            </div>
          </div>
        </template>

        <!-- 右欄內容：記錄 -->
        <template v-else>
          <div v-if="!currentRecord" class="km-empty">
            <div class="ico">📄</div><div class="muted">請從左側選擇記錄</div>
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
                <div class="tr" v-for="it in currentRecord.items" :key="it.key">
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

    <transition name="fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

/* 小工具 */
const router = useRouter()
const toast = ref('')
const tip = (m)=>{ toast.value=m; setTimeout(()=>toast.value='',1200) }
const todayStr = ()=> new Date().toISOString().slice(0,10)
const rid = ()=> 'id-' + Math.random().toString(36).slice(2,10)

/* 顯示 */
const statusText = (s)=> s==='pending'?'待處理': s==='partial'?'部分就緒':'完成'

/* 資料來源（可切換到 Firebase） */
const dataSource = reactive({
  mode: localStorage.getItem('km-mode') || 'local',
  async fetchAll(){ loadDB() },
  async saveAll(){ saveDB() }
})
function onModeChanged(){ localStorage.setItem('km-mode', dataSource.mode); tip('已切換來源（示意）') }

/* Local DB（假資料） */
const db = reactive({ stores:[], requests:[], orders:[], records:[] })
function saveDB(){ localStorage.setItem('kitchen-db', JSON.stringify(db)) }
function loadDB(){
  const raw = localStorage.getItem('kitchen-db')
  if (raw){ Object.assign(db, JSON.parse(raw)); return }
  db.stores = [
    { id:'s1', name:'某某餐飲-1號' },
    { id:'s2', name:'某某餐飲-2號' },
    { id:'s3', name:'某某餐飲-3號' },
  ]
  db.requests = [ sampleRequest('s1', todayStr()), sampleRequest('s2', todayStr()), sampleRequest('s3', todayStr()) ]
  db.orders = []
  db.records = [{
    id: rid(), storeId:'s1', date: todayStr(),
    summary:'昨日出貨：熟食 3 項、雜項 2 項，合計 5 項',
    items: [
      { key:rid(), name:'新鮮雞腿', unit:'份', qty:50, note:'' },
      { key:rid(), name:'新鮮豬腿', unit:'公斤', qty:40, note:'' },
    ]
  }]
  saveDB()
}
function sampleRequest(storeId, date){
  return {
    id: rid(), storeId, date, status:'pending', allowPartial:false,
    items:[
      { key:rid(), cat:'熟食區', name:'新鮮雞腿', unit:'份', qty:50, ready:0, note:'' },
      { key:rid(), cat:'熟食區', name:'新鮮豬腿', unit:'公斤', qty:40, ready:0, note:'' },
      { key:rid(), cat:'熟食區', name:'新鮮牛腱', unit:'公斤', qty:20, ready:0, note:'' },
      { key:rid(), cat:'熟食區', name:'新鮮雞翅', unit:'份', qty:15, ready:0, note:'' },
      { key:rid(), cat:'雜項區', name:'豬骨高湯', unit:'桶', qty:2, ready:0, note:'' },
      { key:rid(), cat:'雜項區', name:'米漿醬油', unit:'瓶', qty:1, ready:0, note:'' },
    ]
  }
}

/* UI 狀態 */
const tab = ref('requests')   // requests | orders | records
const drawerOpen = ref(false)
function switchTab(t){ tab.value=t; drawerOpen.value=false; selectedId.value=null }

/* 篩選 */
const stores = ref([])
const selectedStoreId = ref(localStorage.getItem('km-store') || '')
const dateStr = ref(localStorage.getItem('km-date') || todayStr())
const tags = ['熟食區','雜項區']
const tagFilter = reactive(new Set())
function toggleTag(t){ tagFilter.has(t)?tagFilter.delete(t):tagFilter.add(t) }
function persistFilter(){
  localStorage.setItem('km-store', selectedStoreId.value)
  localStorage.setItem('km-date', dateStr.value)
}
const storeName = (id)=> stores.value.find(s=>s.id===id)?.name || '—'

/* 左欄選取 */
const selectedId = ref(null)
function selectLeft(id){ selectedId.value = id; drawerOpen.value=false }

/* 清單 */
const filteredRequests = computed(()=>{
  return db.requests
    .filter(r => !selectedStoreId.value || r.storeId===selectedStoreId.value)
    .filter(r => r.date===dateStr.value)
    .filter(r => !tagFilter.size || r.items.some(it=>tagFilter.has(it.cat)))
    .sort((a,b)=> (a.storeId>b.storeId?1:-1))
})
const filteredOrders = computed(()=>{
  return db.orders
    .filter(o => !selectedStoreId.value || o.storeId===selectedStoreId.value)
    .filter(o => o.date===dateStr.value)
    .filter(o => !tagFilter.size || o.items.some(it=>tagFilter.has(it.cat)))
    .sort((a,b)=> (a.storeId>b.storeId?1:-1))
})
const filteredRecords = computed(()=>{
  return db.records
    .filter(r => !selectedStoreId.value || r.storeId===selectedStoreId.value)
    .filter(r => !dateStr.value || r.date<=dateStr.value)
    .sort((a,b)=> (a.date>b.date?-1:1))
})

/* 當前選取 */
const currentRequest = computed(()=> db.requests.find(r=>r.id===selectedId.value) || null)
const currentOrder   = computed(()=> db.orders.find(o=>o.id===selectedId.value) || null)
const currentRecord  = computed(()=> db.records.find(r=>r.id===selectedId.value) || null)

/* 群組顯示 */
const groupedReq = computed(()=>{
  if (!currentRequest.value) return []
  const g = {}
  currentRequest.value.items.forEach(it=>{ (g[it.cat] ||= []).push(it) })
  return Object.keys(g).map(k=>({ name:k, rows:g[k] }))
})
const groupedOrd = computed(()=>{
  if (!currentOrder.value) return []
  const g = {}
  currentOrder.value.items.forEach(it=>{ (g[it.cat] ||= []).push(it) })
  return Object.keys(g).map(k=>({ name:k, rows:g[k] }))
})

/* 請貨動作 */
function applyAllReady(){
  if (!currentRequest.value) return
  currentRequest.value.items.forEach(it => it.ready = it.qty)
  tip('已全部就緒'); saveDB()
}
function approveRequest(){
  const r = currentRequest.value; if (!r) return
  if (!r.allowPartial && r.items.some(it=> (it.ready || 0) < it.qty)){
    return tip('尚未全部就緒（或勾選允許部分出貨）')
  }
  const ord = {
    id: rid(), storeId:r.storeId, date:r.date,
    items: r.items.map(it => ({
      key:rid(), cat:it.cat, name:it.name, unit:it.unit,
      qty: it.ready || 0, note: it.note || ''
    }))
  }
  db.orders.unshift(ord)
  r.status = r.items.every(it=>(it.ready||0)>=it.qty) ? 'done' : 'partial'
  selectedId.value = ord.id
  saveDB(); tip('已接收並建立訂單')
}

/* 訂單動作 */
function generateTodayOrder(){
  const sid = selectedStoreId.value || db.stores[0]?.id
  const date = dateStr.value || todayStr()
  const exists = db.orders.some(o=>o.storeId===sid && o.date===date)
  if (exists){ return tip('今日此門市已有訂單') }
  const base = sampleRequest(sid, date)
  const ord = {
    id: rid(), storeId:sid, date,
    items: base.items.map(it=>({ key:rid(), cat:it.cat, name:it.name, unit:it.unit, qty:Math.ceil(it.qty*0.6), note:'' }))
  }
  db.orders.unshift(ord); selectedId.value = ord.id; saveDB()
  tip('已生成今日訂單（AI 建議示意）')
}
function recalc(order){
  order.items.forEach(it=> it.qty = Math.max(0, Math.round(+it.qty || 0)))
  saveDB(); tip('已重算')
}
function closeOrder(){
  const o = currentOrder.value; if (!o) return
  db.records.unshift({
    id: rid(), storeId:o.storeId, date:o.date,
    summary:`完成出貨：${o.items.length} 項`,
    items: o.items.map(it=>({ ...it }))
  })
  db.orders = db.orders.filter(x=>x.id!==o.id)
  selectedId.value = null
  saveDB(); tip('已完成並存檔')
}
function duplicateToOtherStores(){
  const o = currentOrder.value; if (!o) return
  db.stores.filter(s=>s.id!==o.storeId).forEach(s=>{
    db.orders.unshift({
      id: rid(), storeId:s.id, date:o.date,
      items: o.items.map(it=>({ ...it, key:rid() }))
    })
  })
  saveDB(); tip('已複製到其他門市')
}

/* 匯入/匯出 & 導回 */
function exportJSON(){
  const blob = new Blob([JSON.stringify(db, null, 2)], { type:'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'kitchen.json'; a.click()
  URL.revokeObjectURL(url)
}
function importJSON(e){
  const f = e.target.files?.[0]; if(!f) return
  const reader = new FileReader()
  reader.onload = ()=>{
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj.stores || !obj.requests || !obj.orders || !obj.records) throw new Error()
      Object.assign(db, obj); saveDB(); tip('已匯入資料')
    }catch{ tip('匯入失敗：格式錯誤') }
  }
  reader.readAsText(f,'utf-8')
}
function goHome(){ router.push({ name:'boss-inventory' }) }

/* 掛載 */
onMounted(async()=>{
  await dataSource.fetchAll()
  stores.value = db.stores
})
</script>

<style scoped>
:root{ --bg:#f6f8fc; --card:#fff; --border:#e6eaf2; --text:#0f172a; --muted:#64748b; --accent:#2563eb }
.km-page{ padding:16px; background:var(--bg); min-height:100vh }
.km-header{ display:flex; align-items:center; gap:8px; margin-bottom:8px }
.title{ font-size:20px; font-weight:800 }
.spacer{ flex:1 }

/* tabs */
.km-tabs{ display:flex; align-items:center; gap:8px; margin-bottom:12px }
.tab{ border:1px solid var(--border); background:#fff; border-radius:10px; padding:8px 12px; cursor:pointer }
.tab.active{ background:#e6f4ff; border-color:#cfe9ff }
.ds{ display:flex; align-items:center; gap:6px }
.input{ border:1px solid var(--border); border-radius:10px; padding:8px 10px; outline:none; background:#fff }
.input.sm{ padding:6px 8px }
.input:focus{ border-color:#9ec5ff; box-shadow:0 0 0 3px rgba(99,162,255,.15) }
.btn{ border:1px solid #cfe0ff; background:#fff; color:#2563eb; border-radius:10px; padding:8px 12px; cursor:pointer }
.btn.primary{ background:#2563eb; border-color:#2563eb; color:#fff }
.btn.ghost{ border-color:var(--border); color:#334155;background:#fff }
.btn.small{ padding:6px 10px }
.file-btn{ position:relative; overflow:hidden }
.file-btn input{ position:absolute; inset:0; opacity:0; cursor:pointer }

/* 二欄 */
.km-grid{ display:grid; grid-template-columns:320px 1fr; gap:12px }
.km-side{ background:#fff; border:1px solid var(--border); border-radius:16px; overflow:hidden; position:relative }
.side-head{ padding:12px; border-bottom:1px solid #f0f3f8 }
.row{ display:flex; align-items:center; gap:8px }
.row.gap{ gap:8px }
.chips{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8px }
.chip{ border:1px solid var(--border); border-radius:999px; background:#fff; padding:6px 10px; cursor:pointer }
.chip.on{ background:#eef2ff; border-color:#c7d2fe }
.side-list{ max-height:calc(100vh - 280px); overflow:auto; padding:10px }
.side-item{ display:flex; gap:10px; align-items:center; border:1px solid var(--border); border-radius:10px; padding:8px; margin-bottom:8px; cursor:pointer; background:#fff }
.side-item.active{ outline:2px solid #9ec5ff }
.name{ font-weight:700 }
.badge{ border:1px solid var(--border); border-radius:999px; padding:2px 8px; font-size:12px; color:#475569 }
.badge.primary{ border-color:#cde; color:#2563eb }
.badge.done{ color:#166534; border-color:#bbf7d0; background:#f0fdf4 }
.badge.pending{ color:#92400e; border-color:#fde68a; background:#fffbeb }
.badge.partial{ color:#1f2937; border-color:#ddd; background:#fafafa }

/* 右欄 */
.card{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:12px }
.km-main .main-head{ display:flex; align-items:center; gap:8px; margin-bottom:8px }
.icon-btn{ border:none; background:transparent; cursor:pointer; font-size:18px; opacity:.85 }
.only-mobile{ display:none }

/* 單據紙樣式 */
.paper{ background:#fff; border:1px solid var(--border); border-radius:12px; }
.paper-head{ display:flex; justify-content:space-between; padding:10px 12px; border-bottom:1px dashed var(--border) }
.section{ padding:12px }
.sec-title{ font-weight:800; margin-bottom:8px }
.table{ border:1px solid var(--border); border-radius:10px; overflow:hidden }
.th,.tr{ display:flex; gap:10px; align-items:center; border-bottom:1px solid #f1f5f9; padding:8px 10px }
.th{ background:#fafcff; font-weight:600 }
.tr:last-child{ border-bottom:none }
.w200{ width:200px } .w120{ width:120px } .w90{ width:90px } .grow{ flex:1 }
.justify-end{ justify-content:flex-end }
.chk{ display:inline-flex; align-items:center }
.chk input{ display:none } .chk span{ width:18px;height:18px;border:1px solid #cbd5e1;border-radius:4px;display:inline-block;position:relative }
.chk input:checked + span::after{ content:'';position:absolute;inset:3px;background:#2563eb;border-radius:2px }

/* 空狀態 */
.km-empty{ border:1px dashed var(--border); border-radius:12px; padding:40px; text-align:center }
.km-empty .ico{ font-size:28px; margin-bottom:8px }
.muted{ color:#64748b } .center{ text-align:center }

/* 抽屜（手機） */
.backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.25); z-index:30 }
@media (max-width:1024px){
  .km-grid{ grid-template-columns:1fr }
  .km-side{ position:fixed; inset:0 auto 0 0; width:82%; max-width:340px; z-index:40; transform:translateX(-100%); transition:.2s }
  .km-side.open{ transform:translateX(0) }
  .only-mobile{ display:inline-flex }
  .side-list{ max-height:none }
}
.toast{ position:fixed; right:16px; bottom:16px; background:#111827; color:#fff; padding:10px 12px; border-radius:10px; opacity:.95; z-index:70 }
</style>
