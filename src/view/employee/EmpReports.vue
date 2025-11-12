<template>
  <section class="rep-page">
    <!-- 頁首 -->
    <header class="rep-header">
      <div class="title">報表中心（店長）</div>
      <div class="badge-store" v-if="myStoreName">本店：{{ myStoreName }}</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="exportCSV">匯出 CSV</button>
      <button class="btn ghost small" @click="exportPNG">匯出圖表 PNG</button>
    </header>

    <!-- 篩選列（無店面選擇，僅日期/指標/分組/分類） -->
    <div class="rep-toolbar card-lite">
      <div class="row gap">
        <label class="label">日期</label>
        <input type="date" class="input" v-model="dateFrom" />
        <span class="muted">—</span>
        <input type="date" class="input" v-model="dateTo" />

        <div class="chips">
          <button class="chip" @click="setRange(7)">近 7 天</button>
          <button class="chip" @click="setRange(30)">近 30 天</button>
          <button class="chip" @click="setRange(90)">近 90 天</button>
          <button class="chip" @click="clearDates">全部日期</button>
        </div>

        <div class="seg">
          <button :class="['segbtn', metric==='used' && 'active']" @click="metric='used'">已使用</button>
          <button :class="['segbtn', metric==='waste' && 'active']" @click="metric='waste'">報廢</button>
        </div>

        <select class="input w200" v-model="groupBy">
          <option value="cate">依分類</option>
          <option value="item">依品項</option>
        </select>

        <select class="input w200" v-model="catFilter">
          <option value="ALL">全部分類</option>
          <option v-for="c in bossTags" :key="c" :value="c">{{ c }}</option>
          <option v-if="!bossTags.includes(UNCATEGORIZED)" :value="UNCATEGORIZED">{{ UNCATEGORIZED }}</option>
        </select>

        <button class="btn" @click="reload">重新整理</button>
      </div>

      <p class="muted small tip">
        * 本頁以 <b>假資料（seed / localStorage 無依賴）</b> 展示，僅顯示「數量」。<br>
        * 分類清單來自 seed.products 的 <code>cat</code>；若找不到則歸為「未分類」。
      </p>
    </div>

    <!-- KPI -->
    <div class="rep-kpi">
      <div class="k card"><div class="cap">日報筆數</div><div class="val">{{ kpi.docCount }}</div></div>
      <div class="k card"><div class="cap">分組數</div><div class="val">{{ kpi.groupKinds }}</div></div>
      <div class="k card"><div class="cap">總數量</div><div class="val">{{ kpi.qtyTotal }}</div></div>
      <div class="k card"><div class="cap">平均每筆</div><div class="val">{{ kpi.avgPerDoc }}</div></div>
      <div class="k card"><div class="cap">指標</div><div class="val">{{ metric==='used'?'已使用':'報廢' }}</div></div>
    </div>

    <!-- 主內容 -->
    <div class="rep-grid">
      <div class="card">
        <div class="panel-head">
          <div class="h3">圓餅圖：{{ pieTitle }}</div>
          <div class="spacer"></div>
        </div>

        <PieChart
          ref="pieRef"
          :data="pieData"
          :title="pieTitle"
        />
      </div>

      <div class="card table-wrap">
        <div class="panel-head"><div class="h3">明細（{{ groupBy==='cate' ? '依分類' : '依品項' }}）</div></div>
        <table class="table">
          <thead>
            <tr>
              <th>{{ groupBy==='cate' ? '分類' : '品項' }}</th>
              <th class="tr">單位</th>
              <th class="tr">數量</th>
              <th class="tr">占比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in tableRows" :key="r.key">
              <td>{{ r.name }}</td>
              <td class="tr">{{ r.unit || '—' }}</td>
              <td class="tr">{{ r.qty }}</td>
              <td class="tr">{{ (r.ratio*100).toFixed(1) }}%</td>
            </tr>
            <tr v-if="!tableRows.length"><td colspan="4" class="center muted">沒有資料</td></tr>
          </tbody>
          <tfoot v-if="tableRows.length">
            <tr>
              <th>合計</th>
              <th class="tr">—</th>
              <th class="tr">{{ kpi.qtyTotal }}</th>
              <th class="tr">100%</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, defineComponent, watch, h } from 'vue'
