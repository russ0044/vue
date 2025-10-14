<template>
  <section class="rep-page">
    <!-- 頁首 -->
    <header class="rep-header">
      <div class="title">報表中心（老闆）</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="exportCSV">匯出 CSV</button>
      <button class="btn ghost small" @click="exportPNG">匯出圖表 PNG</button>
      <button class="icon-btn" title="頁面設定" @click="toast('尚未實作：頁面設定')">⚙</button>
    </header>

    <!-- 篩選列 -->
    <div class="rep-toolbar card-lite">
      <div class="row gap">
        <label class="label">店面</label>
        <div class="seg">
          <button :class="['segbtn', scope==='all' && 'active']" @click="scope='all'">全部店面</button>
          <button :class="['segbtn', scope==='single' && 'active']" @click="scope='single'">單一店面</button>
        </div>
        <select v-if="scope==='single'" v-model="storeId" class="input w220">
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <div class="spacer"></div>

        <label class="label">日期</label>
        <input type="date" class="input" v-model="dateFrom">
        <span class="muted">—</span>
        <input type="date" class="input" v-model="dateTo">

        <div class="chips">
          <button class="chip" @click="setRange(7)">近 7 天</button>
          <button class="chip" @click="setRange(30)">近 30 天</button>
          <button class="chip" @click="setRange(90)">近 90 天</button>
        </div>

        <button class="btn" @click="reload">重新整理</button>
      </div>
    </div>

    <!-- KPI -->
    <div class="rep-kpi">
      <div class="k card"><div class="cap">訂單數</div><div class="val">{{ kpi.orderCount }}</div></div>
      <div class="k card"><div class="cap">品項數</div><div class="val">{{ kpi.itemKinds }}</div></div>
      <div class="k card"><div class="cap">總數量</div><div class="val">{{ kpi.qtyTotal }}</div></div>
      <div class="k card"><div class="cap">總營收</div><div class="val">$ {{ formatMoney(kpi.revenue) }}</div></div>
      <div class="k card"><div class="cap">平均單價</div><div class="val">$ {{ formatMoney(kpi.avgPrice) }}</div></div>
    </div>

    <!-- 主內容：圖表 + 表格 -->
    <div class="rep-grid">
      <div class="card">
        <div class="panel-head">
          <div class="h3">圓餅圖：營收構成</div>
          <div class="spacer"></div>
          <select class="input w200" v-model="pieMode">
            <option value="revenue">依營收</option>
            <option value="quantity">依數量</option>
          </select>
        </div>
        <PieChart ref="pieRef" :data="pieData" :title="pieMode==='revenue' ? '營收構成' : '數量構成'"/>
      </div>

      <div class="card table-wrap">
        <div class="panel-head"><div class="h3">分類明細</div></div>
        <table class="table">
          <thead>
            <tr><th>分類</th><th class="tr">數量</th><th class="tr">營收</th><th class="tr">占比</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in tableRows" :key="r.key">
              <td>{{ r.name }}</td>
              <td class="tr">{{ r.qty }}</td>
              <td class="tr">$ {{ formatMoney(r.revenue) }}</td>
              <td class="tr">{{ (r.ratio*100).toFixed(1) }}%</td>
            </tr>
            <tr v-if="!tableRows.length"><td colspan="4" class="center muted">沒有資料</td></tr>
          </tbody>
          <tfoot v-if="tableRows.length">
            <tr><th>合計</th><th class="tr">{{ kpi.qtyTotal }}</th><th class="tr">$ {{ formatMoney(kpi.revenue) }}</th><th class="tr">100%</th></tr>
          </tfoot>
        </table>
      </div>
    </div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, defineComponent, watch, h } from 'vue'

