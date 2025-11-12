<template>
  <section class="delivery-page">
    <!-- 頁首工具列 -->
    <header class="top-bar card">
      <div class="left">
        <div class="title">配送情況</div>

        <div class="filters">
          <div class="filter-block">
            <label class="label">日期</label>
            <input class="input sm" type="date" v-model="dateStr">
          </div>

          <div class="filter-block">
            <label class="label">狀態</label>
            <div class="seg">
              <button :class="['segbtn', status==='all' && 'active']" @click="status='all'">全部</button>
              <button :class="['segbtn', status==='preparing' && 'active']" @click="status='preparing'">準備中</button>
              <button :class="['segbtn', status==='shipping' && 'active']" @click="status='shipping'">運送中</button>
              <button :class="['segbtn', status==='arrived' && 'active']" @click="status='arrived'">已到店</button>
            </div>
          </div>
        </div>
      </div>

      <div class="spacer"></div>

      <!-- 資料來源 / 匯入匯出 -->
      <div class="right">
        <div class="data-src">
          <label class="label small muted">來源</label>
          <select v-model="runtimeMode" class="input sm" @change="onModeChanged">
            <option value="local">Local（假資料）</option>
            <option value="firebase">Firebase（預留）</option>
          </select>
        </div>

        <button class="btn ghost small" @click="exportJSON">匯出</button>
        <label class="btn ghost small file-btn">
          匯入
          <input type="file" accept="application/json" @change="importJSON">
        </label>
      </div>
    </header>

    <!-- 主體：左右兩欄 -->
    <div class="layout">
      <!-- 左邊清單 -->
      <aside class="side card" :class="{open:drawerOpen}">
        <div class="side-head">
          <div class="side-head-row">
            <div class="label muted small">門市</div>
            <div class="store-name">{{ currentStoreName }}</div>
          </div>
        </div>

        <div class="side-list">
          <div
            class="side-item"
            v-for="d in filteredList"
            :key="d.id"
            :class="{active:d.id===selectedId}"
            @click="selectLeft(d.id)"
          >
            <div class="grow">
              <div class="order-no">{{ d.no }}</div>
              <div class="muted tiny">{{ d.date }}｜{{ d.items.length }} 項</div>
            </div>

            <div class="badge" :class="statusClass(d.status)">
              {{ statusText(d.status) }}
            </div>
          </div>

          <p v-if="!filteredList.length" class="muted center empty-hint">
            沒有符合的配送單
          </p>
        </div>
      </aside>

      <transition name="fade">
        <div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false" />
      </transition>

      <!-- 右邊詳細內容 -->
      <main class="detail card">
        <div class="main-head">
          <div class="left">
            <div class="view-title">配送單詳情</div>

            <div v-if="cur" class="mini-stats">
              <div class="mini-box">
                <div class="mini-label">狀態</div>
                <div class="mini-value" :class="statusClass(cur.status)">
                  {{ statusText(cur.status) }}
                </div>
              </div>
              <div class="mini-box">
                <div class="mini-label">品項數</div>
                <div class="mini-value">{{ cur.items.length }}</div>
              </div>
            </div>
          </div>

          <div class="spacer"></div>

          <button
            class="btn primary small"
            :disabled="!cur || cur.status === 'arrived'"
            @click="nextStage"
          >
            狀態前進
          </button>

          <button class="btn ghost small only-mobile" @click="drawerOpen = true">清單</button>
        </div>

        <div v-if="!cur" class="empty-block">
          <div class="ico">🚚</div>
          <div class="muted">請從左側選擇一筆配送單</div>
        </div>

        <div v-else class="paper">
          <div class="paper-head">
            <div>門市：{{ currentStoreName }}</div>
            <div>日期：{{ cur.date }}</div>
          </div>

          <div class="section">
            <div class="section-line">
              <div class="section-label">配送單號</div>
              <div class="section-value strong">{{ cur.no }}</div>
            </div>
            <div class="section-line">
              <div class="section-label">狀態</div>
              <div class="section-value">
                <span class="badge" :class="statusClass(cur.status)">{{ statusText(cur.status) }}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="sec-title">配送內容</div>
            <div class="table">
              <div class="th">
                <div class="col-name">品名</div>
                <div class="col-unit">單位</div>
                <div class="col-qty">數量</div>
              </div>
              <div class="tr" v-for="it in cur.items" :key="it.key">
                <div class="col-name">{{ it.name }}</div>
                <div class="col-unit">{{ it.unit }}</div>
                <div class="col-qty">{{ it.qty }}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="sec-title">備註</div>
            <div class="note-block muted">{{ cur.note || '—' }}</div>
          </div>
        </div>
      </main>
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick, watch } from 'vue'
import { useScope } from '@/store/scope'
import * as datasource from '@/store/datasource'
import seed from '@/seed/seedData'