import { useScope } from '@/store/scope'
import seedFactory from '@/seed/seedData'

/* ============ 取得當前店長的門市（無法切換） ============ */
const scope = useScope()
const myStoreId   = ref('')
const myStoreName = ref('')
watch(() => [scope.storeId, scope.storeName], ([sid, sname]) => {
  myStoreId.value = String(sid || '')
  myStoreName.value = String(sname || '')
}, { immediate: true })

/* ============ 圓餅圖（純 SVG） ============ */
const PieChart = defineComponent({
  name: 'PieChart',
  props: { data: Array, title: String },
  setup(props, { expose }) {
    const svgRef = ref(null)
    const colors = ['#60a5fa','#f472b6','#34d399','#fbbf24','#c084fc','#f87171','#2dd4bf','#a3e635','#fb7185','#93c5fd']
    const polarToXY = (cx,cy,r,angle)=>[ cx + r*Math.cos(angle), cy + r*Math.sin(angle) ]

    const build = () => {
      const svg = svgRef.value; if (!svg) return; svg.innerHTML = ''
      const cx=180, cy=170, r=120, hole=70
      let start = -Math.PI/2
      const g = document.createElementNS('http://www.w3.org/2000/svg','g')
      svg.appendChild(g)

      ;(props.data||[]).forEach((d,i)=>{
        const angle=(d.ratio||0)*Math.PI*2, end=start+angle
        const [x1,y1]=polarToXY(cx,cy,r,start)
        const [x2,y2]=polarToXY(cx,cy,r,end)
        const large=angle>Math.PI?1:0
        const [ix1,iy1]=polarToXY(cx,cy,hole,end)
        const [ix2,iy2]=polarToXY(cx,cy,hole,start)
        const path=document.createElementNS('http://www.w3.org/2000/svg','path')
        path.setAttribute('d',`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${hole} ${hole} 0 ${large} 0 ${ix2} ${iy2} Z`)
        path.setAttribute('fill', colors[i%colors.length])
        path.setAttribute('stroke','#fff'); path.setAttribute('stroke-width','1')
        g.appendChild(path); start=end
      })

      const inner = document.createElementNS('http://www.w3.org/2000/svg','circle')
      inner.setAttribute('cx', cx); inner.setAttribute('cy', cy); inner.setAttribute('r', hole-4)
      inner.setAttribute('fill', 'var(--card-bg)'); inner.setAttribute('stroke', 'var(--border)')
      svg.appendChild(inner)

      const t = String(props.title || '')
      const main = t.replace(/（.*?）/,'').trim()
      const sub  = (t.match(/（(.*?)）/)||[])[1] || ''
      const textMain = document.createElementNS('http://www.w3.org/2000/svg','text')
      ;[['x',cx],['y',cy-4],['text-anchor','middle'],['dominant-baseline','middle'],['fill','var(--text)'],['font-size','14'],['font-weight','700']]
        .forEach(([k,v])=>textMain.setAttribute(k,String(v)))
      textMain.textContent = main; svg.appendChild(textMain)
      if (sub) {
        const textSub = document.createElementNS('http://www.w3.org/2000/svg','text')
        ;[['x',cx],['y',cy+14],['text-anchor','middle'],['dominant-baseline','middle'],['fill','var(--muted)'],['font-size','11'],['font-weight','600']]
          .forEach(([k,v])=>textSub.setAttribute(k,String(v)))
        textSub.textContent = sub; svg.appendChild(textSub)
      }

      const legendX=340, legendY=40, step=26
      ;(props.data||[]).forEach((d,i)=>{
        const y=legendY+i*step
        const rect=document.createElementNS('http://www.w3.org/2000/svg','rect')
        rect.setAttribute('x',legendX); rect.setAttribute('y',y-10)
        rect.setAttribute('width',14); rect.setAttribute('height',14); rect.setAttribute('rx',3)
        rect.setAttribute('fill', colors[i%colors.length]); svg.appendChild(rect)
        const txt=document.createElementNS('http://www.w3.org/2000/svg','text')
        txt.setAttribute('x',legendX+22); txt.setAttribute('y',y+2)
        txt.setAttribute('fill','var(--text)'); txt.setAttribute('font-size','13')
        txt.textContent=`${d.name}：${((d.ratio||0)*100).toFixed(1)}%`; svg.appendChild(txt)
      })
    }

    watch(()=>[props.data, props.title], ()=>nextTick(build), { deep:true })
    onMounted(()=> nextTick(build))

    const downloadPNG = async (filename='pie.png')=>{
      const svg=svgRef.value; if(!svg) return
      const xml=new XMLSerializer().serializeToString(svg)
      const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'})
      const url=URL.createObjectURL(blob)
      const img=new Image(), w=560, h=340
      const cvs=document.createElement('canvas'); cvs.width=w; cvs.height=h
      const ctx=cvs.getContext('2d')
      await new Promise(res=>{ img.onload=()=>{ ctx.drawImage(img,0,0,w,h); URL.revokeObjectURL(url); res() }; img.src=url })
      const data=cvs.toDataURL('image/png')
      const a=document.createElement('a'); a.href=data; a.download=filename; a.click()
    }

    expose({ downloadPNG })
    return () => h('svg', { ref: svgRef, width: 560, height: 340, viewBox: '0 0 560 340' })
  }
})

