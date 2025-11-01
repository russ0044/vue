<template>
  <section class="inv-page">
    <!-- 標題 -->
    <header class="inv-header">
      <div class="title">警示門檻</div>
      <div class="spacer"></div>
    </header>

    <!-- 篩選列 -->
    <div class="inv-toolbar card-lite">
      <div class="seg">
        <button :class="['segbtn', scope==='global' && 'active']" @click="scope='global'">全門市統一</button>
        <button :class="['segbtn', scope==='store'  && 'active']" @click="scope='store'">單店覆寫</button>
      </div>

      <select
        v-if="scope==='store'"
        v-model="selectedStoreId"
        class="input store-select"
        :disabled="!stores.length"
        :title="!stores.length ? '尚無可選店面（請先建立店面）' : '選擇要覆寫的店面'"
      >
        <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <div class="spacer"></div>

      <div class="search">
        <span>🔎</span>
        <input class="input" placeholder="搜尋食材名稱或代碼…" v-model.trim="qList">
      </div>
    </div>

    <div class="inv-grid">
      <!-- 左欄：清單 -->
      <aside class="inv-side">
        <div class="side-tools">
          <div class="row gap">
            <div class="muted small" v-if="checkedIds.size">已選 {{ checkedIds.size }} 項</div>
            <div class="spacer"></div>
            <button class="btn small" :disabled="!checkedIds.size" @click="applyBatchToSelected">套用到勾選</button>
            <button
              class="btn small ghost"
              :disabled="!checkedIds.size || scope!=='store'"
              @click="clearBatchOverride"
            >清除覆寫</button>
          </div>

          <div class="chips">
            <button
              v-for="t in tags"
              :key="t.id"
              class="chip"
              :class="{on: tagFilter.has(t.id)}"
              @click="toggleTag(t.id)"
            >#{{ t.name }}</button>
            <span v-if="!tags.length" class="muted small">（尚無標籤）</span>
          </div>
        </div>

        <div class="side-list">
          <div
            v-for="it in filteredIngredients"
            :key="it.id"
            class="side-item"
            :class="{active: it.id===selectedId}"
            @click="selectIngredient(it.id)"
          >
            <label class="ck" @click.stop>
              <input type="checkbox" :value="it.id" v-model="checkedIdsArr">
              <span></span>
            </label>
            <div class="thumb sm" :style="{ backgroundImage: `url(${it.image || placeholder})` }"></div>
            <div class="grow">
              <div class="name"><strong>{{ it.name }}</strong></div>
              <div class="muted small">
                {{ it.code || '—' }}｜{{ it.unit || '-' }}
                <span v-if="scope==='store' && isOverridden(it.id)" class="over-chip">已覆寫</span>
              </div>
            </div>
          </div>
          <p v-if="!filteredIngredients.length" class="muted center">沒有符合的食材</p>
        </div>
      </aside>

      <!-- 右欄：編輯區（已修正重疊） -->
      <main class="inv-main card">
        <template v-if="selected">
          <div class="main-head">
            <div class="title">設定：{{ selected.name }}</div>
            <div class="spacer"></div>
            <button
              v-if="scope==='store' && isOverridden(selected.id)"
              class="btn ghost"
              @click="clearOverride(selected.id)"
            >清除覆寫</button>
            <button class="btn" @click="resetEditing">還原</button>
            <button class="btn primary" :disabled="!validAll" @click="saveEditing">儲存</button>
          </div>

          <!-- 基本門檻 -->
          <section class="panel">
            <div class="panel-title">基本門檻</div>
            <div class="grid">
              <div class="fg">
                <label class="label-top">下限</label>
                <div class="ctrl-row">
                  <input type="number" inputmode="numeric" min="0" v-model.number="edit.min" class="num" />
                </div>
                <div class="hint">建議依安全庫存下限設定</div>
              </div>

              <div class="fg">
                <label class="label-top">再進貨點（ROP）</label>
                <div class="ctrl-row">
                  <input type="number" inputmode="numeric" min="0" v-model.number="edit.rop" class="num" />
                </div>
                <div class="hint">到達此數量觸發補貨</div>
              </div>

              <div class="fg">
                <label class="label-top">上限</label>
                <div class="ctrl-row">
                  <input type="number" inputmode="numeric" min="0" v-model.number="edit.max" class="num" />
                </div>
                <div class="hint">避免囤貨過量</div>
              </div>

              <div class="fg fg-note" :class="{ bad: !validRange }">
                <div class="note">
                  <span v-if="validRange">✔ 規則有效：下限 ≤ ROP ≤ 上限</span>
                  <span v-else>✖ 請修正：下限 ≤ ROP ≤ 上限</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 進階警示 -->
          <section class="panel">
            <div class="panel-title">進階警示</div>
            <div class="grid">
              <div class="fg">
                <label class="label-top">效期警示</label>
                <div class="ctrl-row">
                  <input type="number" inputmode="numeric" min="0" v-model.number="edit.expiryWarnDays" class="num" />
                  <span class="suffix-chip">天</span>
                </div>
              </div>

              <div class="fg">
                <label class="label-top">成本波動</label>
                <div class="ctrl-row">
                  <input type="number" inputmode="numeric" min="0" v-model.number="edit.priceChangePct" class="num" />
                  <span class="suffix-chip">%</span>
                </div>
              </div>

              <div class="fg">
                <label class="label-top">缺貨天數</label>
                <div class="ctrl-row">
                  <input type="number" inputmode="numeric" min="0" v-model.number="edit.shortageDays" class="num" />
                  <span class="suffix-chip">天</span>
                </div>
              </div>

              <div class="fg fg-tip">
                <div class="info">提示：以上門檻僅影響系統警示，不會直接改動庫存數。</div>
              </div>
            </div>
          </section>
        </template>

        <template v-else>
          <div class="empty">請從左側選擇食材</div>
        </template>
      </main>
    </div>

    <!-- 底部：匯出/匯入 JSON -->
    <div class="bottom card">
      <div class="row gap">
        <button class="btn ghost" @click="exportJSON">匯出 JSON</button>
        <label class="btn ghost file-btn">
          匯入 JSON
          <input type="file" accept="application/json" @change="importJSON">
        </label>
      </div>
    </div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { read, subscribe } from '@/store/datasource'