/* ---------- 小工具 ---------- */
const scope = useScope()
const toast = ref('')
const tip = (m)=>{ toast.value=m; setTimeout(()=>toast.value='',1400) }
const todayStr = () => new Date().toISOString().slice(0,10)
const nextId = () => 'dl-' + Math.random().toString(36).slice(2,10)

/* ---------- 資料來源模式（與全域同步） ---------- */
function readRuntimeMode(){
  const fromDS = (datasource.getMode?.() || '').toLowerCase()
  if (fromDS === 'firebase' || fromDS === 'mock') {
    return fromDS === 'mock' ? 'local' : 'firebase'
  }
  return localStorage.getItem('runtime-mode') || 'local'
}
function writeRuntimeMode(v){
  if (datasource.setMode) {
    datasource.setMode(v === 'local' ? 'mock' : 'firebase')
  }
  localStorage.setItem('runtime-mode', v)
}
const runtimeMode = ref(readRuntimeMode())

/* ---------- In-memory DB ---------- */
const db = reactive({ deliveries: [] })

async function fetchAll(){
  if (runtimeMode.value === 'firebase') {
    await fetchAllFromFirebase()
  } else {
    loadLocal()
  }
}

/** 從 local / seed 載入（支援 deliveries | empDeliveries | delivery.schedule） */
function loadLocal(){
  // 1) 讀 localStorage（只有在有資料時才採用）
  const raw = localStorage.getItem('delivery-db')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.deliveries) && parsed.deliveries.length > 0) {
        db.deliveries = parsed.deliveries
        return
      }
    } catch { console.warn('[delivery-db] parse error, fallback to seed') }
  }

  // 2) 用 seed 回填
  const s = seed() || {}
  let list = []

  if (Array.isArray(s.deliveries) && s.deliveries.length) {
    list = s.deliveries
  } else if (Array.isArray(s.empDeliveries) && s.empDeliveries.length) {
    list = s.empDeliveries.map(x => ({
      id: x.id || nextId(),
      storeId: x.storeId,
      date: x.date,
      no: x.no || x.id || ('DL-' + Math.floor(Math.random()*900+100)),
      status: x.status || 'preparing',
      note: x.note || '',
      items: (x.items || []).map(it => ({
        key: it.key || nextId(),
        name: it.name, unit: it.unit, qty: it.qty
      })),
    }))
  } else if (Array.isArray(s.delivery?.schedule) && s.delivery.schedule.length) {
    list = s.delivery.schedule.flatMap(sch =>
      (sch.stops || []).map(stop => ({
        id: nextId(),
        storeId: stop.storeId,
        date: sch.date,
        no: sch.id || `DL-${Math.floor(Math.random()*900+100)}`,
        status: 'preparing',
        note: `${sch.routeName || ''} ${sch.vehicle || ''} ETA:${stop.eta || ''}`.trim(),
        items: [], // 只知道車次/站點，先無明細
      }))
    )
  }

  // 3) 若仍無資料，為目前門市生成一筆示例
  if (!list.length) {
    list = [{
      id: nextId(),
      storeId: scope.storeId,
      date: todayStr(),
      no: 'DL-' + Math.floor(Math.random()*900+100),
      status: 'preparing',
      note: '示例配送單',
      items: [
        { key: nextId(), name: '去骨雞腿（真空包，生）', unit: '包', qty: 30 },
        { key: nextId(), name: '雞高湯基底',             unit: '桶', qty: 2 },
      ],
    }]
  }

  db.deliveries = list
  saveLocal()
}

function saveLocal(){
  localStorage.setItem('delivery-db', JSON.stringify({ deliveries: db.deliveries }))
}

