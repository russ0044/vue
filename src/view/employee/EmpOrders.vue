<!-- src/view/boss/BossOrderSettings.vue 〈完整可覆蓋〉 -->
<template>
  <section class="orders-page" v-if="isEmp">
    <!-- 頁首（無任何門市選擇） -->
    <div class="main-head card">
      <div class="h2">訂單情況（員工）</div>
      <div class="spacer"></div>
      <div class="actions">
        <button class="btn ghost small" @click="showCatalog = !showCatalog">
          {{ showCatalog ? '關閉品項管理' : '管理可選品項' }}
        </button>
        <button class="btn ghost small" @click="exportJSON">匯出</button>
        <label class="btn ghost small file-btn">
          匯入
          <input type="file" accept="application/json" @change="importJSON">
        </label>
      </div>
    </div>

    <!-- 可選品項管理（不含門市） -->
    <div v-if="showCatalog" class="card catalog-card">
      <div class="catalog-head">
        <div class="h3">可選品項（Catalog）</div>
        <div class="muted small">維護下拉清單的品項與預設單位（停用品項不會出現在請貨清單）。</div>
      </div>

      <div class="row gap mt-8">
        <input class="input w220" placeholder="新增品項名稱" v-model.trim="newCat.name" @keydown.enter="addCatalogItem">
        <select class="input w140" v-model="newCat.unit">
          <option v-for="u in unitChoices" :key="'new-'+u" :value="u">{{ u }}</option>
        </select>
        <button class="btn" :disabled="!newCat.name" @click="addCatalogItem">新增</button>
      </div>

      <div class="table-wrap mt-12">
        <table class="tbl">
          <thead>
            <tr><th>品項名稱</th><th>單位</th><th class="num">刪除</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in catalog" :key="c.id">
              <td><input class="input w100" v-model.trim="c.name" @change="persistCatalog"></td>
              <td>
                <select class="input w140" v-model="c.unit" @change="persistCatalog">
                  <option v-for="u in unitChoices" :key="c.id+'-'+u" :value="u">{{ u }}</option>
                </select>
              </td>
              <td class="num"><button class="btn small" @click="removeCatalogItem(c.id)">刪</button></td>
            </tr>
            <tr v-if="!catalog.length"><td colspan="3" class="muted center">尚無可選品項，可於上方新增。</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 主體：左右二欄（沒有任何門市切換） -->
    <div class="two-col">
      <!-- 左側清單 -->
      <aside class="side card" :class="{open:drawerOpen}">
        <div class="side-head">
          <div class="row wrap">
            <label class="muted">日期</label>
            <input class="input" type="date" v-model="dateStr">

            <label class="muted">供應商</label>
            <select class="input" v-model="vendorId">
              <option value="">全部</option>
              <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </div>

          <div class="seg">
            <button :class="['segbtn', tab==='req' && 'active']" @click="tab='req'">請貨</button>
            <button :class="['segbtn', tab==='ord' && 'active']" @click="tab='ord'">訂單</button>
          </div>

          <button class="btn primary w100" @click="quickNew">＋ 新增請貨</button>
        </div>

        <!-- 請貨清單（鎖定本門市） -->
        <div class="side-list" v-if="tab==='req'">
          <div
            class="side-item"
            v-for="r in reqList"
            :key="r.id"
            :class="{active:r.id===selectedId}"
            @click="selectLeft(r.id)"
          >
            <div class="grow">
              <div class="strong">{{ r.date }}</div>
              <div class="muted small">品項：{{ r.items.length }}</div>
              <div class="muted tiny">供應商：{{ vendorName(r.vendorId) || '—' }}</div>
            </div>
            <div class="badge" :class="r.status">{{ r.status==='pending' ? '待送出' : '已送出' }}</div>
          </div>
          <p v-if="!reqList.length" class="muted center">沒有請貨單</p>
        </div>

        <!-- 訂單清單（鎖定本門市） -->
        <div class="side-list" v-else>
          <div
            class="side-item"
            v-for="o in ordList"
            :key="o.id"
            :class="{active:o.id===selectedId}"
            @click="selectLeft(o.id)"
          >
            <div class="grow">
              <div class="strong">{{ o.date }}</div>
              <div class="muted small">品項：{{ o.items.length }}</div>
              <div class="muted tiny">供應商：{{ vendorName(o.vendorId) || '—' }}</div>
            </div>
            <div class="badge submitted">訂單</div>
          </div>
          <p v-if="!ordList.length" class="muted center">沒有訂單</p>
        </div>
      </aside>

      <transition name="fade"><div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false"></div></transition>

      <!-- 右側詳情（顯示本門市名稱） -->
      <main class="card">
        <div class="main-head inner">
          <div class="h3">{{ tab==='req' ? '請貨單' : '訂單' }}</div>
          <div class="spacer"></div>

          <template v-if="tab==='req' && currentReq">
            <div class="row gap wrap">
              <button class="btn" @click="addLineFromCatalog">新增品項</button>
              <button class="btn" @click="removeZero">移除 0 件</button>
              <div class="seg">
                <button class="segbtn" @click="aiSuggest('tomorrow')">AI 建議（明日）</button>
                <button class="segbtn" @click="aiSuggest('3days')">AI 建議（+3天）</button>
              </div>
              <button class="btn primary" @click="submitRequest">送出請貨</button>
            </div>
          </template>

          <template v-else-if="tab==='ord' && currentOrd">
            <button class="btn" @click="print">列印</button>
          </template>
        </div>

        <!-- 請貨內容 -->
        <template v-if="tab==='req'">
          <div v-if="!currentReq" class="center muted empty-tip">📄 請從左側選取或新增請貨單</div>
          <div v-else class="paper">
            <div class="paper-head">
              <div>門市：{{ myStoreName }}</div>
              <div class="row gap">
                <span>日期：</span>
                <input class="input" type="date" v-model="currentReq.date" @change="saveDB">
                <span>供應商：</span>
                <select class="input" v-model="currentReq.vendorId" @change="saveDB">
                  <option value="">（未指定）</option>
                  <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}</option>
                </select>
              </div>
            </div>

            <div class="table">
              <div class="th">
                <div class="w230">品名</div>
                <div class="w120">單位</div>
                <div class="w120">數量</div>
                <div class="spacer">備註</div>
                <div class="w60"></div>
              </div>

              <div class="tr" v-for="(it,idx) in currentReq.items" :key="it.key">
                <div class="w230">
                  <select class="input w100" v-model="it.catId" @change="applyCatalogToRow(it)">
                    <option v-for="c in catalog" :key="c.id" :value="c.id">{{ c.name }}</option>
                    <option value="">（自訂）</option>
                  </select>
                  <input v-if="!it.catId" class="input w100 mt-6" v-model.trim="it.name" placeholder="自訂品名" @change="saveDB">
                </div>

                <div class="w120">
                  <select class="input w100" v-model="it.unit" @change="saveDB">
                    <option v-for="u in unitChoices" :key="it.key+'-'+u" :value="u">{{ u }}</option>
                  </select>
                </div>

                <div class="w120">
                  <input class="input w100" type="number" min="0" v-model.number="it.qty" @change="saveDB" @keydown.enter="saveDB">
                </div>

                <div class="spacer">
                  <input class="input w100" v-model.trim="it.note" placeholder="備註…" @change="saveDB">
                </div>

                <div class="w60"><button class="btn ghost small" @click="delLine(idx)">刪除</button></div>
              </div>
            </div>
          </div>
        </template>

        <!-- 訂單內容 -->
        <template v-else>
          <div v-if="!currentOrd" class="center muted empty-tip">📄 請從左側選擇訂單</div>
          <div v-else class="paper">
            <div class="paper-head">
              <div>門市：{{ myStoreName }}</div>
              <div>日期：{{ currentOrd.date }}</div>
            </div>

            <div class="table">
              <div class="th">
                <div class="w230">品名</div>
                <div class="w120">單位</div>
                <div class="w120">數量</div>
                <div class="spacer">備註</div>
              </div>

              <div class="tr" v-for="it in currentOrd.items" :key="it.key">
                <div class="w230">{{ it.name }}</div>
                <div class="w120">{{ it.unit }}</div>
                <div class="w120">{{ it.qty }}</div>
                <div class="spacer">{{ it.note || '—' }}</div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>

    <transition name="fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
  </section>

  <!-- 如日後需要：Boss 模式可在此加上老闆設定介面 -->
  <section v-else class="placeholder card">
    <div class="h2">訂單設定（老闆）</div>
    <p class="muted">此檔同時支援員工/老闆模式。若要顯示老闆設定，請在路由以 props: { role: 'boss' } 掛載並實作。</p>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useScope } from '@/store/scope'
