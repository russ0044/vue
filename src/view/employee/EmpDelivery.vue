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
              <button
                :class="['segbtn', status==='all' && 'active']"
                @click="status='all'"
              >全部</button>
              <button
                :class="['segbtn', status==='preparing' && 'active']"
                @click="status='preparing'"
              >準備中</button>
              <button
                :class="['segbtn', status==='shipping' && 'active']"
                @click="status='shipping'"
              >運送中</button>
              <button
                :class="['segbtn', status==='arrived' && 'active']"
                @click="status='arrived'"
              >已到店</button>
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
        <div
          v-if="drawerOpen"
          class="backdrop"
          @click="drawerOpen=false"
        />
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

          <button
            class="btn ghost small only-mobile"
            @click="drawerOpen = true"
          >
            清單
          </button>
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
                <span class="badge" :class="statusClass(cur.status)">
                  {{ statusText(cur.status) }}
                </span>
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

              <div
                class="tr"
                v-for="it in cur.items"
                :key="it.key"
              >
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
import { reactive, ref, computed, onMounted } from 'vue'
import { useScope } from '@/store/scope'   // 假設 scope 提供目前登入者的 storeId
import seed from '@/seed/seedData'        // 從全域假資料拿初始內容 (深拷貝)

// 工具
const scope = useScope()
const toast = ref('')
const tip = (m)=>{ toast.value=m; setTimeout(()=>toast.value='',1400) }
const todayStr = () => new Date().toISOString().slice(0,10)
const nextId = () => 'dl-' + Math.random().toString(36).slice(2,10)

// ===== 資料層：與全系統統一模式 =====
//
// runtimeMode：讀/寫 seedData.runtime.mode or localStorage('runtime-mode')
// deliveries：配送資料本體（所有門市都有，這頁會再用 storeId 過濾）
//
// local 模式：保存在 localStorage
// firebase 模式：預留位（不崩潰）
//
// 之後「系統設定」頁會更新 runtime.mode 並同步到 localStorage('runtime-mode') & Firestore。
// 這一頁只要跟著 runtimeMode 走。
//
const runtimeMode = ref(localStorage.getItem('runtime-mode') || 'local')

// DB in-memory
const db = reactive({
  deliveries: []
})

// 載入資料
async function fetchAll() {
  if (runtimeMode.value === 'firebase') {
    await fetchAllFromFirebase()
  } else {
    loadLocal()
  }
}

function loadLocal(){
  // 1. 從 localStorage 試著讀
  const raw = localStorage.getItem('delivery-db')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.deliveries)) {
        db.deliveries = parsed.deliveries
        return
      }
    } catch(e) {
      console.warn('[delivery-db] parse error, fallback to seed')
    }
  }

  // 2. 如果 localStorage 裡沒有就用 seedData 初始值
  const initial = seed()
  if (Array.isArray(initial.deliveries)) {
    db.deliveries = initial.deliveries
  } else {
    // 保底：生一筆示意單
    db.deliveries = [
      {
        id: nextId(),
        storeId: scope.storeId,
        date: todayStr(),
        no: 'DL-' + Math.floor(Math.random()*900+100),
        status: 'preparing',
        note: '',
        items: [
          { key: nextId(), name: '去骨雞腿（真空包）', unit: '包', qty: 30 },
          { key: nextId(), name: '雞高湯基底',         unit: '桶', qty: 2  },
        ],
      }
    ]
  }

  saveLocal()
}

function saveLocal(){
  localStorage.setItem('delivery-db', JSON.stringify({
    deliveries: db.deliveries
  }))
}

async function fetchAllFromFirebase(){
  // TODO: 串接 Firestore 的拿資料
  // 暫時 fallback：沿用 localStorage 內容，至少不 crash
  loadLocal()
}

async function saveAllToFirebase(){
  // TODO: 串接 Firestore 的寫資料
  // 暫時：直接呼叫 saveLocal()，保持畫面可用
  saveLocal()
}

// 切換資料來源時
function onModeChanged(){
  localStorage.setItem('runtime-mode', runtimeMode.value)
  tip('資料來源已切換')
  fetchAll()
}

// ===== 畫面狀態 =====
const drawerOpen = ref(false)
const dateStr = ref(todayStr())
const status = ref('all')
const selectedId = ref(null)

// 門市名稱（顯示用）
const currentStoreName = computed(()=>{
  // 你應該在 scope 裡面有 storeName，如果沒有就請在 scope.storeList 裡找
  if (scope.storeName) return scope.storeName
  if (Array.isArray(scope.stores) && scope.stores.length){
    const found = scope.stores.find(s => s.id === scope.storeId)
    return found ? found.name : '—'
  }
  // fallback: 直接顯示 storeId
  return scope.storeId || '—'
})

// 過濾後的配送單列表
const filteredList = computed(()=>{
  return db.deliveries
    .filter(d => d.storeId === scope.storeId)
    .filter(d => d.date === dateStr.value)
    .filter(d => status.value === 'all' ? true : d.status === status.value)
    .sort((a,b)=> a.no > b.no ? 1 : -1)
})

