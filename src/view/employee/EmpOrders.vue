<template>
  <section>
    <div class="main-head">
      <div class="h2">訂單情況</div>
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
            <button :class="['segbtn', tab==='req' && 'active']" @click="tab='req'">請貨</button>
            <button :class="['segbtn', tab==='ord' && 'active']" @click="tab='ord'">訂單</button>
          </div>
          <div style="margin-top:8px">
            <button class="btn primary w100" @click="quickNew" v-can="'orders.create'">＋ 新增請貨</button>
          </div>
        </div>

        <div class="side-list" v-if="tab==='req'">
          <div class="side-item" v-for="r in reqList" :key="r.id" :class="{active: r.id===selectedId}" @click="selectLeft(r.id)">
            <div class="grow">
              <div style="font-weight:700">{{ r.date }}</div>
              <div class="muted small">品項：{{ r.items.length }}</div>
            </div>
            <div class="badge" :class="r.status">{{ r.status==='pending'?'待送出':'已送出' }}</div>
          </div>
          <p v-if="!reqList.length" class="muted center">沒有請貨單</p>
        </div>

        <div class="side-list" v-else>
          <div class="side-item" v-for="o in ordList" :key="o.id" :class="{active: o.id===selectedId}" @click="selectLeft(o.id)">
            <div class="grow">
              <div style="font-weight:700">{{ o.date }}</div>
              <div class="muted small">品項：{{ o.items.length }}</div>
            </div>
            <div class="badge primary">訂單</div>
          </div>
          <p v-if="!ordList.length" class="muted center">沒有訂單</p>
        </div>
      </aside>

      <transition name="fade"><div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false"></div></transition>

      <main class="card">
        <div class="main-head">
          <div class="h2">{{ tab==='req'?'請貨單':'訂單' }}</div>
          <div class="spacer"></div>
          <template v-if="tab==='req' && currentReq">
            <button class="btn" v-can="'orders.create'" @click="addLine">新增品項</button>
            <button class="btn" v-can="'orders.create'" @click="removeZero">移除 0 件</button>
            <button class="btn primary" v-can="'orders.create'" @click="submitRequest">送出請貨</button>
          </template>
          <template v-else-if="tab==='ord' && currentOrd">
            <button class="btn" @click="print">列印</button>
          </template>
        </div>

        <!-- 請貨單 -->
        <template v-if="tab==='req'">
          <div v-if="!currentReq" class="center muted" style="padding:24px">📄 請從左側選取或新增請貨單</div>
          <div v-else>
            <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px dashed var(--border)">
              <div>門市：{{ scope.storeName }}</div>
              <div>日期：<input class="input" type="date" v-model="currentReq.date" @change="saveDB"></div>
            </div>
            <div class="table" style="margin-top:10px">
              <div class="th">
                <div style="width:200px">品名</div>
                <div style="width:90px">單位</div>
                <div style="width:120px">數量</div>
                <div class="spacer">備註</div>
                <div style="width:60px"></div>
              </div>
              <div class="tr" v-for="(it,idx) in currentReq.items" :key="it.key">
                <div style="width:200px"><input class="input w100" v-model.trim="it.name" placeholder="品名"></div>
                <div style="width:90px"><input class="input w100" v-model.trim="it.unit" placeholder="單位"></div>
                <div style="width:120px"><input class="input w100" type="number" min="0" v-model.number="it.qty"></div>
                <div class="spacer"><input class="input w100" v-model.trim="it.note" placeholder="備註…"></div>
                <div style="width:60px"><button class="btn ghost small" v-can="'orders.create'" @click="delLine(idx)">刪除</button></div>
              </div>
            </div>
          </div>
        </template>

        <!-- 訂單 -->
        <template v-else>
          <div v-if="!currentOrd" class="center muted" style="padding:24px">📄 請從左側選擇訂單</div>
          <div v-else>
            <div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px dashed var(--border)">
              <div>門市：{{ scope.storeName }}</div>
              <div>日期：{{ currentOrd.date }}</div>
            </div>
            <div class="table" style="margin-top:10px">
              <div class="th">
                <div style="width:200px">品名</div>
                <div style="width:90px">單位</div>
                <div style="width:120px">數量</div>
                <div class="spacer">備註</div>
              </div>
              <div class="tr" v-for="it in currentOrd.items" :key="it.key">
                <div style="width:200px">{{ it.name }}</div>
                <div style="width:90px">{{ it.unit }}</div>
                <div style="width:120px">{{ it.qty }}</div>
                <div class="spacer">{{ it.note || '—' }}</div>
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
import { useScope } from '@/store/scope'