import { read } from '@/store/datasource'

/* 由路由傳入：role='emp' 或 'boss'（本檔聚焦 emp） */
const props = defineProps({ role: { type: String, default: 'emp' } })
const isEmp = computed(() => props.role === 'emp')

/* ====== 只使用當前登入者的門市（無門市選擇，僅顯示名稱） ====== */
const scope = useScope()
const myStoreId   = ref('')
const myStoreName = ref('')
watch(
  () => [scope.storeId, scope.storeName],
  ([sid, sname]) => {
    myStoreId.value   = String(sid || '')
    myStoreName.value = String(sname || '')
  },
  { immediate: true }
)

/* 工具 */
const rid   = () => 'id-' + Math.random().toString(36).slice(2, 10)
const today = () => new Date().toISOString().slice(0, 10)
const toast = ref('')
const tip = m => { toast.value = m; setTimeout(()=> toast.value='', 1200) }

/* 供應商（支援假資料 / Firebase 切換） */
const snap = read?.() || {}
const vendors = reactive(
  Array.isArray(snap.vendors) && snap.vendors.length
    ? snap.vendors.map(v => ({ id:String(v.id), name:String(v.name) }))
    : [
        { id:'vendor-central', name:'中央廚房' },
        { id:'vendor-veg',     name:'在地蔬菜行' },
        { id:'vendor-season',  name:'調味品供應商' },
        { id:'vendor-pack',    name:'包材供應商' },
      ]
)
const vendorName = id => vendors.find(v=>v.id===id)?.name || ''

