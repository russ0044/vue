<template>
  <section class="km-page">
    <!-- 頁首：標題 + 資料來源 + 系統設定 -->
    <header class="km-header">
      <div class="title">中央廚房 · 請貨處理</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="goHome">返回主頁</button>
    </header>

    <!-- 篩選列：門市 / 日期 / 類別Tag -->
    <div class="km-tabs">
      <div class="row gap">
        <select v-model="selectedStoreId" class="input sm" @change="persistFilter">
          <option value="">全部門市</option>
          <option v-for="s in db.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <input type="date" class="input sm" v-model="dateStr" @change="persistFilter">

        <div class="chips">
          <button
            v-for="tg in tags"
            :key="tg"
            class="chip"
            :class="{on: tagFilter.has(tg)}"
            @click="toggleTag(tg)"
          >#{{ tg }}</button>
        </div>
      </div>

      <div class="spacer"></div>

      <!-- 手機打開側欄 -->
      <button class="icon-btn only-mobile" title="清單" @click="drawerOpen = true">☰</button>
    </div>

    <!-- 主體區塊：左清單 + 右內容 -->
    <div class="km-grid">
      <!-- 左欄：請貨單列表 -->
      <aside class="km-side" :class="{open: drawerOpen}">
        <div class="side-list">
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
      </aside>

      <!-- 手機遮罩 -->
      <transition name="fade">
        <div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false"/>
      </transition>

      <!-- 右欄詳細 -->
      <main class="km-main card">
        <div class="main-head">
          <div class="left">
            <div class="view-title">請貨處理</div>

            <div v-if="currentRequest" class="mini-stats">
              <div class="mini-box">
                <div class="mini-label">就緒率</div>
                <div class="mini-value">{{ readyRate(currentRequest) }}%</div>
              </div>
              <div class="mini-box">
                <div class="mini-label">缺料項數</div>
                <div class="mini-value warn">{{ shortageCount(currentRequest) }}</div>
              </div>
            </div>
          </div>

          <div class="spacer"></div>

          <div class="row gap" v-if="currentRequest">
            <button
              class="btn"
              @click="doAllReady"
              :disabled="!currentRequest.items.length"
            >全部就緒</button>

            <button
              class="btn primary"
              @click="doApprove"
            >接收並建立訂單</button>
          </div>
        </div>

        <!-- 內容紙張 -->
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
                    @change="saveAll()"
                  />
                </div>
                <div class="grow">
                  <input
                    class="input"
                    v-model.trim="it.note"
                    placeholder="備註…"
                    @change="saveAll()"
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
                @change="saveAll()"
              />
              <span></span>
            </label>
            <span class="muted">允許部分出貨</span>
          </div>
        </div>
      </main>
    </div>

    <!-- 底部工具列 -->
    <footer class="footer-bar">
      <div class="left-info">
        <div class="tagline">中央廚房 · 請貨處理 / 出貨前準備</div>
      </div>

      <div class="spacer"></div>

      <div class="footer-actions">
        <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
        <label class="btn ghost small file-btn">
          匯入 JSON
          <input type="file" accept="application/json" @change="onImportJSON">
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
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useKitchenData } from '@/composables/useKitchenData.js'

/* ------------------------------------
   取資料 / 方法（共用 composable）
------------------------------------ */
const {
  db,
  dataSourceMode,
  fetchAll,
  saveAll,
  setMode,
  storeName,
  applyAllReady,
  approveRequest,
  readyRate,
  shortageCount,
  exportJSON,
  importJSONFile,
} = useKitchenData()

/* ------------------------------------
   UI 本地狀態
------------------------------------ */
const router = useRouter()
const toast = ref('')
function tip(msg){ toast.value = msg; setTimeout(()=>toast.value='',1400) }

const drawerOpen = ref(false)
const selectedId  = ref(null)

const selectedStoreId = ref(localStorage.getItem('km-store') || '')
const dateStr         = ref(localStorage.getItem('km-date')  || new Date().toISOString().slice(0,10))

const tags = ['熟食區','雜項區']
const tagFilter = reactive(new Set())

/* 顯示 / 切換資料來源模式 */
const modeLocal = computed({
  get:()=> dataSourceMode.value,
  set:(v)=>{ setMode(v); tip('資料來源模式已切換') }
})

function onModeChanged(){
  // setMode 內已 fetchAll()
}

/* 過濾條件儲存 */
function persistFilter(){
  localStorage.setItem('km-store', selectedStoreId.value)
  localStorage.setItem('km-date',  dateStr.value)
}

/* Tag 切換 */
function toggleTag(tg){
  tagFilter.has(tg) ? tagFilter.delete(tg) : tagFilter.add(tg)
}

/* 狀態文字 */
function statusText(s){
  if (s === 'pending') return '待處理'
  if (s === 'partial') return '部分就緒'
  if (s === 'done')    return '完成'
  return s || '—'
}