const scope = useScope()
const rid = ()=> 'id-' + Math.random().toString(36).slice(2,10)
const today = ()=> new Date().toISOString().slice(0,10)

const toast = ref(''); const tip = (m)=>{ toast.value=m; setTimeout(()=>toast.value='',1200) }
const dataSource = reactive({ mode: localStorage.getItem('emp-ord-mode') || 'local', async fetchAll(){ loadDB() } })
function onModeChanged(){ localStorage.setItem('emp-ord-mode', dataSource.mode); tip('已切換來源（示意）') }

const db = reactive({ req:[], ord:[] })
function saveDB(){ localStorage.setItem(`emp-orders-${scope.storeId}`, JSON.stringify(db)) }
function loadDB(){
  const raw = localStorage.getItem(`emp-orders-${scope.storeId}`)
  if (raw) { try{ Object.assign(db, JSON.parse(raw)); return }catch{ localStorage.removeItem(`emp-orders-${scope.storeId}`) } }
  db.req = [{ id:rid(), storeId:scope.storeId, date: today(), status:'pending',
    items:[{key:rid(),name:'大力士雞腿',unit:'份',qty:20,note:''},{key:rid(),name:'豬骨高湯',unit:'桶',qty:1,note:''}]
  }]
  db.ord = [{ id:rid(), storeId:scope.storeId, date: today(),
    items:[{key:rid(),name:'新鮮雞腿',unit:'份',qty:30,note:''},{key:rid(),name:'米漿醬油',unit:'瓶',qty:2,note:''}]
  }]
  saveDB()
}

const drawerOpen = ref(false)
const tab = ref('req')
const dateStr = ref(today())
const selectedId = ref(null)

const reqList = computed(()=> db.req.filter(x=>x.storeId===scope.storeId && x.date===dateStr.value))
const ordList = computed(()=> db.ord.filter(x=>x.storeId===scope.storeId && x.date===dateStr.value))
const currentReq = computed(()=> db.req.find(x=>x.id===selectedId.value) || null)
const currentOrd = computed(()=> db.ord.find(x=>x.id===selectedId.value) || null)

function selectLeft(id){ selectedId.value = id; drawerOpen.value=false }
function quickNew(){
  const r = { id:rid(), storeId:scope.storeId, date:dateStr.value, status:'pending', items:[] }
  db.req.unshift(r); selectedId.value = r.id; tab.value='req'; saveDB(); tip('已新增請貨單')
}
function addLine(){ currentReq.value?.items.push({ key:rid(), name:'', unit:'份', qty:0, note:'' }) }
function delLine(i){ currentReq.value?.items.splice(i,1) }
function removeZero(){ if (!currentReq.value) return; currentReq.value.items = currentReq.value.items.filter(it => (+it.qty||0) > 0) }
function submitRequest(){
  const r = currentReq.value; if (!r) return
  if (!r.items.length) return tip('請先新增品項')
  r.status = 'submitted'
  const o = { id:rid(), storeId:r.storeId, date:r.date, items: r.items.map(it=>({ ...it, key:rid() })) }
  db.ord.unshift(o); selectedId.value = o.id; tab.value='ord'
  saveDB(); tip('已送出請貨並建立訂單')
}
function print(){ window.print() }

function exportJSON(){
  const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob); const a=document.createElement('a')
  a.href=url; a.download=`emp-orders-${scope.storeId}.json`; a.click(); URL.revokeObjectURL(url)
}
function importJSON(e){
  const f = e.target.files?.[0]; if(!f) return
  const reader = new FileReader()
  reader.onload=()=>{
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj || !Array.isArray(obj.req) || !Array.isArray(obj.ord)) throw new Error()
      db.req = obj.req; db.ord = obj.ord; saveDB(); tip('已匯入資料')
    }catch{ tip('匯入失敗：格式錯誤') }
  }
  reader.readAsText(f,'utf-8')
}
onMounted(()=> dataSource.fetchAll())
</script>