/* ============ 假資料來源（seed） ============ */
const seed = seedFactory()
const products = computed(()=> seed?.products || [])
const storeWasteUsage = computed(()=> seed?.storeWasteUsage || [])
const bossTags = Array.from(new Set(products.value.map(p => p.cat).filter(Boolean)))
const nameToCat = new Map(products.value.map(p => [p.name, p.cat]))
const skuToCat  = new Map(products.value.map(p => [p.id, p.cat]))
const UNCATEGORIZED = '未分類'

/* ============ 篩選條件（無店面） ============ */
const dateFrom  = ref('')
const dateTo    = ref('')
const metric    = ref('used')            // 'used' | 'waste'
const groupBy   = ref('cate')            // 'cate' | 'item'
const catFilter = ref('ALL')

function toISO(d){ const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}` }
function setRange(days){
  const to=new Date(), from=new Date(); from.setDate(to.getDate()-days+1)
  dateFrom.value = toISO(from); dateTo.value = toISO(to)
}
function clearDates(){ dateFrom.value=''; dateTo.value='' }

/* 依本店資料推算初始日期（避免空集） */
function getMyDateBounds(){
  const all = []
  const bucket = storeWasteUsage.value.find(x => x.storeId === myStoreId.value)
  for (const rec of (bucket?.records || [])) if (rec?.date) all.push(rec.date)
  if (!all.length) return null
  all.sort()
  return { min: all[0], max: all[all.length-1] }
}

onMounted(()=>{
  // 等待 myStoreId 初值 ready 後再設日期
  const tryInit = () => {
    if (!myStoreId.value) { requestAnimationFrame(tryInit); return }
    const bounds = getMyDateBounds()
    if (bounds){ dateFrom.value=bounds.min; dateTo.value=bounds.max } else { setRange(90) }
  }
  tryInit()

  // 同步主題（可留可去）
  const theme = localStorage.getItem('theme') || 'auto'
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const shouldDark = theme === 'dark' || (theme === 'auto' && prefersDark)
  document.documentElement.classList.toggle('dark', !!shouldDark)
})

/* ============ 取本店日報（依日期） ============ */
const dailyRecords = computed(()=>{
  const from = dateFrom.value || '0000-00-00'
  const to   = dateTo.value   || '9999-12-31'
  const bucket = storeWasteUsage.value.find(x => x.storeId === myStoreId.value)
  if (!bucket) return []
  return (bucket.records || []).filter(r => {
    const d = r?.date || ''
    return d >= from && d <= to
  })
})

/* ============ 分組工具 ============ */
function categoryOf(it){
  const byName = nameToCat.get(String(it?.name || ''))
  if (byName) return byName
  const bySku = skuToCat.get(String(it?.sku || ''))
  return bySku || UNCATEGORIZED
}

/* ============ KPI ============ */
const kpi = computed(()=>{
  const docs = dailyRecords.value
  const rows = []
  for (const r of docs) {
    const arr = Array.isArray(r?.[metric.value]) ? r[metric.value] : []
    for (const it of arr) rows.push({ name: it.name, unit: it.unit, qty: Number(it.qty)||0 })
  }
  const qtyTotal = rows.reduce((s,r)=>s+r.qty,0)
  const groupKey = (r)=> groupBy.value==='cate' ? categoryOf(r) : r.name
  const groupKinds = new Set(rows.map(r=>groupKey(r))).size
  const docCount = docs.length
  const avgPerDoc = docCount ? Math.round(qtyTotal / docCount) : 0
  return { docCount, groupKinds, qtyTotal, avgPerDoc }
})

/* ============ 圓餅 / 表格資料 ============ */
const pieTitle = computed(()=>{
  const m = metric.value==='used' ? '已使用' : '報廢'
  const scopeName = groupBy.value==='cate' ? '依分類' : '依品項'
  return `${m} - ${scopeName}（數量）`
})

const grouped = computed(()=>{
  const map = new Map()
  const pushRow = (it)=>{
    const cate = categoryOf(it)
    if (catFilter.value !== 'ALL' && cate !== catFilter.value) return
    const key = groupBy.value==='cate' ? cate : `${it.name}|${it.unit||''}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: groupBy.value==='cate' ? cate : it.name,
        unit: it.unit || '',
        qty: 0
      })
    }
    map.get(key).qty += Number(it.qty)||0
  }

  for (const r of dailyRecords.value) {
    const arr = Array.isArray(r?.[metric.value]) ? r[metric.value] : []
    for (const it of arr) pushRow(it)
  }

  return Array.from(map.values())
})

