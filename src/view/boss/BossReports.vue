<template>
  <section class="rep-page">
    <!-- 頁首 -->
    <header class="rep-header">
      <div class="title">報表中心（老闆）</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="exportCSV">匯出 CSV</button>
      <button class="btn ghost small" @click="exportPNG">匯出圖表 PNG</button>
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
        <input type="date" class="input" v-model="dateFrom" />
        <span class="muted">—</span>
        <input type="date" class="input" v-model="dateTo" />

        <div class="chips">
          <button class="chip" @click="setRange(7)">近 7 天</button>
          <button class="chip" @click="setRange(30)">近 30 天</button>
          <button class="chip" @click="setRange(90)">近 90 天</button>
        </div>

        <button class="btn" @click="reload">重新整理</button>
      </div>

      <p v-if="!hasOrders && !isMock" class="muted small tip">
        尚未偵測到 Firebase 的 <code>orders</code> 集合，畫面以空資料顯示（不會報錯）。你可在 Firestore 建立集合後，
        透過「系統設置 → 資料來源」切回 Firebase 立即生效。
      </p>
    </div>

    <!-- KPI 區 -->
    <div class="rep-kpi">
      <div class="k card"><div class="cap">訂單數</div><div class="val">{{ kpi.orderCount }}</div></div>
      <div class="k card"><div class="cap">群組數</div><div class="val">{{ kpi.groupKinds }}</div></div>
      <div class="k card"><div class="cap">總數量</div><div class="val">{{ kpi.qtyTotal }}</div></div>
      <div class="k card"><div class="cap">{{ dataMode==='sale' ? '總營收' : '總成本' }}</div><div class="val">$ {{ formatMoney(dataMode==='sale' ? kpi.revenue : kpi.cost) }}</div></div>
      <div class="k card"><div class="cap">{{ dataMode==='sale' ? '平均單價' : '平均成本' }}</div><div class="val">$ {{ formatMoney(kpi.avgUnit) }}</div></div>
    </div>

    <!-- 主內容：圖表 + 表格 -->
    <div class="rep-grid">
      <div class="card">
        <div class="panel-head">
          <div class="h3">圓餅圖：{{ pieTitle }}</div>
          <div class="spacer"></div>

          <!-- 新增：資料類型（銷售 / 已使用 / 報廢） -->
          <select class="input w200" v-model="dataMode">
            <option value="sale">銷售</option>
            <option value="used">已使用</option>
            <option value="waste">報廢</option>
          </select>

          <!-- 新增：群組方式（分類 / 品項） -->
          <select class="input w200" v-model="groupBy">
            <option value="cate">依分類</option>
            <option value="item">依品項</option>
          </select>

          <!-- 既有：指標（營收 / 數量 / 成本） -->
          <select class="input w200" v-model="pieMetric">
            <option value="revenue">依營收</option>
            <option value="quantity">依數量</option>
            <option value="cost">依成本</option>
          </select>
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
              <th class="tr">數量</th>
              <th class="tr">營收</th>
              <th class="tr">成本</th>
              <th class="tr">占比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in tableRows" :key="r.key">
              <td>{{ r.name }}</td>
              <td class="tr">{{ r.qty }}</td>
              <td class="tr">$ {{ formatMoney(r.revenue) }}</td>
              <td class="tr">$ {{ formatMoney(r.cost) }}</td>
              <td class="tr">{{ (r.ratio*100).toFixed(1) }}%</td>
            </tr>
            <tr v-if="!tableRows.length"><td colspan="5" class="center muted">沒有資料</td></tr>
          </tbody>
          <tfoot v-if="tableRows.length">
            <tr>
              <th>合計</th>
              <th class="tr">{{ kpi.qtyTotal }}</th>
              <th class="tr">$ {{ formatMoney(kpi.revenue) }}</th>
              <th class="tr">$ {{ formatMoney(kpi.cost) }}</th>
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
import { ref, reactive, computed, onMounted, nextTick, defineComponent, watch, h } from 'vue'
import { read, subscribe } from '@/store/datasource'

