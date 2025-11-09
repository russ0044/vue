<template>
  <section class="report-page">
    <!-- 頁首 -->
    <header class="main-head card">
      <div class="h2">檢視報表</div>
      <div class="spacer"></div>

      <div class="row gap">
        <label class="muted small">起</label>
        <input type="date" class="input sm" v-model="from">
        <label class="muted small">迄</label>
        <input type="date" class="input sm" v-model="to">
        <button class="btn" @click="recalc">套用</button>
        <button class="btn ghost small" @click="exportCSV">匯出 CSV</button>
        <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
      </div>
    </header>

    <!-- 主體 -->
    <div class="grid two-col">
      <!-- 左：甜甜圈 + 圖例 -->
      <section class="card">
        <div class="h3">出貨品項占比（{{ scope.storeName }}）</div>

        <div v-if="sortedRows.length" class="donut-wrap">
          <div class="donut">
            <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" role="img">
              <g :transform="`translate(${size/2},${size/2})`">
                <template v-for="(s,i) in slices" :key="i">
                  <path :d="arcPath(s.start,s.end,outerR,innerR)" :fill="colors[i%colors.length]" />
                </template>
                <!-- 底圈，避免內側透明在深色模式不好看 -->
                <circle :r="innerR" fill="var(--card)" />
              </g>
            </svg>
            <div class="center-num">
              <div class="num">{{ totalQty }}</div>
              <div class="muted tiny">總數</div>
            </div>
          </div>

          <div class="legend">
            <div class="lg" v-for="(row,i) in sortedRows" :key="row.name+'|'+row.unit">
              <span class="dot" :style="{background:colors[i%colors.length]}"></span>
              <span class="name" :title="row.name">{{ row.name }}</span>
              <span class="muted">/ {{ row.unit }}</span>
              <span class="qty">{{ row.qty }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty">
          <div class="emoji">📭</div>
          <div class="muted">目前區間內沒有訂單資料</div>
          <div class="row gap mt-8">
            <button class="btn small" @click="loadDemo">載入示範資料</button>
            <button class="btn ghost small" @click="recalc">重新整理</button>
          </div>
        </div>

        <p class="tiny muted tip">* 單店彙總，員工不可切換他店</p>
      </section>

      <!-- 右：明細表 -->
      <section class="card">
        <div class="h3">明細</div>

        <div class="table mt-8">
          <div class="th">
            <div class="col-idx">#</div>

            <button class="th-btn spacer left"
              :class="thClass('name')"
              @click="toggleSort('name')">品名</button>

            <button class="th-btn col-unit"
              :class="thClass('unit')"
              @click="toggleSort('unit')">單位</button>

            <button class="th-btn col-qty"
              :class="thClass('qty')"
              @click="toggleSort('qty')">數量</button>
          </div>

          <template v-if="sortedRows.length">
            <div class="tr" v-for="(row, idx) in sortedRows" :key="row.name+'|'+row.unit">
              <div class="col-idx">{{ idx+1 }}</div>
              <div class="spacer ellipsis" :title="row.name">{{ row.name }}</div>
              <div class="col-unit">{{ row.unit }}</div>
              <div class="col-qty">{{ row.qty }}</div>
            </div>

            <div class="tr total">
              <div class="col-idx">—</div>
              <div class="spacer">合計</div>
              <div class="col-unit">—</div>
              <div class="col-qty">{{ totalQty }}</div>
            </div>
          </template>

          <div v-else class="tr">
            <div class="spacer center muted">無資料</div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useScope } from '@/store/scope'

const scope = useScope()
const today = ()=> new Date().toISOString().slice(0,10)
const from = ref(today())
const to   = ref(today())

/* 讀取訂單（僅當前門市） */
function safeParse(raw, fallback){ try{ return JSON.parse(raw) }catch{ return fallback } }
function getOrders(){
  const raw = localStorage.getItem(`emp-orders-${scope.storeId}`)
  const obj = safeParse(raw, { ord:[] })
  return (obj.ord || []).filter(o => o.storeId === scope.storeId)
}

/* 明細 rows（原始），sortedRows（排序後） */
const rows = ref([])
function recalc(){
  const list = getOrders().filter(o => o.date >= from.value && o.date <= to.value)
  const map = new Map()
  list.forEach(o => o.items.forEach(it=>{
    const k = it.name + '|' + it.unit
    map.set(k, (map.get(k)||0) + (+it.qty||0))
  }))

  rows.value = Array.from(map.entries())
    .map(([k,qty])=>{
      const [name,unit] = k.split('|')
      return { name, unit, qty: Number(qty)||0 }
    })
}