/* Catalog / 單位 */
const DEFAULT_UNITS = ['份','包','瓶','桶','顆','公斤','公克','箱','袋','支','罐','條']
const catalog = reactive(loadCatalog())
const unitChoices = computed(() => {
  const set = new Set(DEFAULT_UNITS); catalog.forEach(c => c.unit && set.add(c.unit)); return Array.from(set)
})
const newCat = reactive({ name:'', unit: DEFAULT_UNITS[0] })
const showCatalog = ref(false)
function loadCatalog(){
  const raw = localStorage.getItem('emp-orders-catalog')
  if (raw) { try { const arr = JSON.parse(raw); if (Array.isArray(arr)) return arr } catch {} }
  const seed = [
    { id: rid(), name:'去骨雞腿（真空包，生）', unit:'包' },
    { id: rid(), name:'雞高湯基底',             unit:'桶' },
    { id: rid(), name:'小黃瓜',                 unit:'條' },
  ]
  localStorage.setItem('emp-orders-catalog', JSON.stringify(seed))
  return seed
}
function persistCatalog(){ localStorage.setItem('emp-orders-catalog', JSON.stringify(catalog)); tip('已儲存可選品項') }
function addCatalogItem(){ if(!newCat.name.trim()) return; catalog.push({ id: rid(), name:newCat.name.trim(), unit:newCat.unit }); newCat.name=''; persistCatalog() }
function removeCatalogItem(id){ const i=catalog.findIndex(c=>c.id===id); if(i>=0) catalog.splice(i,1); persistCatalog() }

/* 本地資料（以門市分 key） */
const dbState = reactive({ req: [], ord: [] })
const dateStr = ref(today())
const vendorId = ref('')

const key = computed(() => `emp-orders-${myStoreId.value || 'default'}`)