const totalQty = computed(()=> grouped.value.reduce((s,r)=>s+r.qty,0) || 1)

const pieData = computed(()=>{
  return grouped.value
    .filter(r=>r.qty>0)
    .sort((a,b)=>b.qty-a.qty)
    .map(r=>({ name:r.name, ratio:r.qty/totalQty.value }))
})

const tableRows = computed(()=>{
  const total = totalQty.value || 1
  return grouped.value
    .sort((a,b)=>b.qty-a.qty)
    .map(r=>({ ...r, ratio: r.qty/total }))
})

/* 動作 / 匯出 */
function reload(){ /* 資料皆由 computed 即時更新 */ }

const pieRef = ref(null)
async function exportPNG(){ await pieRef.value?.downloadPNG?.(`mgr-pie-${metric.value}-${groupBy.value}.png`) }

function escapeCSV(v){ const s=String(v??''); return /[,"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s }
function exportCSV(){
  const rows = [
    ['店面', myStoreName.value || '—'],
    ['日期區間', `${dateFrom.value||'—'} ~ ${dateTo.value||'—'}`],
    ['指標', metric.value==='used'?'已使用':'報廢'],
    ['群組方式', groupBy.value==='cate' ? '依分類' : '依品項'],
    ['分類過濾', catFilter.value==='ALL'?'全部':catFilter.value],
    [],
    [groupBy.value==='cate' ? '分類' : '品項','單位','數量','占比'],
    ...tableRows.value.map(r=>[ r.name, r.unit || '', r.qty, (r.ratio*100).toFixed(1)+'%' ]),
    tableRows.value.length ? ['合計', '—', kpi.value.qtyTotal, '100%'] : []
  ]
  const csv = rows.filter(r=>r.length).map(r => r.map(escapeCSV).join(',')).join('\n')
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a=document.createElement('a'); a.href=url; a.download='manager-report.csv'; a.click()
  URL.revokeObjectURL(url)
}

/* Toast */
const toastMsg = ref('')
function toast(m){ toastMsg.value=m; setTimeout(()=>toastMsg.value='',1400) }
</script>

<style scoped>
/* ===== 版面骨架 ===== */
.rep-page{
  padding:16px;
  background:var(--bg);
  color:var(--text);
  min-height:100%;
  height:auto;
  overflow:visible;
  transition:background .25s,color .25s;
}
.rep-header{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.title{ font-size:20px; font-weight:800; }
.badge-store{
  border:1px solid var(--border);
  border-radius:999px;
  padding:4px 10px;
  font-size:12px;
  color:var(--thead-text);
  background:var(--thead-bg);
}
.spacer{ flex:1; }

/* ===== 控件 ===== */
.btn{
  border:1px solid var(--border);
  background:var(--card-bg);
  color:var(--text);
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:14px;
  line-height:1.2;
  transition:.15s;
}
.btn:hover{ border-color:var(--thead-text); }
.btn.primary{ background:#2563eb; border-color:#2563eb; color:#fff; }
.btn.ghost{ background:var(--card-bg); color:var(--text); }
.btn.small{ padding:6px 10px; font-size:12px; }

.card{
  background:var(--card-bg);
  border:1px solid var(--border);
  border-radius:16px;
  padding:12px;
  min-width:0;
  box-shadow:0 2px 8px rgba(0,0,0,.04);
}
.card-lite{
  background:var(--card-bg);
  border:1px dashed var(--border);
  border-radius:12px;
  padding:12px;
}
.row{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.input{
  border:1px solid var(--border);
  border-radius:10px;
  padding:8px 10px;
  outline:none;
  background:var(--card-bg);
  color:var(--text);
}
.input:focus{ border-color:#9ec5ff; box-shadow:0 0 0 3px rgba(99,162,255,.15); }
.label{ min-width:56px; color:var(--muted); }
.chips{ display:flex; gap:8px; flex-wrap:wrap; }
.chip{
  border:1px solid var(--border);
  border-radius:999px;
  background:var(--card-bg);
  padding:6px 10px;
  cursor:pointer;
  font-size:13px;
}
.seg{ display:flex; gap:6px; }
.segbtn{
  border:1px solid var(--border);
  background:var(--card-bg);
  border-radius:10px;
  padding:6px 10px;
  cursor:pointer;
  font-size:13px;
}
.segbtn.active{ background:var(--hover-bg); border-color:#cfe9ff; }
.w200{ width:200px }
.tip{ margin:8px 0 0; }

/* ===== KPI ===== */
.rep-kpi{
  display:grid;
  grid-template-columns:repeat(5, minmax(120px,1fr));
  gap:10px;
  margin:10px 0 12px;
}
.k .cap{ color:var(--muted); font-size:12px; }
.k .val{ font-weight:800; font-size:20px; margin-top:2px; }

/* ===== 主區塊 ===== */
.rep-toolbar{ margin-bottom:10px; }
.rep-grid{ display:grid; grid-template-columns:1.1fr 1fr; gap:12px; }
.panel-head{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.h3{ margin:0 0 4px; font-weight:800; }

/* ===== 表格 ===== */
.table-wrap{ overflow:auto; }
.table{
  width:100%;
  border-collapse:collapse;
  min-width:640px;
}
.table th,.table td{
  padding:10px;
  border-bottom:1px solid var(--border);
  text-align:left;
  vertical-align:top;
  font-size:14px;
  line-height:1.4;
}
.table thead th{
  position:sticky;
  top:0;
  background:var(--thead-bg);
  color:var(--thead-text);
  z-index:1;
}
.table tr:hover td{ background:var(--hover-bg); }
.table th.tr,.table td.tr{ text-align:right; }
.center{text-align:center}
.muted{ color:var(--muted); }

/* ===== SVG（圓餅圖） ===== */
svg{
  width:100%;
  height:auto;
  display:block;
  border-radius:12px;
  background:linear-gradient(180deg,var(--card-bg), #fbfdff10);
}

/* ===== Toast / 動畫 ===== */
.toast{
  position:fixed;
  right:16px;
  bottom:16px;
  background:#111827;
  color:#fff;
  padding:10px 12px;
  border-radius:10px;
  opacity:.95;
  z-index:70;
  font-size:13px;
}
.fade-enter-active,.fade-leave-active{ transition:.18s; }
.fade-enter-from,.fade-leave-to{ opacity:0; transform:translateY(6px); }

/* ===== RWD ===== */
@media (max-width:1024px){
  .rep-grid{ grid-template-columns:1fr; }
  .rep-kpi{ grid-template-columns:repeat(2,1fr); }
}
@media (max-width:600px){
  .rep-kpi{ grid-template-columns:1fr 1fr; }
}
</style>