/* 排序控制 */
const sortBy = ref('qty')      // 'name' | 'unit' | 'qty'
const asc    = ref(false)      // 數量預設降冪
const sortedRows = computed(()=>{
  const s = sortBy.value
  const m = asc.value ? 1 : -1
  return [...rows.value].sort((a,b)=>{
    if (s === 'qty')  return (a.qty - b.qty) * m
    if (s === 'name') return a.name.localeCompare(b.name,'zh-Hant') * m
    if (s === 'unit') return a.unit.localeCompare(b.unit,'zh-Hant') * m
    return 0
  })
})
function toggleSort(key){
  if (sortBy.value === key) {
    asc.value = !asc.value
  } else {
    sortBy.value = key
    asc.value = key === 'qty' ? false : true // 預設：數量降冪，其它升冪
  }
}
function thClass(key){
  return {
    active: sortBy.value === key,
    asc:    sortBy.value === key && asc.value,
    desc:   sortBy.value === key && !asc.value,
  }
}

/* 合計 */
const totalQty = computed(()=> sortedRows.value.reduce((s,r)=>s+(+r.qty||0),0))

/* 甜甜圈圖 */
const size=240, outerR=100, innerR=62
const colors = ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6','#22d3ee','#fb7185','#84cc16','#eab308']
const slices = computed(()=>{
  const sum = totalQty.value || 1
  let acc=0
  return sortedRows.value.map(r => {
    const start=acc, end=acc+(r.qty/sum)*Math.PI*2
    acc=end
    return { start, end }
  })
})
function arcPath(start, end, R, r){
  if (start === end) return ''
  const large = end - start > Math.PI ? 1 : 0
  const sx = Math.cos(start)*R, sy = Math.sin(start)*R
  const ex = Math.cos(end)*R,   ey = Math.sin(end)*R
  const isx = Math.cos(end)*r,  isy = Math.sin(end)*r
  const iex = Math.cos(start)*r, iey = Math.sin(start)*r
  return `M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey} L ${isx} ${isy} A ${r} ${r} 0 ${large} 0 ${iex} ${iey} Z`
}