function saveDB(){ localStorage.setItem(key.value, JSON.stringify(dbState)) }
function initSeed(){
  dbState.req = [{
    id: rid(),
    storeId: myStoreId.value,
    date: today(),
    vendorId: 'vendor-central',
    status: 'pending',
    items: [
      { key: rid(), catId: '', name:'去骨雞腿（真空包，生）', unit:'包', qty: 10, note:'' },
      { key: rid(), catId: '', name:'雞高湯基底',             unit:'桶', qty: 1,  note:'' },
    ],
  }]
  dbState.ord = []
}
function loadDB(){
  const raw = localStorage.getItem(key.value)
  if (raw) {
    try {
      const obj = JSON.parse(raw)
      dbState.req = Array.isArray(obj.req) ? obj.req : []
      dbState.ord = Array.isArray(obj.ord) ? obj.ord : []
    } catch {
      initSeed()
    }
  } else {
    initSeed()
  }
  // 預設選中：當天第一筆
  selectedId.value = (tab.value==='req' ? dbState.req[0]?.id : dbState.ord[0]?.id) || null
  saveDB()
}
onMounted(() => loadDB())

/* 監聽門市切換：自動重載 */
watch(
  () => myStoreId.value,
  () => {
    dateStr.value = today()
    vendorId.value = ''
    tab.value = 'req'
    selectedId.value = null
    loadDB()
  }
)

/* 清單（鎖定 myStoreId） */
const tab        = ref('req')
const selectedId = ref(null)
const drawerOpen = ref(false)

const reqList = computed(() =>
  dbState.req.filter(x =>
    x.storeId === myStoreId.value &&
    x.date    === dateStr.value &&
    (!vendorId.value || x.vendorId === vendorId.value)
  )
)
const ordList = computed(() =>
  dbState.ord.filter(x =>
    x.storeId === myStoreId.value &&
    x.date    === dateStr.value &&
    (!vendorId.value || x.vendorId === vendorId.value)
  )
)

const currentReq = computed(() => dbState.req.find(x => x.id === selectedId.value) || null)
const currentOrd = computed(() => dbState.ord.find(x => x.id === selectedId.value) || null)

/* 操作 */
function selectLeft(id){ selectedId.value=id; drawerOpen.value=false }
function quickNew(){
  const r = { id:rid(), storeId:myStoreId.value, date:dateStr.value, status:'pending', vendorId:vendorId.value, items:[] }
  dbState.req.unshift(r); selectedId.value=r.id; tab.value='req'; saveDB(); tip('已新增請貨單')
}
function addLineFromCatalog(){ if(!currentReq.value) return; currentReq.value.items.push({ key:rid(), catId:'', name:'', unit:'份', qty:0, note:'' }); saveDB() }
function applyCatalogToRow(row){ const c=catalog.find(x=>x.id===row.catId); if(c){ row.name=c.name; row.unit=c.unit||row.unit } saveDB() }
function delLine(i){ currentReq.value?.items.splice(i,1); saveDB() }
function removeZero(){ if(!currentReq.value) return; currentReq.value.items = currentReq.value.items.filter(it => (+it.qty||0) > 0); saveDB() }

/* 簡化 AI 建議（與門市無關） */
const aiCfg = reactive({ trend: 1.06 })
function aiSuggest(mode){
  const r=currentReq.value; if(!r) return
  const factor = mode==='3days' ? 2.6 : 1.2
  const out = (catalog||[]).slice(0,30).map(c => ({
    key: rid(), catId: c.id, name: c.name, unit: c.unit, qty: Math.round(10 * factor * aiCfg.trend), note:''
  })).filter(x=>x.qty>0)
  if(!out.length) return tip('沒有可建議的品項')
  r.items = out; saveDB(); tip(`已套用 AI 建議（${mode==='3days'?'未來3天':'明日'}）`)
}

/* 送出請貨 -> 建立訂單（仍鎖定 myStoreId） */
function submitRequest(){
  const r=currentReq.value
  if(!r) return
  if(!r.items.length) return tip('請先新增品項')
  r.status='submitted'
  const ord = { id:rid(), storeId:r.storeId, date:r.date, vendorId:r.vendorId, items:r.items.map(it=>({ ...it, key:rid() })) }
  dbState.ord.unshift(ord)
  selectedId.value=ord.id
  tab.value='ord'
  saveDB()
  tip('已送出請貨並建立訂單')
}