async function fetchAllFromFirebase(){
  // TODO: 串 Firestore（依專案實作）
  // 目前先沿用本地資料
  loadLocal()
}
async function saveAllToFirebase(){
  // TODO: 寫回 Firestore
  saveLocal()
}
function onModeChanged(){
  writeRuntimeMode(runtimeMode.value)
  tip('資料來源已切換')
  fetchAll().then(adjustDateAndSelection)
}

/* ---------- 畫面狀態 ---------- */
const drawerOpen = ref(false)
const dateStr = ref(todayStr())
const status = ref('all')
const selectedId = ref(null)

/* 門市名稱（顯示用） */
const currentStoreName = computed(()=>{
  if (scope.storeName) return scope.storeName
  if (Array.isArray(scope.stores) && scope.stores.length){
    const found = scope.stores.find(s => s.id === scope.storeId)
    return found ? found.name : (scope.storeId || '—')
  }
  return scope.storeId || '—'
})

/* 清單（依日期/狀態/門市） */
const filteredList = computed(()=>{
  return db.deliveries
    .filter(d => !scope.storeId || d.storeId === scope.storeId)
    .filter(d => !dateStr.value || d.date === dateStr.value)
    .filter(d => status.value === 'all' ? true : d.status === status.value)
    .sort((a,b)=> String(a.no).localeCompare(String(b.no)))
})

/* 目前選中的配送單 */
const cur = computed(()=> db.deliveries.find(d => d.id === selectedId.value) || null)

function selectLeft(id){
  selectedId.value = id
  drawerOpen.value = false
}

/* 狀態推進 */
function nextStage(){
  if (!cur.value) return
  if (cur.value.status === 'preparing') cur.value.status = 'shipping'
  else if (cur.value.status === 'shipping') cur.value.status = 'arrived'
  persist()
  tip('狀態已更新')
}

function persist(){
  if (runtimeMode.value === 'firebase') saveAllToFirebase()
  else saveLocal()
}

/* 匯出 / 匯入 */
function exportJSON(){
  const blob = new Blob([JSON.stringify(db, null, 2)], { type:'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `delivery-${scope.storeId || 'all'}.json`
  a.click()
  URL.revokeObjectURL(url)
  tip('已匯出')
}
function importJSON(e){
  const f = e.target.files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = ()=>{
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj || !Array.isArray(obj.deliveries)) throw new Error()
      db.deliveries = obj.deliveries
      persist()
      tip('已匯入')
      nextTick(()=>adjustDateAndSelection())
    }catch{
      tip('匯入失敗：格式錯誤')
    }
  }
  reader.readAsText(f, 'utf-8')
}

/* 狀態顯示 */
function statusText(s){
  if (s === 'preparing') return '準備中'
  if (s === 'shipping')  return '運送中'
  if (s === 'arrived')   return '已到店'
  return s || '—'
}
function statusClass(s){
  if (s === 'preparing') return 'badge-preparing'
  if (s === 'shipping')  return 'badge-shipping'
  if (s === 'arrived')   return 'badge-arrived'
  return ''
}

/* 依目前門市自動挑選有資料的日期與第一筆單據 */
function adjustDateAndSelection(){
  const forStore = db.deliveries.filter(d => !scope.storeId || d.storeId === scope.storeId)
  const dates = Array.from(new Set(forStore.map(d => d.date))).sort()
  if (dates.length && !dates.includes(dateStr.value)) {
    dateStr.value = dates[0]
  }
  if (!selectedId.value && filteredList.value.length){
    selectedId.value = filteredList.value[0].id
  }
}

onMounted(async ()=>{
  await fetchAll()
  adjustDateAndSelection()

  // 若仍無任何可見資料，生成一筆當日示例（避免空畫面）
  if (!filteredList.value.length) {
    const demo = {
      id: nextId(),
      storeId: scope.storeId,
      date: todayStr(),
      no: 'DL-' + Math.floor(Math.random()*900+100),
      status: 'preparing',
      note: '示例配送單',
      items: [
        { key: nextId(), name: '去骨雞腿（真空包，生）', unit: '包', qty: 24 },
        { key: nextId(), name: '雞高湯基底', unit: '桶', qty: 4 },
      ],
    }
    db.deliveries.push(demo)
    persist()
    dateStr.value = demo.date
    selectedId.value = demo.id
  }
})

/* 切換門市時（如果你的 useScope 會動態變更），自動刷新選取 */
watch(() => scope.storeId, () => {
  nextTick(() => adjustDateAndSelection())
})
</script>