/* 匯出 */
function exportCSV(){
  const header = '品名,單位,數量\n'
  const lines = sortedRows.value.map(r => `${r.name},${r.unit},${r.qty}`).join('\n')
  const blob = new Blob([header+lines], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=`report-${scope.storeId}.csv`; a.click()
  URL.revokeObjectURL(url)
}
function exportJSON(){
  const blob = new Blob([JSON.stringify({
    storeId: scope.storeId,
    storeName: scope.storeName,
    from: from.value, to: to.value,
    sortBy: sortBy.value, asc: asc.value,
    rows: sortedRows.value
  },null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=`report-${scope.storeId}.json`; a.click()
  URL.revokeObjectURL(url)
}

/* Demo 資料（便於預覽） */
function rid(){ return 'id-'+Math.random().toString(36).slice(2,10) }
function todayOffset(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10) }
function loadDemo(){
  const key = `emp-orders-${scope.storeId}`
  const raw = safeParse(localStorage.getItem(key), { req:[], ord:[] })
  const baseDate = today()
  const ordA = {
    id: rid(), storeId: scope.storeId, date: baseDate,
    items: [
      { key: rid(), name:'去骨雞腿（真空包）', unit:'包', qty: 28, note:'' },
      { key: rid(), name:'米釀醬油',           unit:'瓶', qty:  3, note:'' },
      { key: rid(), name:'雞高湯基底',         unit:'桶', qty:  1, note:'' },
    ]
  }
  const ordB = {
    id: rid(), storeId: scope.storeId, date: todayOffset(-1),
    items: [
      { key: rid(), name:'去骨雞腿（真空包）', unit:'包', qty: 22, note:'' },
      { key: rid(), name:'白米',               unit:'公斤', qty: 8, note:'' },
    ]
  }
  raw.ord = [ordA, ordB, ...(raw.ord||[])]
  localStorage.setItem(key, JSON.stringify(raw))
  recalc()
}

/* 初始化 */
onMounted(()=> { recalc() })
</script>

<style scoped>
/* 顏色變數（沿用全站風格） */
:root{
  --bg:#f6f8fc;
  --card:#fff;
  --border:#e6eaf2;
  --text:#0f172a;
  --muted:#64748b;
  --thead-bg:#f1f5f9;
  --thead-text:#1f2937;
  --hover-bg:#f9fafb;
  --primary:#2563eb;
}
:root .dark,
.dark :root{
  --bg:#0f172a;
  --card:#1e293b;
  --border:#334155;
  --text:#e2e8f0;
  --muted:#94a3b8;
  --thead-bg:#1e293b;
  --thead-text:#f1f5f9;
  --hover-bg:#273549;
  --primary:#3b82f6;
}

.report-page{
  min-height:100vh;
  padding:16px;
  background:var(--bg);
  color:var(--text);
  display:flex;
  flex-direction:column;
  gap:12px;
  font-family:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;
}
.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 8px 24px rgba(0,0,0,.04);
  padding:12px 16px;
}
.main-head{
  display:flex; align-items:center; gap:10px;
}
.h2{ font-size:18px; font-weight:800; }
.h3{ font-size:16px; font-weight:700; margin-bottom:6px; }
.spacer{ flex:1; }
.row{ display:flex; align-items:center; }
.row.gap{ gap:8px; flex-wrap:wrap; }
.muted{ color:var(--muted); }
.small{ font-size:12px; }
.tiny{ font-size:11px; }

/* 控制元件 */
.input{
  border:1px solid var(--border);
  background:var(--card);
  color:var(--text);
  border-radius:10px;
  padding:6px 8px;
  font-size:14px;
  outline:none;
}
.input.sm{ padding:6px 8px; font-size:13px; }
.btn{
  border:1px solid var(--primary);
  background:var(--card);
  color:var(--primary);
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:13px;
}
.btn.ghost{ border-color:var(--border); color:var(--text); }
.btn.small{ padding:6px 10px; font-size:12px; }

/* 版面 */
.grid.two-col{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:12px;
}
@media (max-width: 980px){
  .grid.two-col{ grid-template-columns:1fr; }
}

/* Donut 區 */
.donut-wrap{
  display:flex;
  gap:16px;
  align-items:center;
  justify-content:center;
  margin-top:8px;
  flex-wrap:wrap;
}
.donut{
  position:relative;
  width:240px; height:240px;
  display:grid; place-items:center;
}
.center-num{
  position:absolute; inset:0;
  display:grid; place-items:center;
  pointer-events:none;
}
.center-num .num{ font-size:26px; font-weight:800; line-height:1; }
.legend{
  min-width:260px;
  display:grid;
  gap:8px;
}
.lg{
  display:flex; align-items:center; gap:8px;
  border:1px solid var(--border);
  background:var(--card);
  border-radius:10px;
  padding:8px 10px;
}
.dot{
  width:10px; height:10px; border-radius:999px; flex:none;
  border:1px solid rgba(0,0,0,.08);
}
.lg .name{ max-width:170px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lg .qty{ margin-left:auto; font-weight:700; }

/* 表格 */
.table{
  border:1px solid var(--border);
  border-radius:12px;
  overflow:hidden;
}
.th, .tr{
  display:flex; align-items:center; gap:10px;
  padding:10px 12px;
  border-bottom:1px solid var(--border);
}
.th{ background:var(--thead-bg); color:var(--thead-text); font-weight:600; }
.tr:last-child{ border-bottom:none; }
.tr.total{ font-weight:700; }
.col-idx{ width:44px; text-align:right; color:var(--muted); }
.col-unit{ width:120px; }
.col-qty{ width:120px; text-align:right; }
.left{ text-align:left; }
.spacer{ flex:1; }
.ellipsis{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* 可點表頭 */
.th-btn{
  background:transparent; border:none; padding:0; margin:0; cursor:pointer;
  font:inherit; color:inherit; display:flex; align-items:center; gap:6px;
}
.th-btn.active::after{
  content: attr(data-arrow);
}
.th-btn.active.asc::after{ content: '▲'; font-size:10px; }
.th-btn.active.desc::after{ content: '▼'; font-size:10px; }

/* 空狀態 */
.empty{
  border:1px dashed var(--border);
  border-radius:12px;
  padding:24px;
  display:grid; place-items:center; gap:8px;
  background:var(--card);
}
.empty .emoji{ font-size:28px; }

/* 註解 */
.tip{ margin-top:8px; }
.mt-8{ margin-top:8px; }
</style>