/* ============ 圓餅圖（含中心標籤優化） ============ */
const PieChart = defineComponent({
  name: 'PieChart',
  props: { data: Array, title: String },
  setup(props, { expose }) {
    const svgRef = ref(null)
    const colors = ['#60a5fa','#f472b6','#34d399','#fbbf24','#c084fc','#f87171','#2dd4bf','#a3e635','#fb7185','#93c5fd']
    const polarToXY = (cx,cy,r,angle)=>[ cx + r*Math.cos(angle), cy + r*Math.sin(angle) ]

    const build = () => {
      const svg = svgRef.value; if (!svg) return; svg.innerHTML = ''

      const cx=160, cy=160, r=110, hole=62
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

      // 乾淨中心 + 主/副標
      const inner = document.createElementNS('http://www.w3.org/2000/svg','circle')
      inner.setAttribute('cx', cx); inner.setAttribute('cy', cy); inner.setAttribute('r', hole-3)
      inner.setAttribute('fill', 'var(--card-bg)')
      inner.setAttribute('stroke', 'var(--border)'); inner.setAttribute('stroke-width', '1')
      inner.setAttribute('pointer-events', 'none')
      svg.appendChild(inner)

      const t = String(props.title || '')
      const main = t.replace(/（.*?）/,'').trim()
      const sub  = (t.match(/（(.*?)）/)||[])[1] || ''

      const textMain = document.createElementNS('http://www.w3.org/2000/svg','text')
      ;[
        ['x',cx],['y',cy-4],['text-anchor','middle'],['dominant-baseline','middle'],
        ['fill','var(--text)'],['font-size','14'],['font-weight','700'],['pointer-events','none']
      ].forEach(([k,v])=>textMain.setAttribute(k,String(v)))
      textMain.textContent = main
      svg.appendChild(textMain)

      if (sub) {
        const textSub = document.createElementNS('http://www.w3.org/2000/svg','text')
        ;[
          ['x',cx],['y',cy+14],['text-anchor','middle'],['dominant-baseline','middle'],
          ['fill','var(--muted)'],['font-size','11'],['font-weight','600'],['pointer-events','none']
        ].forEach(([k,v])=>textSub.setAttribute(k,String(v)))
        textSub.textContent = sub
        svg.appendChild(textSub)
      }

      // 圖例
      const legendX=320, legendY=40, step=26
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
      const img=new Image(), w=560, h=320
      const cvs=document.createElement('canvas'); cvs.width=w; cvs.height=h
      const ctx=cvs.getContext('2d')
      await new Promise(res=>{ img.onload=()=>{ ctx.drawImage(img,0,0,w,h); URL.revokeObjectURL(url); res() }; img.src=url })
      const data=cvs.toDataURL('image/png')
      const a=document.createElement('a'); a.href=data; a.download=filename; a.click()
    }

    expose({ downloadPNG })
    return () => h('svg', { ref: svgRef, width: 560, height: 320, viewBox: '0 0 560 320' })
  }
})

/* ============ 資料來源 ============ */
const view = reactive(read())
let unSub = null
onMounted(() => { unSub = subscribe?.(snap => Object.assign(view, snap)) })
watch(() => read?.(), v => Object.assign(view, v||{}), { deep:false })

const stores   = computed(() => Array.isArray(view?.stores) ? view.stores : [])
const hasOrders= computed(() => Array.isArray(view?.orders) && view.orders.length > 0)
const isMock   = computed(() => (localStorage.getItem('ds-mode') || 'mock') === 'mock')

/* ============ 分類定義 ============ */
const CATES = [
  { key:'meat',   name:'肉品'  },
  { key:'veg',    name:'蔬菜'  },
  { key:'drink',  name:'飲料'  },
  { key:'staple', name:'主食'  },
  { key:'other',  name:'其他'  },
]

/* ============ 篩選條件 / 額外選項 ============ */
const scope     = ref('all')   // 'all' | 'single'
const storeId   = ref('')
const dateFrom  = ref(''), dateTo = ref('')

const dataMode  = ref('sale')   // 'sale' | 'used' | 'waste'
const groupBy   = ref('cate')   // 'cate' | 'item'
const pieMetric = ref('revenue')// 'revenue' | 'quantity' | 'cost'

function setRange(days){
  const to=new Date(), from=new Date(); from.setDate(to.getDate()-days+1)
  dateFrom.value = toISO(from); dateTo.value = toISO(to)
}
onMounted(()=>{ setRange(30); storeId.value = stores.value[0]?.id || '' })
watch(stores, (nv)=>{ if(nv?.length && !nv.some(s=>s.id===storeId.value)) storeId.value = nv[0].id })

/* ============ 訂單來源（Firebase 優先；否則用 inventory 生成 mock） ============ */
const orders = computed(() => {
  if (hasOrders.value) return view.orders
  return genOrdersFromInventory(view.inventory || [], stores.value, dateFrom.value, dateTo.value)
})