<style scoped>
/* 這支樣式全面使用「全域主題變數」 */
.delivery-page{
  min-height:100vh;
  background:var(--bg-page);
  padding:16px;
  display:flex;
  flex-direction:column;
  gap:12px;
  box-sizing:border-box;
  color:var(--text-main);
}

/* 頂部工具列 -------------------------------------------------- */
.top-bar{
  display:flex;
  align-items:flex-start;
  flex-wrap:wrap;
  gap:12px;
  padding:12px 16px;
}
.top-bar .left{ min-width:0; }
.title{ font-size:18px; font-weight:700; line-height:1.3; margin-bottom:8px; color:var(--text-main); }
.filters{ display:flex; flex-wrap:wrap; gap:16px; }
.filter-block{ display:flex; flex-direction:column; gap:6px; min-width:max-content; }
.label{ font-size:12px; line-height:1.2; color:var(--text-sub); }
.data-src{ display:flex; flex-direction:column; gap:6px; min-width:max-content; }

.right{ display:flex; align-items:flex-end; flex-wrap:wrap; gap:8px; }
.spacer{ flex:1 }

/* Layout 兩欄 -------------------------------------------------- */
.layout{
  display:grid;
  grid-template-columns:320px 1fr;
  gap:12px;
  min-height:calc(100vh - 140px);
}

/* 卡片共用樣式 -------------------------------------------------- */
.card{
  background:var(--bg-card);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 8px 24px rgba(0,0,0,.04);
  min-width:0;
}

/* 左欄 -------------------------------------------------- */
.side{ position:relative; overflow:hidden; display:flex; flex-direction:column; }
.side-head{ border-bottom:1px solid var(--border); padding:12px 16px; }
.side-head-row{ display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap; }
.store-name{ font-size:14px; font-weight:600; color:var(--text-main); }
.side-list{ flex:1; overflow:auto; padding:12px; max-height:calc(100vh - 240px); }
.side-item{
  display:flex; align-items:flex-start; gap:10px;
  border:1px solid var(--border); border-radius:12px; background:var(--bg-card);
  padding:10px 12px; margin-bottom:8px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.03);
}
.side-item.active{ outline:2px solid rgba(37,99,235,.35); background:linear-gradient(to bottom right, rgba(37,99,235,.06), transparent 60%); }
.grow{ flex:1; min-width:0; }
.order-no{ font-weight:700; color:var(--text-main); font-size:14px; line-height:1.3; }
.muted{ color:var(--text-sub); }
.small{ font-size:13px; line-height:1.3; }
.tiny { font-size:12px; line-height:1.2; }
.center{ text-align:center; }
.empty-hint{ font-size:13px; padding:20px 0 8px; }