// 目前選中的配送單
const cur = computed(()=>{
  return db.deliveries.find(d => d.id === selectedId.value) || null
})

function selectLeft(id){
  selectedId.value = id
  drawerOpen.value = false
}

// 狀態推進
function nextStage(){
  if (!cur.value) return
  if (cur.value.status === 'preparing') {
    cur.value.status = 'shipping'
  } else if (cur.value.status === 'shipping') {
    cur.value.status = 'arrived'
  }
  persist()
  tip('狀態已更新')
}

function persist(){
  if (runtimeMode.value === 'firebase') {
    saveAllToFirebase()
  } else {
    saveLocal()
  }
}

// 匯出 / 匯入
function exportJSON(){
  const blob = new Blob([JSON.stringify(db, null, 2)], { type:'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `delivery-${scope.storeId}.json`
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
    }catch{
      tip('匯入失敗：格式錯誤')
    }
  }
  reader.readAsText(f, 'utf-8')
}

// 狀態顯示文字 / badge class
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

// 掛載
onMounted(async()=>{
  await fetchAll()
  // 預設選第一筆
  if (!selectedId.value && filteredList.value.length){
    selectedId.value = filteredList.value[0].id
  }
})
</script>

<style scoped>
/* 主題顏色統一用變數，主題切換時只要切 root variables 就好 */
:root{
  --bg:#f6f8fc;
  --card:#fff;
  --border:#e6eaf2;
  --text:#0f172a;
  --muted:#64748b;
  --accent:#2563eb;

  --status-preparing-bg:#fffbeb;
  --status-preparing-border:#fde68a;
  --status-preparing-text:#92400e;

  --status-shipping-bg:#eff6ff;
  --status-shipping-border:#bfdbfe;
  --status-shipping-text:#1e40af;

  --status-arrived-bg:#f0fdf4;
  --status-arrived-border:#bbf7d0;
  --status-arrived-text:#166534;
}

.delivery-page{
  min-height:100vh;
  background:var(--bg);
  padding:16px;
  display:flex;
  flex-direction:column;
  gap:12px;
  box-sizing:border-box;
}

/* 頂部工具列 -------------------------------------------------- */
.top-bar{
  display:flex;
  align-items:flex-start;
  flex-wrap:wrap;
  gap:12px;
  padding:12px 16px;
}
.top-bar .left{
  min-width:0;
}
.title{
  font-size:18px;
  font-weight:700;
  color:var(--text);
  line-height:1.3;
  margin-bottom:8px;
}
.filters{
  display:flex;
  flex-wrap:wrap;
  gap:16px;
}
.filter-block{
  display:flex;
  flex-direction:column;
  gap:6px;
  min-width:max-content;
}
.label{
  font-size:12px;
  line-height:1.2;
  color:var(--muted);
}
.data-src{
  display:flex;
  flex-direction:column;
  gap:6px;
  min-width:max-content;
}

.right{
  display:flex;
  align-items:flex-end;
  flex-wrap:wrap;
  gap:8px;
}
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
  background:var(--card);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 8px 24px rgba(0,0,0,.04);
  min-width:0;
}