function hash32(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=(h*16777619)>>>0 } return h>>>0 }
function rng(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/0xffffffff } }

/** 由 inventory 生成含三種資料型別的訂單：
 *  kind: 'sale' | 'used' | 'waste'
 *  group: cate / itemName
 *  price: 銷售單價；cost: 單位成本（~0.55*price 或隨機）
 */
function genOrdersFromInventory(inventory, storeList, from, to){
  if (!inventory?.length || !storeList?.length || !from || !to) return []
  const f=new Date(from), t=new Date(to), out=[]
  for(let ts=f.getTime(); ts<=t.getTime(); ts+=86400000){
    const ds = toISO(new Date(ts))
    for(const s of storeList){
      const rnd = rng(hash32(s.id+'|'+ds))
      const n = 5 + Math.floor(rnd()*6) // 每天 5~10 筆混合資料
      for(let i=0;i<n;i++){
        const pick = inventory[Math.floor(rnd()*inventory.length)]
        const cate = CATES[Math.floor(rnd()*CATES.length)]
        const kindR = rnd()
        const kind = kindR < .6 ? 'sale' : (kindR < .85 ? 'used' : 'waste') // 60% 銷售，25% 使用，15% 報廢
        const qty  = 3 + Math.floor(rnd()*60)
        const price= 20 + Math.floor(rnd()*180)
        const cost = Math.max(1, Math.round((0.45 + rnd()*0.25) * price)) // 約售價的 45% ~ 70%
        out.push({
          id:`${ds}-${s.id}-${i}`,
          date:ds, storeId:s.id,
          kind,
          cate:cate.key,
          itemName: pick?.name || pick?.sku || '未命名品項',
          qty,
          price,
          cost
        })
      }
    }
  }
  return out
}
function toISO(d){ const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}` }

/* ============ 篩選後資料 ============ */
const filtered = computed(()=>{
  const f=dateFrom.value||'0000-00-00', t=dateTo.value||'9999-12-31'
  return (orders.value||[]).filter(o=>{
    if (!(o.date>=f && o.date<=t)) return false
    if (scope.value==='single' && storeId.value && o.storeId!==storeId.value) return false
    return o.kind === dataMode.value
  })
})

/* ============ KPI ============ */
const kpi = computed(()=>{
  const set=filtered.value
  const orderCount=new Set(set.map(o=>o.date+'|'+o.storeId)).size
  const groupKinds = new Set(set.map(o => groupBy.value==='cate' ? o.cate : o.itemName)).size
  const qtyTotal  =set.reduce((s,o)=>s+o.qty,0)
  const revenue   =set.reduce((s,o)=>s+(o.kind==='sale' ? o.qty*o.price : 0),0)
  const cost      =set.reduce((s,o)=>s+o.qty*o.cost,0)
  const avgUnit   = qtyTotal
    ? (dataMode.value==='sale' ? revenue/qtyTotal : cost/qtyTotal)
    : 0
  return { orderCount, groupKinds, qtyTotal, revenue, cost, avgUnit }
})

/* ============ 圓餅圖資料 / 表格資料 ============ */
const pieTitle = computed(()=>{
  const scopeName = groupBy.value==='cate' ? '依分類' : '依品項'
  const metricName = pieMetric.value==='revenue' ? '營收' : pieMetric.value==='cost' ? '成本' : '數量'
  const modeName = dataMode.value==='sale' ? '銷售' : dataMode.value==='used' ? '已使用' : '報廢'
  return `${modeName} - ${scopeName}（${metricName}）`
})

function aggValue(o){
  if (pieMetric.value==='quantity') return o.qty
  if (pieMetric.value==='cost') return o.qty * o.cost
  // 'revenue'
  return o.kind==='sale' ? o.qty * o.price : 0
}

const grouped = computed(()=>{
  const map = new Map()
  for(const o of filtered.value){
    const key = groupBy.value==='cate' ? o.cate : o.itemName
    const name = groupBy.value==='cate' ? (CATES.find(c=>c.key===o.cate)?.name || '其他') : o.itemName
    if(!map.has(key)) map.set(key, { key, name, qty:0, revenue:0, cost:0, value:0 })
    const r = map.get(key)
    r.qty     += o.qty
    r.revenue += (o.kind==='sale' ? o.qty*o.price : 0)
    r.cost    += o.qty*o.cost
    r.value   += aggValue(o)
  }
  return Array.from(map.values())
})

const pieData = computed(()=>{
  const total = grouped.value.reduce((s,r)=>s+r.value,0) || 1
  return grouped.value
    .filter(r=>r.value>0)
    .sort((a,b)=>b.value-a.value)
    .map(r=>({ name:r.name, ratio:r.value/total }))
})

const tableRows = computed(()=>{
  const total = grouped.value.reduce((s,r)=>s+r.value,0) || 1
  return grouped.value
    .sort((a,b)=> (pieMetric.value==='quantity' ? b.qty-a.qty
                    : pieMetric.value==='cost' ? b.cost-a.cost
                    : b.revenue-a.revenue))
    .map(r=>({ ...r, ratio: r.value/total }))
})

/* 重新整理（computed 已即時，保留按鈕體驗） */
function reload(){}

/* 匯出 */
function escapeCSV(v){ const s=String(v??''); return /[,"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s }
function formatMoney(n){ return (n||0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',') }

function exportCSV(){
  const rows = [
    ['資料源', isMock.value ? '假資料（seed）' : 'Firebase'],
    ['店面範圍', scope.value==='all' ? '全部店面' : (stores.value.find(s=>s.id===storeId.value)?.name || '—')],
    ['日期區間', `${dateFrom.value||'—'} ~ ${dateTo.value||'—'}`],
    ['資料類型', dataMode.value==='sale' ? '銷售' : dataMode.value==='used' ? '已使用' : '報廢'],
    ['群組方式', groupBy.value==='cate' ? '依分類' : '依品項'],
    ['圖表指標', pieMetric.value==='revenue' ? '營收' : pieMetric.value==='cost' ? '成本' : '數量'],
    [],
    [groupBy.value==='cate' ? '分類' : '品項','數量','營收','成本','占比'],
    ...tableRows.value.map(r=>[
      r.name, r.qty, r.revenue, r.cost, (r.ratio*100).toFixed(1)+'%'
    ]),
    tableRows.value.length ? ['合計', kpi.value.qtyTotal, kpi.value.revenue, kpi.value.cost, '100%'] : []
  ]
  const csv = rows.filter(r=>r.length).map(r => r.map(escapeCSV).join(',')).join('\n')
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a=document.createElement('a'); a.href=url; a.download='report.csv'; a.click()
  URL.revokeObjectURL(url)
}

const pieRef = ref(null)
async function exportPNG(){ await pieRef.value?.downloadPNG?.(`report-pie-${dataMode.value}-${groupBy.value}-${pieMetric.value}.png`) }

/* Toast / 主題同步 */
const toastMsg = ref(''); function toast(m){ toastMsg.value=m; setTimeout(()=>toastMsg.value='',1400) }
onMounted(() => {
  const theme = localStorage.getItem('theme') || 'auto'
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const shouldDark = theme === 'dark' || (theme === 'auto' && prefersDark)
  document.documentElement.classList.toggle('dark', !!shouldDark)
})
</script>

<style scoped>
/* ===== 版面骨架（不變） ===== */
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
.spacer{ flex:1; }

/* ===== 控件（不變） ===== */
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
.w200{ width:200px } .w220{ width:220px }
.tip{ margin:8px 0 0; }

/* ===== KPI（不變） ===== */
.rep-kpi{
  display:grid;
  grid-template-columns:repeat(5, minmax(120px,1fr));
  gap:10px;
  margin:10px 0 12px;
}
.k .cap{ color:var(--muted); font-size:12px; }
.k .val{ font-weight:800; font-size:20px; margin-top:2px; }

/* ===== 主區塊（不變） ===== */
.rep-toolbar{ margin-bottom:10px; }
.rep-grid{ display:grid; grid-template-columns:1.1fr 1fr; gap:12px; }
.panel-head{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.h3{ margin:0 0 4px; font-weight:800; }

/* ===== 表格（不變，支援多欄） ===== */
.table-wrap{ overflow:auto; }
.table{
  width:100%;
  border-collapse:collapse;
  min-width:680px;
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

/* ===== SVG（圓餅圖）保持不變外觀 ===== */
svg{
  width:100%;
  height:auto;
  display:block;
  border-radius:12px;
  background:linear-gradient(180deg,var(--card-bg), #fbfdff10);
}

/* ===== Toast / 動畫（不變） ===== */
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

/* ===== RWD（不變） ===== */
@media (max-width:1024px){
  .rep-grid{ grid-template-columns:1fr; }
  .rep-kpi{ grid-template-columns:repeat(2,1fr); }
}
@media (max-width:600px){
  .rep-kpi{ grid-template-columns:1fr 1fr; }
}
</style>