/* 狀態 badge -------------------------------------------------- */
.badge{
  border-radius:999px; font-size:12px; line-height:1.2; padding:4px 8px;
  border:1px solid var(--border); align-self:flex-start; font-weight:500;
}
.badge-preparing{ background:#fffbeb; border-color:#fde68a; color:#92400e; }
.badge-shipping { background:#eff6ff; border-color:#bfdbfe; color:#1e40af; }
.badge-arrived  { background:#f0fdf4; border-color:#bbf7d0; color:#166534; }

/* 右欄 -------------------------------------------------- */
.detail{ display:flex; flex-direction:column; padding:12px 16px; }
.main-head{ display:flex; flex-wrap:wrap; align-items:flex-start; gap:12px; margin-bottom:12px; }
.view-title{ font-size:16px; font-weight:700; line-height:1.3; color:var(--text-main); margin-bottom:4px; }
.mini-stats{ display:flex; flex-wrap:wrap; gap:12px; }
.mini-box{
  background:var(--bg-card); border:1px solid var(--border); border-radius:10px;
  padding:8px 10px; min-width:90px; box-shadow:0 4px 12px rgba(0,0,0,.03);
}
.mini-label{ font-size:11px; line-height:1.2; color:var(--text-sub); margin-bottom:4px; }
.mini-value{ font-size:16px; font-weight:700; line-height:1.2; color:var(--text-main); }

.empty-block{
  border:1px dashed var(--border); border-radius:12px; padding:40px;
  text-align:center; background:var(--bg-card); color:var(--text-sub);
}
.empty-block .ico{ font-size:28px; margin-bottom:8px; line-height:1; }

/* 詳細紙本區 -------------------------------------------------- */
.paper{
  background:var(--bg-card);
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 4px 16px rgba(0,0,0,.04);
  overflow:hidden;
}
.paper-head{
  background:linear-gradient(to bottom, rgba(0,0,0,.02), transparent);
  border-bottom:1px dashed var(--border);
  padding:12px 16px;
  font-size:14px; color:var(--text-main);
  display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px;
}
.section{ padding:16px; border-bottom:1px solid rgba(0,0,0,.05); }
.section:last-child{ border-bottom:none; }
.section-line{ display:flex; flex-wrap:wrap; justify-content:space-between; line-height:1.4; font-size:14px; margin-bottom:8px; }
.section-label{ color:var(--text-sub); font-size:13px; }
.section-value{ color:var(--text-main); font-size:14px; font-weight:500; }
.section-value.strong{ font-weight:700; color:var(--text-main); }
.sec-title{ font-size:14px; font-weight:700; color:var(--text-main); margin-bottom:10px; }

/* 表格 -------------------------------------------------- */
.table{ border:1px solid var(--border); border-radius:10px; overflow:hidden; font-size:14px; }
.th,.tr{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid rgba(0,0,0,.06); }
.th{ background:linear-gradient(to bottom, rgba(0,0,0,.02), transparent); font-weight:600; color:var(--text-main); }
.tr:last-child{ border-bottom:none; }
.col-name{ flex:1; min-width:0; }
.col-unit{ width:120px; }
.col-qty{ width:120px; text-align:left; }

/* 備註 -------------------------------------------------- */
.note-block{ font-size:14px; line-height:1.4; word-break:break-word; white-space:pre-wrap; }

/* Segmented control -------------------------------------------------- */
.seg{ display:flex; flex-wrap:wrap; gap:4px; }
.segbtn{
  border:1px solid var(--border); background:var(--bg-card); border-radius:8px;
  padding:6px 10px; font-size:13px; line-height:1.2; cursor:pointer; color:var(--text-main);
}
.segbtn.active{
  background:rgba(37,99,235,.08);
  border-color:rgba(37,99,235,.25);
  color:#1e3a8a; font-weight:600;
}

/* 控制元件 -------------------------------------------------- */
.input{
  border:1px solid var(--border);
  border-radius:10px;
  padding:8px 10px;
  background:var(--bg-card);
  font-size:14px;
  line-height:1.2;
  color:var(--text-main);
  min-width:0; outline:none;
}
.input.sm{ padding:6px 8px; font-size:13px; }
.input:focus{
  border-color:rgba(37,99,235,.45);
  box-shadow:0 0 0 3px rgba(37,99,235,.15);
  outline:none;
}

.btn{
  border:1px solid var(--border);
  background:var(--bg-card);
  color:var(--text-main);
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:14px; line-height:1.2;
  white-space:nowrap;
}
.btn.primary{ background:#2563eb; border-color:#2563eb; color:#fff; }
.btn.ghost{ border-color:var(--border); color:var(--text-main); background:var(--bg-card); }
.btn.small{ padding:6px 10px; font-size:13px; }

.file-btn{ position:relative; overflow:hidden; }
.file-btn input{ position:absolute; inset:0; opacity:0; cursor:pointer; }

/* 手機 RWD：側欄抽屜 -------------------------------------------------- */
.backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.25); z-index:30; }
.only-mobile{ display:none; }

@media (max-width:1024px){
  .layout{ grid-template-columns:1fr; }
  .detail{ order:1; }
  .side{
    order:2; position:fixed; inset:0 auto 0 0; width:82%; max-width:340px;
    background:var(--bg-card); z-index:40; transform:translateX(-100%);
    transition:.2s; box-shadow:8px 0 24px rgba(0,0,0,.4);
  }
  .side.open{ transform:translateX(0); }
  .side-list{ max-height:none; }
  .only-mobile{ display:inline-flex; }
}

/* 動畫 / Toast -------------------------------------------------- */
.fade-enter-active,.fade-leave-active{ transition:opacity .18s ease; }
.fade-enter-from,.fade-leave-to{ opacity:0; }

.toast{
  position:fixed; right:16px; bottom:16px;
  background:#111827; color:#fff;
  padding:10px 12px; border-radius:10px; opacity:.95;
  font-size:13px; line-height:1.3; z-index:70;
}
</style>