/* ================= 圓餅圖子元件（無 JSX） ================= */
const PieChart = defineComponent({
  name: 'PieChart',
  props: {
    data:  { type: Array,  default: () => [] }, // [{name, value, ratio}]
    title: { type: String, default: '' }
  },
  setup(props, { expose }) {
    const svgRef = ref(null)
    const colors = [
      '#60a5fa','#f472b6','#34d399','#fbbf24','#c084fc',
      '#f87171','#2dd4bf','#a3e635','#fb7185','#93c5fd'
    ]
    const polarToXY = (cx,cy,r,angle)=>[ cx + r*Math.cos(angle), cy + r*Math.sin(angle) ]

    const build = () => {
      const svg = svgRef.value
      if (!svg) return
      svg.innerHTML = ''
      const cx=160, cy=160, r=110, hole=60
      let start = -Math.PI/2

      const g = document.createElementNS('http://www.w3.org/2000/svg','g')
      svg.appendChild(g)

      props.data.forEach((d,i)=>{
        const angle = (d.ratio||0)*Math.PI*2
        const end = start + angle
        const [x1,y1] = polarToXY(cx,cy,r,start)
        const [x2,y2] = polarToXY(cx,cy,r,end)
        const large = angle > Math.PI ? 1 : 0
        const [ix1,iy1] = polarToXY(cx,cy,hole,end)
        const [ix2,iy2] = polarToXY(cx,cy,hole,start)
        const path = document.createElementNS('http://www.w3.org/2000/svg','path')
        path.setAttribute('d',[
          `M ${x1} ${y1}`,
          `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
          `L ${ix1} ${iy1}`,
          `A ${hole} ${hole} 0 ${large} 0 ${ix2} ${iy2}`,
          'Z'
        ].join(' '))
        path.setAttribute('fill', colors[i%colors.length])
        path.setAttribute('stroke','#fff')
        path.setAttribute('stroke-width','1')
        g.appendChild(path)
        start = end
      })

      // 中心標題
      const t = document.createElementNS('http://www.w3.org/2000/svg','text')
      Object.entries({
        x:cx, y:cy, 'text-anchor':'middle','dominant-baseline':'middle',
        fill:'#334155','font-size':'14'
      }).forEach(([k,v])=>t.setAttribute(k, v))
      t.textContent = props.title || ''
      svg.appendChild(t)

      // 圖例
      const legendX = 320, legendY = 40, step = 26
      props.data.forEach((d,i)=>{
        const y = legendY + i*step
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect')
        rect.setAttribute('x',legendX); rect.setAttribute('y',y-10)
        rect.setAttribute('width',14); rect.setAttribute('height',14); rect.setAttribute('rx',3)
        rect.setAttribute('fill', colors[i%colors.length])
        svg.appendChild(rect)

        const txt = document.createElementNS('http://www.w3.org/2000/svg','text')
        txt.setAttribute('x',legendX+22); txt.setAttribute('y', y+2)
        txt.setAttribute('fill','#475569'); txt.setAttribute('font-size','13')
        txt.textContent = `${d.name}：${(d.ratio*100||0).toFixed(1)}%`
        svg.appendChild(txt)
      })
    }

    watch(()=>[props.data, props.title], ()=>nextTick(build), { deep:true })
    onMounted(()=> nextTick(build))

    // 匯出 PNG（把 SVG 畫到 Canvas）
    const downloadPNG = async (filename='pie.png')=>{
      const svg = svgRef.value
      if (!svg) return
      const xml  = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([xml], {type:'image/svg+xml;charset=utf-8'})
      const url  = URL.createObjectURL(blob)

      const img = new Image()
      const w=560, h=320
      const cvs = document.createElement('canvas'); cvs.width=w; cvs.height=h
      const ctx = cvs.getContext('2d')

      await new Promise(resolve=>{
        img.onload = ()=>{ ctx.drawImage(img,0,0,w,h); URL.revokeObjectURL(url); resolve() }
        img.src = url
      })

      const data = cvs.toDataURL('image/png')
      const a = document.createElement('a'); a.href=data; a.download=filename; a.click()
    }

    expose({ downloadPNG })
    // 這裡改用 h()，不使用 JSX
    return () => h('svg', { ref: svgRef, width: 560, height: 320, viewBox: '0 0 560 320' })
  }
})

/* ================= 假資料層（之後可換 Firebase API） ================= */
function loadStores () {
  const raw = localStorage.getItem('rep-stores')
  if (raw) { try { return JSON.parse(raw) } catch {} }
  const seed = [
    { id:'s1', name:'某某餐飲-總店' },
    { id:'s2', name:'某某餐飲-東門店' },
    { id:'s3', name:'某某餐飲-西門店' },
  ]
  localStorage.setItem('rep-stores', JSON.stringify(seed))
  return seed
}
const CATES = [
  { key:'meat', name:'肉品' },{ key:'veg', name:'蔬菜' },
  { key:'drink', name:'飲料' },{ key:'staple', name:'主食' },
  { key:'other', name:'其他' },
]
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min }
function genSeedOrders(stores){
  const today=new Date(), days=120, list=[]
  for(let d=0; d<days; d++){
    const dt = new Date(today); dt.setDate(today.getDate()-d)
    const ds = dt.toISOString().slice(0,10)
    for(const s of stores){
      const n=rnd(2,6)
      for(let i=0;i<n;i++){
        const cate=CATES[rnd(0,CATES.length-1)]
        const qty=rnd(5,60), price=rnd(20,200)
        list.push({ id:`${ds}-${s.id}-${i}-${cate.key}`, date:ds, storeId:s.id, cate:cate.key, qty, price })
      }
    }
  }
  return list
}
function loadOrders(stores){
  const raw = localStorage.getItem('rep-orders')
  if (raw) { try { return JSON.parse(raw) } catch {} }
  const seed = genSeedOrders(stores)
  localStorage.setItem('rep-orders', JSON.stringify(seed))
  return seed
}

/* ================= 狀態/計算 ================= */
const stores = ref([])
const orders = ref([])

const scope   = ref('all')   // 'all' | 'single'
const storeId = ref('')
const dateFrom = ref(''), dateTo = ref('')

function setRange(days){
  const to=new Date(), from=new Date(); from.setDate(to.getDate()-days+1)
  dateFrom.value = from.toISOString().slice(0,10)
  dateTo.value   = to.toISOString().slice(0,10)
}
onMounted(()=>{
  stores.value = loadStores()
  orders.value = loadOrders(stores.value)
  setRange(30)
  storeId.value = stores.value[0]?.id || ''
})

const filtered = computed(()=>{
  const f=dateFrom.value||'0000-00-00', t=dateTo.value||'9999-12-31'
  return orders.value.filter(o=>{
    if (!(o.date>=f && o.date<=t)) return false
    if (scope.value==='single' && storeId.value) return o.storeId===storeId.value
    return true
  })
})

const kpi = computed(()=>{
  const set=filtered.value
  const orderCount=new Set(set.map(o=>o.date+o.storeId)).size
  const itemKinds =new Set(set.map(o=>o.cate)).size
  const qtyTotal  =set.reduce((s,o)=>s+o.qty,0)
  const revenue   =set.reduce((s,o)=>s+o.qty*o.price,0)
  const avgPrice  =qtyTotal?revenue/qtyTotal:0
  return { orderCount,itemKinds,qtyTotal,revenue,avgPrice }
})

const pieMode = ref('revenue')
const pieData = computed(()=>{
  const base = CATES.map(c=>({ key:c.key, name:c.name, value:0 }))
  for(const o of filtered.value){
    const i=base.findIndex(b=>b.key===o.cate)
    if(i>=0) base[i].value += (pieMode.value==='revenue'? o.qty*o.price : o.qty)
  }
  const total=base.reduce((s,x)=>s+x.value,0)
  return base.map(x=>({ ...x, ratio: total? x.value/total : 0 }))
})

const tableRows = computed(()=>{
  const qtyByCate = k => filtered.value.filter(o=>o.cate===k).reduce((s,o)=>s+o.qty,0)
  const revenueByCate = k => filtered.value.filter(o=>o.cate===k).reduce((s,o)=>s+o.qty*o.price,0)
  return pieData.value
    .filter(r=>r.value>0)
    .sort((a,b)=>b.value-a.value)
    .map(r=>({ key:r.key, name:r.name, qty:qtyByCate(r.key), revenue:revenueByCate(r.key), ratio:r.ratio }))
})

function reload(){ nextTick(()=>{}) }

/* 匯出 CSV / PNG */
function exportCSV(){
  const rows = [
    ['店面範圍', scope.value==='all' ? '全部店面' : (stores.value.find(s=>s.id===storeId.value)?.name || '—')],
    ['日期區間', `${dateFrom.value||'—'} ~ ${dateTo.value||'—'}`],
    [],
    ['分類','數量','營收','占比'],
    ...tableRows.value.map(r=>[ r.name, r.qty, r.revenue, (r.ratio*100).toFixed(1)+'%' ]),
    ['合計', kpi.value.qtyTotal, kpi.value.revenue, '100%']
  ]
  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n')
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='report.csv'; a.click()
  URL.revokeObjectURL(url)
}
function escapeCSV(v){ const s=String(v??''); return /[,"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s }

const pieRef = ref(null)
async function exportPNG(){ await pieRef.value?.downloadPNG?.(`report-pie-${pieMode.value}.png`) }

/* UI 小工具 */
function formatMoney(n){ return (n||0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',') }
const toastMsg = ref(''); function toast(m){ toastMsg.value=m; setTimeout(()=>toastMsg.value='',1400) }
</script>

<style scoped>
/* 命名空間 rep-；不使用 100vh，避免影響你的左側總功能欄 */
.rep-page{ padding:16px; background:#f6f8fc; min-height:100%; height:auto; overflow:visible; }
.rep-header{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.title{ font-size:20px; font-weight:800; }
.icon-btn{ border:none; background:transparent; cursor:pointer; font-size:18px; opacity:.85; }
.icon-btn:hover{ opacity:1; }
.spacer{ flex:1; }

/* 控件 */
.btn{ border:1px solid #cfe0ff; background:#fff; color:#2563eb; border-radius:10px; padding:8px 12px; cursor:pointer }
.btn.primary{ background:#2563eb; border-color:#2563eb; color:#fff }
.btn.ghost{ border-color:#e6eaf2; color:#334155; background:#fff }
.btn.small{ padding:6px 10px }
.card{ background:#fff; border:1px solid #e6eaf2; border-radius:16px; padding:12px; min-width:0; }
.card-lite{ background:#fff; border:1px dashed #e6eaf2; border-radius:12px; padding:10px; }
.row{ display:flex; align-items:center; gap:8px; flex-wrap:wrap }
.input{ border:1px solid #e6eaf2; border-radius:10px; padding:8px 10px; outline:none; background:#fff; }
.input:focus{ border-color:#9ec5ff; box-shadow:0 0 0 3px rgba(99,162,255,.15) }
.label{ min-width:56px; color:#475569 }
.chips{ display:flex; gap:8px; flex-wrap:wrap }
.chip{ border:1px solid #e6eaf2; border-radius:999px; background:#fff; padding:6px 10px; cursor:pointer }
.seg{ display:flex; gap:6px }
.segbtn{ border:1px solid #e6eaf2; background:#fff; border-radius:10px; padding:6px 10px; cursor:pointer }
.segbtn.active{ background:#e6f4ff; border-color:#cfe9ff }
.w200{ width:200px } .w220{ width:220px }

/* KPI */
.rep-kpi{ display:grid; grid-template-columns:repeat(5, minmax(120px,1fr)); gap:10px; margin:10px 0 12px }
.k .cap{ color:#64748b; font-size:12px }
.k .val{ font-weight:800; font-size:20px; margin-top:2px }

/* 主區塊 */
.rep-toolbar{ margin-bottom:10px }
.rep-grid{ display:grid; grid-template-columns:1.1fr 1fr; gap:12px }
.panel-head{ display:flex; align-items:center; gap:8px; margin-bottom:8px }
.h3{ margin:0 0 4px; font-weight:800 }
.table-wrap{ overflow:auto }
.table{ width:100%; border-collapse:collapse; min-width:520px }
.table th,.table td{ padding:10px; border-bottom:1px solid #eef2f6; text-align:left }
.table th.tr,.table td.tr{ text-align:right }
.center{text-align:center}
.muted{ color:#64748b }

/* SVG */
svg{ width:100%; height:auto; display:block; border-radius:12px; background:linear-gradient(180deg,#fff, #fbfdff) }
.toast{ position:fixed; right:16px; bottom:16px; background:#111827; color:#fff; padding:10px 12px; border-radius:10px; opacity:.95; z-index:70; }
.fade-enter-active,.fade-leave-active{ transition:.18s }
.fade-enter-from,.fade-leave-to{ opacity:0; transform:translateY(6px) }

/* RWD */
@media (max-width:1024px){
  .rep-grid{ grid-template-columns:1fr }
  .rep-kpi{ grid-template-columns:repeat(2,1fr) }
}
@media (max-width:600px){
  .rep-kpi{ grid-template-columns:1fr 1fr }
}
</style>