defineOptions({ name: 'BossThresholds' })

/* UI */
const toastMsg = ref('')
const toast = (m)=>{ toastMsg.value = m; setTimeout(()=>toastMsg.value='', 1300) }
const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
  <rect width="100%" height="100%" fill="#eef2ff"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="14">No Image</text>
</svg>`)

/* Datasource（mock / Firebase） */
const d = reactive(read())
let unSub = null
onMounted(() => { unSub = subscribe?.(snap => Object.assign(d, snap)) })
onBeforeUnmount(() => { unSub?.() })

const stores = computed(() => Array.isArray(d?.stores) ? d.stores : [])
const ingredients = computed(() =>
  Array.isArray(d?.inventory)
    ? d.inventory.map(i => ({
        id: String(i.sku),
        name: i.name,
        code: String(i.sku),
        unit: i.unit,
        image: '',
        tags: []
      }))
    : []
)

/* 標籤（選配） */
const tags = ref([])

/* 左欄 */
const qList = ref('')
const tagFilter = reactive(new Set())
function toggleTag(id){ tagFilter.has(id) ? tagFilter.delete(id) : tagFilter.add(id) }

const filteredIngredients = computed(()=>{
  const q = qList.value.trim()
  return ingredients.value
    .filter(it => !tagFilter.size || (it.tags||[]).some(tid=>tagFilter.has(tid)))
    .filter(it => !q || it.name?.includes(q) || it.code?.includes(q))
})

const checkedIds = reactive(new Set())
const checkedIdsArr = computed({
  get(){ return Array.from(checkedIds) },
  set(v){ checkedIds.clear(); v.forEach(x=>checkedIds.add(x)) }
})

/* 門檻資料（localStorage；若要接 Firebase 在此替換） */
const thresholds = reactive(loadThresholds())
function loadThresholds(){
  try{ return JSON.parse(localStorage.getItem('boss-thresholds') || '{}') }catch{ return {} }
}
function saveThresholds(){ localStorage.setItem('boss-thresholds', JSON.stringify(thresholds)) }
function defaultRule(){ return { min:0, rop:0, max:100, expiryWarnDays:3, priceChangePct:20, shortageDays:2 } }

/* 編輯狀態 */
const scope = ref('global')
const selectedStoreId = ref('')

onMounted(() => { selectedStoreId.value = stores.value[0]?.id || '' })
watch(stores, (nv) => {
  if (!nv?.length) { selectedStoreId.value = ''; return }
  if (!nv.some(s => s.id === selectedStoreId.value)) selectedStoreId.value = nv[0].id
})

const selectedId = ref(null)
const selected = computed(()=> filteredIngredients.value.find(i => i.id === selectedId.value))
function selectIngredient(id){ selectedId.value = id; loadEditing() }

const edit = reactive(defaultRule())
function ruleFor(ingId){
  const rec = thresholds[ingId] || (thresholds[ingId] = { global: defaultRule(), byStore:{} })
  return scope.value==='store' ? (rec.byStore[selectedStoreId.value] || rec.global) : rec.global
}
function loadEditing(){ if (selected.value) Object.assign(edit, JSON.parse(JSON.stringify(ruleFor(selected.value.id)))) }
watch([selectedId, scope, selectedStoreId], loadEditing)

const validRange = computed(()=> edit.min <= edit.rop && edit.rop <= edit.max)
const validAll   = computed(()=> validRange.value )

function saveEditing(){
  if (!selected.value) return
  const id = selected.value.id
  const rec = thresholds[id] || (thresholds[id] = { global: defaultRule(), byStore:{} })
  if (scope.value==='store') rec.byStore[selectedStoreId.value] = JSON.parse(JSON.stringify(edit))
  else rec.global = JSON.parse(JSON.stringify(edit))
  saveThresholds(); toast('已儲存')
}
function resetEditing(){ loadEditing(); toast('已還原') }
function isOverridden(id){
  const rec = thresholds[id]
  return !!(scope.value==='store' && rec?.byStore && rec.byStore[selectedStoreId.value] !== undefined)
}
function clearOverride(id){
  const rec = thresholds[id]; if (rec?.byStore) delete rec.byStore[selectedStoreId.value]
  saveThresholds(); loadEditing(); toast('已清除覆寫')
}

/* 批次/匯出入 */
function applyBatchToSelected(){
  if (!checkedIds.size) return
  const data = JSON.parse(JSON.stringify(edit))
  checkedIds.forEach(id=>{
    const rec = thresholds[id] || (thresholds[id] = { global: defaultRule(), byStore:{} })
    if (scope.value==='store') rec.byStore[selectedStoreId.value] = data
    else rec.global = data
  })
  saveThresholds(); toast('已套用')
}
function clearBatchOverride(){
  if (scope.value!=='store' || !checkedIds.size) return
  checkedIds.forEach(id => { const rec = thresholds[id]; if (rec?.byStore) delete rec.byStore[selectedStoreId.value] })
  saveThresholds(); toast('已清除覆寫')
}
function exportJSON(){
  const blob = new Blob([JSON.stringify(thresholds, null, 2)], { type:'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'boss-thresholds.json'; a.click()
}
function importJSON(e){
  const f = e.target.files?.[0]; if (!f) return
  const r = new FileReader()
  r.onload = () => {
    try{
      const obj = JSON.parse(String(r.result))
      if (!obj || typeof obj!=='object') throw new Error()
      Object.assign(thresholds, obj); saveThresholds(); loadEditing(); toast('已匯入')
    }catch{ toast('匯入失敗：檔案格式錯誤') }
  }
  r.readAsText(f, 'utf-8')
}
</script>

<style scoped>
/* 版面骨架 */
.inv-page{padding:16px;background:#f6f8fc;}
.inv-header{display:flex;align-items:center;margin-bottom:8px;}
.title{font-size:20px;font-weight:800;}
.spacer{flex:1}

/* 工具列 */
.inv-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.card-lite{background:#fff;border:1px solid #e6eaf2;border-radius:12px;padding:10px;}
.seg{display:flex;gap:6px;}
.segbtn{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer}
.segbtn.active{background:#e6f4ff;border-color:#93c5fd;}
.store-select{min-width:220px}
.search{display:flex;align-items:center;gap:6px;border:1px solid #e6eaf2;border-radius:10px;padding:0 10px;min-height:38px;background:#fbfcff}
.input{border:none;outline:none;background:transparent}

/* 兩欄 */
.inv-grid{display:grid;grid-template-columns:320px 1fr;gap:12px;}
.inv-side{background:#fff;border:1px solid #e6eaf2;border-radius:16px;overflow:hidden}
.side-tools{padding:10px;border-bottom:1px solid #f0f3f8}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{border:1px solid #e6eaf2;border-radius:999px;background:#fff;padding:6px 10px;cursor:pointer}
.chip.on{background:#eef2ff;border-color:#c7d2fe}
.side-list{max-height:calc(100vh - 300px);overflow:auto;padding:10px}
.side-item{display:flex;gap:10px;align-items:center;border:1px solid #e6eaf2;border-radius:10px;padding:8px;margin-bottom:8px;background:#fff;cursor:pointer}
.side-item.active{outline:2px solid #9ec5ff}
.thumb.sm{width:44px;height:36px;background-size:cover;background-position:center;border-radius:8px;border:1px solid #e6eaf2}

/* 右側卡片 */
.card{background:#fff;border:1px solid #e6eaf2;border-radius:16px;padding:12px}
.main-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}

/* —— 設定面板（防重疊版） —— */
.panel{border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;padding:12px;margin-bottom:12px}
.panel-title{font-weight:800;margin-bottom:10px}

/* 自適應欄位網格：最小 220px，自動換行不重疊 */
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}

/* 表單元件 */
.fg{display:flex;flex-direction:column;gap:6px;min-width:0}
.label-top{font-weight:700;color:#334155}
.ctrl-row{display:flex;align-items:center;gap:8px}
.num{
  flex:1 1 auto; min-width:0;
  padding:10px 12px;border:1px solid #dbe3f1;border-radius:10px;background:#fff;
  font-size:15px; outline:none;
}
.num:focus{border-color:#93c5fd; box-shadow:0 0 0 3px #e5f0ff}

/* 單位徽章使用「旁排」避免絕對定位造成重疊 */
.suffix-chip{
  white-space:nowrap;
  padding:6px 10px;border:1px solid #e6eaf2;border-radius:999px;background:#f8fafc;
  color:#475569;font-size:13px; line-height:1;
}

/* 提示與說明 */
.fg-note .note{
  border:1px dashed #c7d2fe;background:#f8faff;border-radius:10px;padding:8px;color:#334155
}
.fg-note.bad .note{border-color:#fecaca;background:#fff7f7;color:#991b1b}
.fg .hint{color:#64748b;font-size:12px}
.fg-tip .info{
  border:1px dashed #d1fae5;background:#f0fdf4;border-radius:10px;padding:8px;color:#065f46
}

/* 底部 */
.bottom{margin-top:16px}
.btn{border:1px solid #cfe0ff;background:#fff;color:#2563eb;border-radius:10px;padding:8px 12px;cursor:pointer}
.btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}
.btn.ghost{background:#fff;border-color:#e6eaf2;color:#334155}
.btn.small{padding:6px 10px}
.file-btn{position:relative;overflow:hidden}
.file-btn input{position:absolute;inset:0;opacity:0;cursor:pointer}

/* 勾選框 */
.ck{display:inline-flex;align-items:center}
.ck input{display:none}
.ck span{width:18px;height:18px;border:1px solid #cbd5e1;border-radius:4px;display:inline-block;background:#fff;position:relative}
.ck input:checked + span::after{content:'';position:absolute;inset:2px;background:#2563eb;border-radius:2px}

/* 其他 */
.over-chip{margin-left:6px;background:#e0f2fe;border:1px solid #bae6fd;border-radius:999px;padding:2px 8px}
.muted{color:#64748b}.small{font-size:12px}.center{text-align:center}
.toast{position:fixed;bottom:16px;right:16px;background:#111827;color:#fff;padding:10px 14px;border-radius:8px}

/* RWD：左欄堆疊時不限制清單高度 */
@media (max-width:1024px){
  .inv-grid{grid-template-columns:1fr}
  .side-list{max-height:none}
}
</style>