/* 左側清單：套用門市 / 日期 / 類別過濾 */
const filteredRequests = computed(()=>{
  return db.requests
    .filter(r => !selectedStoreId.value || r.storeId === selectedStoreId.value)
    .filter(r => r.date === dateStr.value)
    .filter(r => !tagFilter.size || r.items.some(it=> tagFilter.has(it.cat)))
    .sort((a,b)=> a.storeId > b.storeId ? 1 : -1)
})

/* 目前選到哪一筆請貨單 */
const currentRequest = computed(()=> db.requests.find(r=>r.id===selectedId.value) || null)

/* 分群顯示（熟食區 / 雜項區 ...） */
const groupedReq = computed(()=>{
  if (!currentRequest.value) return []
  const g = {}
  currentRequest.value.items.forEach(it=>{
    if (!g[it.cat]) g[it.cat] = []
    g[it.cat].push(it)
  })
  return Object.keys(g).map(name=>({ name, rows:g[name] }))
})

function selectLeft(id){
  selectedId.value = id
  drawerOpen.value = false
}

/* 操作：全部就緒 */
function doAllReady(){
  if (!currentRequest.value) return
  applyAllReady(currentRequest.value)
  tip('已全部設定為就緒')
}

/* 操作：接收並建立訂單 */
function doApprove(){
  const result = approveRequest(currentRequest.value)
  if (!result.ok){
    tip(result.msg || '無法建立訂單')
    return
  }
  tip(result.msg)
  // 自動跳去剛建立的訂單畫面？
  // 可依路由名稱調整，例如 'kitchen-orders'
  router.push({ name:'kitchen-orders', query:{ focus: result.newOrderId } })
}

/* 匯入 JSON */
function onImportJSON(e){
  const f = e.target.files?.[0]
  if (!f) return
  importJSONFile(
    f,
    ()=>tip('已匯入資料'),
    ()=>tip('匯入失敗：格式錯誤')
  )
}

/* 系統設定 / 回主頁 */
function goSettings(){
  router.push('/settings')
}
function goHome(){
  router.push({ name:'boss-inventory' })
}

/* 初始載入 */
onMounted(async()=>{
  await fetchAll()
})
</script>

<style scoped>
/* ---- 共用主題變數（淺色） ---- */
:root{
  --bg:#f6f8fc;
  --card:#fff;
  --border:#e6eaf2;
  --muted:#64748b;
  --text:#0f172a;
  --accent:#2563eb;
}

/* ---- 版面結構 ---- */
.km-page{
  background:var(--bg);
  min-height:100vh;
  display:flex;
  flex-direction:column;
  padding-bottom:72px;
  box-sizing:border-box;
  padding:16px;
}
.spacer{ flex:1; }

/* 頁首列 */
.km-header{
  display:flex;
  align-items:flex-start;
  gap:12px;
  flex-wrap:wrap;
  margin-bottom:8px;
  background:#fff;
  border:1px solid var(--border);
  border-radius:14px;
  padding:12px 16px;
  box-shadow:0 8px 24px rgba(0,0,0,.04);
}
.title{
  font-size:18px;
  font-weight:700;
  color:var(--text);
  line-height:1.3;
}
.ds{
  display:flex;
  align-items:center;
  gap:6px;
  flex-wrap:wrap;
}

/* 篩選區外框 */
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

/* 兩欄主體 */
.km-grid{
  display:grid;
  grid-template-columns:320px 1fr;
  gap:12px;
  min-width:0;
}

/* 左側清單面板 */
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
.center{text-align:center;}
.side-empty{
  font-size:13px;
  padding:20px 0 8px;
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

/* 單據紙卡 */
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

/* 表格 */
.section{ padding:16px; }
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
.tr:last-child{ border-bottom:none; }
.w200{ width:200px; }
.w120{ width:120px; }
.w90 { width:90px; }
.grow{ flex:1; min-width:0; }

.input{
  border:1px solid var(--border);
  border-radius:8px;
  padding:.5rem .6rem;
  background:#fff;
  font-size:14px;
  line-height:1.2;
  color:#0f172a;
  width:100%;
  min-width:0;
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

/* chips / tag 選擇 */
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

/* badge 狀態 */
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

/* row utils */
.row{display:flex;align-items:center;flex-wrap:wrap;gap:8px;}
.row.gap{gap:8px;}
.justify-end{justify-content:flex-end;}
.allow-row{padding:12px 16px;}

.chk{display:inline-flex;align-items:center;}
.chk input{display:none;}
.chk span{
  width:18px;height:18px;
  border:1px solid #cbd5e1;
  border-radius:4px;
  background:#fff;
  position:relative;
  display:inline-block;
}
.chk input:checked + span::after{
  content:'';position:absolute;inset:3px;
  background:#2563eb;border-radius:2px;
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

/* 按鈕 */
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

/* footer 工具列 */
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

/* Toast */
.toast{
  position:fixed;
  right:16px;
  bottom:72px;
  background:#111827;
  color:#fff;
  padding:10px 12px;
  border-radius:10px;
  opacity:.95;
  font-size:13px;
  line-height:1.3;
  z-index:70;
}

/* 清單抽屜（手機） */
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

.backdrop{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.25);
  z-index:30;
}

/* RWD */
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