/* 列印 / 匯入匯出 */
function print(){ window.print() }
function exportJSON(){
  const data={ db:dbState, catalog, vendors }
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a'); a.href=url; a.download=`emp-orders-${myStoreId.value||'export'}-${dateStr.value}.json`; a.click()
  URL.revokeObjectURL(url)
}
function importJSON(e){
  const f=e.target.files?.[0]; if(!f) return
  const reader=new FileReader()
  reader.onload=()=>{ try{
    const obj=JSON.parse(String(reader.result))
    if(obj.db && Array.isArray(obj.db.req) && Array.isArray(obj.db.ord)){ dbState.req=obj.db.req; dbState.ord=obj.db.ord }
    else if(Array.isArray(obj.req) && Array.isArray(obj.ord)){ dbState.req=obj.req; dbState.ord=obj.ord }
    if(Array.isArray(obj.catalog)){ catalog.splice(0); obj.catalog.forEach(c=>catalog.push(c)); persistCatalog() }
    saveDB(); tip('已匯入資料')
  }catch{ tip('匯入失敗：格式錯誤') } }
  reader.readAsText(f,'utf-8')
}
</script>

<style scoped>
/* —— 保持原樣式；另外保險性隱藏任何誤掛的門市下拉 —— */
:root {
  --bg: #0f172a0a; --card:#fff; --border:#e5e7eb; --text-main:#0f172a; --text-sub:#64748b;
  --muted: var(--text-sub); --accent:#2563eb;
  --badge-pending-bg: rgba(234,179,8,.16); --badge-pending-bd: rgba(234,179,8,.36); --badge-pending-tx:#b45309;
  --badge-sub-bg: rgba(37,99,235,.16); --badge-sub-bd: rgba(37,99,235,.36); --badge-sub-tx:#1d4ed8;
}
.dark .orders-page {
  --bg:#0b1324; --card:#1e293b; --border:#334155; --text-main:#e2e8f0; --text-sub:#94a3b8;
  --badge-pending-bg: rgba(234,179,8,.18); --badge-pending-bd: rgba(234,179,8,.35); --badge-pending-tx:#facc15;
  --badge-sub-bg: rgba(96,165,250,.18); --badge-sub-bd: rgba(96,165,250,.35); --badge-sub-tx:#93c5fd;
}

.orders-page{ min-height:100vh; padding:16px; background:var(--bg); color:var(--text-main); display:grid; gap:12px; font-family:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif; }
.card{ background:var(--card); border:1px solid var(--border); border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,.04); }
.main-head{ display:flex; gap:10px; align-items:center; padding:12px 16px; }
.main-head.inner{ border-bottom:1px dashed var(--border); }
.h2{ font-size:18px; font-weight:800; } .h3{ font-size:16px; font-weight:800; }
.spacer{ flex:1; } .actions{ display:flex; gap:8px; align-items:center; }

.catalog-card{ padding:12px; } .catalog-head{ display:flex; align-items:baseline; gap:8px; }
.mt-8{ margin-top:8px; } .mt-12{ margin-top:12px; }
.w220{ width:220px; max-width:100% } .w140{ width:140px; max-width:100% }

.two-col{ display:grid; grid-template-columns:320px 1fr; gap:12px; min-height:calc(100vh - 140px); }