/* 左欄 -------------------------------------------------- */
.side{
  position:relative;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.side-head{
  border-bottom:1px solid var(--border);
  padding:12px 16px;
}
.side-head-row{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:8px;
  flex-wrap:wrap;
}
.store-name{
  font-size:14px;
  font-weight:600;
  color:var(--text);
}
.side-list{
  flex:1;
  overflow:auto;
  padding:12px;
  max-height:calc(100vh - 240px);
}
.side-item{
  display:flex;
  align-items:flex-start;
  gap:10px;
  border:1px solid var(--border);
  border-radius:12px;
  background:#fff;
  padding:10px 12px;
  margin-bottom:8px;
  cursor:pointer;
  box-shadow:0 2px 6px rgba(0,0,0,.03);
}
.side-item.active{
  outline:2px solid #9ec5ff;
  background:#f8fafc;
}
.grow{ flex:1; min-width:0; }
.order-no{
  font-weight:700;
  color:var(--text);
  font-size:14px;
  line-height:1.3;
}
.muted{
  color:var(--muted);
}
.small{ font-size:13px; line-height:1.3; }
.tiny { font-size:12px; line-height:1.2; }
.center{ text-align:center; }
.empty-hint{
  font-size:13px;
  padding:20px 0 8px;
}

/* 狀態 badge -------------------------------------------------- */
.badge{
  border-radius:999px;
  font-size:12px;
  line-height:1.2;
  padding:4px 8px;
  border:1px solid var(--border);
  align-self:flex-start;
  font-weight:500;
}
.badge-preparing{
  background:var(--status-preparing-bg);
  border-color:var(--status-preparing-border);
  color:var(--status-preparing-text);
}
.badge-shipping{
  background:var(--status-shipping-bg);
  border-color:var(--status-shipping-border);
  color:var(--status-shipping-text);
}
.badge-arrived{
  background:var(--status-arrived-bg);
  border-color:var(--status-arrived-border);
  color:var(--status-arrived-text);
}

/* 右欄 -------------------------------------------------- */
.detail{
  display:flex;
  flex-direction:column;
  padding:12px 16px;
}
.main-head{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  gap:12px;
  margin-bottom:12px;
}
.view-title{
  font-size:16px;
  font-weight:700;
  line-height:1.3;
  color:var(--text);
  margin-bottom:4px;
}
.mini-stats{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
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
  line-height:1.2;
  color:var(--muted);
  margin-bottom:4px;
}
.mini-value{
  font-size:16px;
  font-weight:700;
  line-height:1.2;
  color:var(--text);
}

.empty-block{
  border:1px dashed var(--border);
  border-radius:12px;
  padding:40px;
  text-align:center;
  background:#fff;
  color:var(--muted);
}
.empty-block .ico{
  font-size:28px;
  margin-bottom:8px;
  line-height:1;
}

/* 詳細紙本區 -------------------------------------------------- */
.paper{
  background:#fff;
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 4px 16px rgba(0,0,0,.04);
  overflow:hidden;
}
.paper-head{
  background:#fafcff;
  border-bottom:1px dashed var(--border);
  padding:12px 16px;
  font-size:14px;
  color:var(--text);
  display:flex;
  flex-wrap:wrap;
  justify-content:space-between;
  gap:8px;
}
.section{
  padding:16px;
  border-bottom:1px solid #f1f5f9;
}
.section:last-child{
  border-bottom:none;
}
.section-line{
  display:flex;
  flex-wrap:wrap;
  justify-content:space-between;
  line-height:1.4;
  font-size:14px;
  margin-bottom:8px;
}
.section-label{
  color:#64748b;
  font-size:13px;
}
.section-value{
  color:#0f172a;
  font-size:14px;
  font-weight:500;
}
.section-value.strong{
  font-weight:700;
  color:#0f172a;
}
.sec-title{
  font-size:14px;
  font-weight:700;
  color:#1e293b;
  margin-bottom:10px;
}

/* 表格 -------------------------------------------------- */
.table{
  border:1px solid var(--border);
  border-radius:10px;
  overflow:hidden;
  font-size:14px;
}
.th,
.tr{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  border-bottom:1px solid #f1f5f9;
}
.th{
  background:#fafcff;
  font-weight:600;
  color:#334155;
}
.tr:last-child{
  border-bottom:none;
}
.col-name{
  flex:1;
  min-width:0;
}
.col-unit{
  width:120px;
}
.col-qty{
  width:120px;
  text-align:left;
}

/* 備註 -------------------------------------------------- */
.note-block{
  font-size:14px;
  line-height:1.4;
  word-break:break-word;
  white-space:pre-wrap;
}

/* Segmented control -------------------------------------------------- */
.seg{
  display:flex;
  flex-wrap:wrap;
  gap:4px;
}
.segbtn{
  border:1px solid var(--border);
  background:#fff;
  border-radius:8px;
  padding:6px 10px;
  font-size:13px;
  line-height:1.2;
  cursor:pointer;
  color:var(--text);
}
.segbtn.active{
  background:#e6f4ff;
  border-color:#cfe9ff;
  color:#1e3a8a;
  font-weight:600;
}

/* 控制元件 -------------------------------------------------- */
.input{
  border:1px solid var(--border);
  border-radius:10px;
  padding:8px 10px;
  background:#fff;
  font-size:14px;
  line-height:1.2;
  color:var(--text);
  min-width:0;
  outline:none;
}
.input.sm{
  padding:6px 8px;
  font-size:13px;
}
.input:focus{
  border-color:#9ec5ff;
  box-shadow:0 0 0 3px rgba(99,162,255,.15);
  outline:none;
}

.btn{
  border:1px solid #cfe0ff;
  background:#fff;
  color:var(--accent);
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:14px;
  line-height:1.2;
  white-space:nowrap;
}
.btn.primary{
  background:var(--accent);
  border-color:var(--accent);
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

/* 手機 RWD：側欄抽屜 -------------------------------------------------- */
.backdrop{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.25);
  z-index:30;
}

.only-mobile{
  display:none;
}

@media (max-width:1024px){
  .layout{
    grid-template-columns:1fr;
  }

  .detail{
    order:1;
  }

  .side{
    order:2;
    position:fixed;
    inset:0 auto 0 0;
    width:82%;
    max-width:340px;
    background:#fff;
    z-index:40;
    transform:translateX(-100%);
    transition:.2s;
    box-shadow:8px 0 24px rgba(0,0,0,.2);
  }
  .side.open{
    transform:translateX(0);
  }

  .side-list{
    max-height:none;
  }

  .only-mobile{
    display:inline-flex;
  }
}

/* Toast -------------------------------------------------- */
.toast{
  position:fixed;
  right:16px;
  bottom:16px;
  background:#111827;
  color:#fff;
  padding:10px 12px;
  border-radius:10px;
  opacity:.95;
  font-size:13px;
  line-height:1.3;
  z-index:70;
}
</style>
