<template>
  <section>
    <div class="main-head">
      <div class="h2">檢視報表</div>
      <div class="spacer"></div>
      <div style="display:flex;gap:6px;align-items:center">
        <label class="muted small">起</label><input type="date" class="input sm" v-model="from">
        <label class="muted small">迄</label><input type="date" class="input sm" v-model="to">
        <button class="btn" @click="recalc">套用</button>
        <button class="btn ghost small" @click="exportCSV">匯出 CSV</button>
        <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="h2">出貨品項占比（{{ scope.storeName }}）</div>
        <div style="display:flex;gap:16px;align-items:center;justify-content:center;margin-top:8px">
          <div style="position:relative;width:220px;height:220px;display:flex;align-items:center;justify-content:center">
            <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" role="img">
              <g :transform="`translate(${size/2},${size/2})`">
                <template v-for="(s,i) in slices" :key="i">
                  <path :d="arcPath(s.start,s.end,outerR,innerR)" :fill="colors[i%colors.length]" />
                </template>
              </g>
            </svg>
            <div style="position:absolute;font-size:20px;font-weight:800">{{ totalQty }}</div>
          </div>
          <div class="legend">
            <div class="lg" v-for="(row,i) in rows" :key="row.name">
              <span class="dot" :style="{background:colors[i%colors.length]}"></span>
              <span>{{ row.name }}</span>
              <span class="muted">/ {{ row.unit }}</span>
              <span style="margin-left:auto;font-weight:700">{{ row.qty }}</span>
            </div>
          </div>
        </div>
        <p class="tiny muted" style="margin-top:6px">* 單店彙總，員工不可切換他店</p>
      </div>

      <div class="card">
        <div class="h2">明細</div>
        <div class="table" style="margin-top:8px">
          <div class="th">
            <div class="spacer">品名</div>
            <div style="width:120px">單位</div>
            <div style="width:120px">數量</div>
          </div>
          <div class="tr" v-for="row in rows" :key="row.name">
            <div class="spacer">{{ row.name }}</div>
            <div style="width:120px">{{ row.unit }}</div>
            <div style="width:120px">{{ row.qty }}</div>
          </div>
          <div class="tr" style="font-weight:700">
            <div class="spacer">合計</div>
            <div style="width:120px">—</div>
            <div style="width:120px">{{ totalQty }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useScope } from '@/store/scope'

const scope = useScope()
const today = ()=> new Date().toISOString().slice(0,10)
const from = ref(today()), to = ref(today())

function safeParse(raw, fallback){ try{ return JSON.parse(raw) }catch{ return fallback } }
function getOrders(){
  const raw = localStorage.getItem(`emp-orders-${scope.storeId}`)
  const obj = safeParse(raw, { ord:[] })
  return (obj.ord || []).filter(o => o.storeId === scope.storeId)
}

const rows = ref([])
function recalc(){
  const list = getOrders().filter(o => o.date >= from.value && o.date <= to.value)
  const map = new Map()
  list.forEach(o => o.items.forEach(it=>{
    const k = it.name + '|' + it.unit
    map.set(k, (map.get(k)||0) + (+it.qty||0))
  }))
  rows.value = Array.from(map.entries()).map(([k,qty])=>{
    const [name,unit] = k.split('|'); return { name, unit, qty }
  }).sort((a,b)=> b.qty - a.qty)
}
const totalQty = computed(()=> rows.value.reduce((s,r)=>s+(+r.qty||0),0))

/* 圓餅（純 SVG） */
const size=220, outerR=100, innerR=60
const colors = ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6','#22d3ee']
const slices = computed(()=>{
  const sum = totalQty.value || 1; let acc=0
  return rows.value.map(r => { const start=acc, end=acc+(r.qty/sum)*Math.PI*2; acc=end; return {start,end} })
})
function arcPath(start, end, R, r){
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
  const lines = rows.value.map(r => `${r.name},${r.unit},${r.qty}`).join('\n')
  const blob = new Blob([header+lines], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=`report-${scope.storeId}.csv`; a.click()
  URL.revokeObjectURL(url)
}
function exportJSON(){
  const blob = new Blob([JSON.stringify({from:from.value,to:to.value,rows:rows.value},null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=`report-${scope.storeId}.json`; a.click()
  URL.revokeObjectURL(url)
}

onMounted(()=> recalc())
</script>