/* 左欄 */
.side{ display:flex; flex-direction:column; overflow:hidden; }
.side-head{ border-bottom:1px solid var(--border); padding:12px; display:grid; gap:10px; }
.row{ display:flex; gap:8px; align-items:center; } .row.wrap{ flex-wrap:wrap; }
.input{ border:1px solid var(--border); background:var(--card); color:var(--text-main); border-radius:10px; padding:6px 8px; font-size:14px; outline:none; }
.input:focus{ border-color:#9ec5ff; box-shadow:0 0 0 3px rgba(99,162,255,.15); }
.seg{ display:flex; gap:6px; flex-wrap:wrap; }
.segbtn{ border:1px solid var(--border); background:var(--card); color:var(--text-main); border-radius:10px; padding:6px 10px; cursor:pointer; font-size:13px; }
.segbtn.active{ border-color:#cfe0ff; background:#e6f0ff; color:#1e3a8a; font-weight:600; }
.dark .orders-page .segbtn.active{ background:#1f2a44; border-color:#3b82f6; color:#c7d2fe; }

.side-list{ flex:1; overflow:auto; padding:12px; max-height:calc(100vh - 240px); }
.side-item{ display:flex; gap:10px; align-items:flex-start; border:1px solid var(--border); background:var(--card); border-radius:12px; padding:10px 12px; margin-bottom:8px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.03); color:var(--text-main); }
.side-item .strong{ color:var(--text-main); font-weight:700; }
.side-item .muted{ color:var(--text-sub); }
.side-item.active{ outline:2px solid #9ec5ff; background:#f8fafc; }
.dark .orders-page .side-item.active{ background:#1a2437; outline-color:#60a5fa; }

.badge{ border-radius:999px; padding:4px 8px; font-size:12px; border:1px solid var(--border); font-weight:600; align-self:flex-start; }
.badge.pending{ background:var(--badge-pending-bg); border-color:var(--badge-pending-bd); color:var(--badge-pending-tx); }
.badge.submitted{ background:var(--badge-sub-bg); border-color:var(--badge-sub-bd); color:var(--badge-sub-tx); }

/* 右側 */
.paper{ margin-top:8px; border-radius:12px; overflow:hidden; }
.paper-head{ display:flex; gap:10px; justify-content:space-between; padding:12px 16px; border-bottom:1px dashed var(--border); background:rgba(0,0,0,.02); }
.dark .orders-page .paper-head{ background:rgba(255,255,255,.03); }

.table{ border:1px solid var(--border); border-radius:12px; overflow:hidden; margin:12px 16px 16px; }
.th,.tr{ display:flex; gap:10px; align-items:center; padding:10px 12px; border-bottom:1px solid var(--border); }
.th{ font-weight:700; color:var(--text-main); background:rgba(0,0,0,.02); }
.dark .orders-page .th{ background:rgba(255,255,255,.03); }
.tr:last-child{ border-bottom:none; }

.w60{ width:60px } .w120{ width:120px } .w230{ width:230px } .w100{ width:100% } .mt-6{ margin-top:6px }

.btn{ border:1px solid var(--border); background:var(--card); color:var(--accent); border-radius:10px; padding:8px 12px; cursor:pointer; font-size:14px; white-space:nowrap; }
.btn.small{ padding:6px 10px; font-size:13px; }
.btn.primary{ background:var(--accent); border-color:var(--accent); color:#fff; }
.btn.ghost{ color:var(--text-main); }

.center{ text-align:center } .muted{ color:var(--text-sub) } .small{ font-size:12px } .tiny{ font-size:11px } .empty-tip{ padding:24px }
.file-btn{ position:relative; overflow:hidden } .file-btn input{ position:absolute; inset:0; opacity:0; cursor:pointer }
.backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.25); z-index:30 }

/* —— 防禦性隱藏任何誤掛的「門市」選單（若布局裡還有舊 DOM） —— */
.select-store, [data-role="store-select"], [aria-label="門市"], select[name="store"], .header-store-filter { display:none !important; }

@media (max-width:1024px){
  .two-col{ grid-template-columns:1fr }
  .side{ position:fixed; inset:0 auto 0 0; width:82%; max-width:340px; transform:translateX(-100%); transition:.2s; z-index:40; box-shadow:8px 0 24px rgba(0,0,0,.2) }
  .side.open{ transform:translateX(0) }
}

.toast{ position:fixed; right:16px; bottom:16px; z-index:70; background:#111827; color:#fff; padding:10px 12px; border-radius:10px; opacity:.95 }
.fade-enter-active,.fade-leave-active{ transition:opacity .15s } .fade-enter-from,.fade-leave-to{ opacity:0 }
</style>

<!-- 全域樣式（無 scoped），確保 header / layout 的門市下拉也會被隱藏 -->
<style>
.select-store,
[data-role="store-select"],
[aria-label="門市"],
select[name="store"],
.header-store-filter {
  display: none !important;
}
</style>
