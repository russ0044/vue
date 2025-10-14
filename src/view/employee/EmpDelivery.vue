<template>
  <section>
    <div class="main-head">
      <div class="h2">配送情況</div>
      <div class="spacer"></div>
      <div style="display:flex;gap:6px;align-items:center">
        <label class="muted small">來源</label>
        <select v-model="dataSource.mode" class="input sm" @change="onModeChanged">
          <option value="local">Local（假資料）</option>
          <option value="firebase">Firebase（預留）</option>
        </select>
        <button class="btn ghost small" @click="exportJSON">匯出</button>
        <label class="btn ghost small file-btn">
          匯入 <input type="file" accept="application/json" @change="importJSON">
        </label>
      </div>
    </div>

    <div class="two-col">
      <aside class="side" :class="{open:drawerOpen}">
        <div class="side-head">
          <div style="display:flex;gap:8px;align-items:center">
            <label class="muted">日期</label>
            <input class="input" type="date" v-model="dateStr">
          </div>
          <div class="seg" style="margin-top:8px">
            <button :class="['segbtn', status==='all' && 'active']" @click="status='all'">全部</button>
            <button :class="['segbtn', status==='preparing' && 'active']" @click="status='preparing'">準備中</button>
            <button :class="['segbtn', status==='shipping' && 'active']"  @click="status='shipping'">運送中</button>
            <button :class="['segbtn', status==='arrived' && 'active']"   @click="status='arrived'">已到店</button>
          </div>
        </div>

        <div class="side-list">
          <div class="side-item" v-for="d in list" :key="d.id" :class="{active:d.id===selectedId}" @click="selectLeft(d.id)">
            <div class="grow">
              <div style="font-weight:700">{{ d.no }}</div>
              <div class="muted small">{{ d.date }}｜{{ d.items.length }} 項</div>
            </div>
            <div class="badge" :class="d.status">
              {{ text(d.status) }}
            </div>
          </div>
          <p v-if="!list.length" class="muted center">沒有配送單</p>
        </div>
      </aside>

      <transition name="fade"><div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false"></div></transition>

      <main class="card">
        <div class="main-head">
          <div class="h2">配送單詳情</div>
          <div class="spacer"></div>
          <button class="btn" :disabled="!cur || cur.status==='arrived'" @click="nextStage">狀態前進</button>
        </div>

        <div v-if="!cur" class="center muted" style="padding:24px">🚚 請從左側選擇一筆配送單</div>
        <div v-else>
          <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px dashed var(--border)">
            <div>門市：{{ scope.storeName }}</div>
            <div>日期：{{ cur.date }}</div>
          </div>
          <div style="padding:12px">
            <div style="font-weight:800;margin-bottom:6px">配送單號：{{ cur.no }}</div>
            <div class="muted small">狀態：{{ text(cur.status) }}</div>
          </div>
          <div class="table" style="margin:12px">
            <div class="th">
              <div class="spacer">品名</div>
              <div style="width:120px">單位</div>
              <div style="width:120px">數量</div>
            </div>
            <div class="tr" v-for="it in cur.items" :key="it.key">
              <div class="spacer">{{ it.name }}</div>
              <div style="width:120px">{{ it.unit }}</div>
              <div style="width:120px">{{ it.qty }}</div>
            </div>
          </div>
          <div style="padding:12px">
            <div style="font-weight:800;margin-bottom:6px">備註</div>
            <div class="muted">{{ cur.note || '—' }}</div>
          </div>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useScope } from '@/store/scope'

const scope = useScope()
const rid = ()=> 'id-' + Math.random().toString(36).slice(2,10)
const today = ()=> new Date().toISOString().slice(0,10)
const text = s => s==='preparing'?'準備中': s==='shipping'?'運送中':'已到店'

const dataSource = reactive({ mode: localStorage.getItem('emp-delivery-mode') || 'local', async fetchAll(){ loadDB() } })
function onModeChanged(){ localStorage.setItem('emp-delivery-mode', dataSource.mode) }

const db = reactive({ deliveries:[] })
function saveDB(){ localStorage.setItem(`emp-delivery-${scope.storeId}`, JSON.stringify(db)) }
function loadDB(){
  const raw = localStorage.getItem(`emp-delivery-${scope.storeId}`)
  if (raw){ try{ Object.assign(db, JSON.parse(raw)); return }catch{ localStorage.removeItem(`emp-delivery-${scope.storeId}`) } }
  db.deliveries = [
    { id:rid(), storeId:scope.storeId, date:today(), no:'DL-' + Math.floor(Math.random()*900+100),
      status:'preparing', note:'', items:[{key:rid(),name:'新鮮雞腿',unit:'份',qty:30},{key:rid(),name:'豬骨高湯',unit:'桶',qty:1}] },
    { id:rid(), storeId:scope.storeId, date:today(), no:'DL-' + Math.floor(Math.random()*900+100),
      status:'shipping', note:'低溫配送', items:[{key:rid(),name:'新鮮豬腿',unit:'公斤',qty:20}] },
  ]
  saveDB()
}

const drawerOpen = ref(false)
const dateStr = ref(today())
const status = ref('all')
const selectedId = ref(null)

const list = computed(()=> db.deliveries
  .filter(d => d.storeId===scope.storeId && d.date===dateStr.value)
  .filter(d => status.value==='all' ? true : d.status===status.value)
)
const cur = computed(()=> db.deliveries.find(d=>d.id===selectedId.value) || null)
function selectLeft(id){ selectedId.value=id; drawerOpen.value=false }
function nextStage(){ if (!cur.value) return; cur.value.status = cur.value.status==='preparing' ? 'shipping' : 'arrived'; saveDB() }

function exportJSON(){
  const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob); const a=document.createElement('a')
  a.href=url; a.download=`emp-delivery-${scope.storeId}.json`; a.click(); URL.revokeObjectURL(url)
}
function importJSON(e){
  const f = e.target.files?.[0]; if(!f) return
  const reader = new FileReader()
  reader.onload=()=>{
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj || !Array.isArray(obj.deliveries)) throw new Error()
      db.deliveries = obj.deliveries; saveDB()
    }catch{ /* 略 */ }
  }
  reader.readAsText(f,'utf-8')
}

onMounted(()=> dataSource.fetchAll())
</script>
