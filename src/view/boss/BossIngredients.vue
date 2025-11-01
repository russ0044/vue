<template>
  <section class="inv-page">
    <header class="inv-header">
      <div class="title">食材資料</div>
      <div class="spacer"></div>
    </header>

    <!-- 載入/錯誤狀態 -->
    <div v-if="!ready" class="card muted" style="padding:12px">載入中…</div>
    <div v-else-if="errorMsg" class="card" style="padding:12px;color:#b91c1c">
      發生錯誤：{{ errorMsg }}
    </div>

    <template v-else>
      <div class="inv-tabs">
        <div class="spacer"></div>
        <button :class="['tab', tab==='status' && 'active']" @click="switchTab('status')">食材狀況設定</button>
        <button :class="['tab', tab==='manage' && 'active']" @click="switchTab('manage')">食材管理</button>
        <button :class="['tab', tab==='tags'   && 'active']" @click="switchTab('tags')">標籤管理</button>
      </div>

      <div class="inv-grid">
        <!-- 左側 -->
        <aside class="inv-side" :class="{open: drawerOpen}">
          <div class="side-tools">
            <div class="search">
              <span>{{ tab==='tags' ? '🔖' : '🔎' }}</span>
              <input class="input" :placeholder="sideSearchPlaceholder" v-model="sideSearchModel">
            </div>

            <div class="side-actions">
              <template v-if="tab==='manage'">
                <button class="btn primary w-full" @click="createNew()">＋ 新增食材</button>
              </template>
              <template v-else-if="tab==='tags'">
                <input v-model.trim="newTagName" class="input grow" placeholder="輸入標籤名稱">
                <button class="btn primary" :disabled="!newTagName" @click="createTag()">＋ 新增</button>
              </template>
              <template v-else>
                <div class="action-spacer"></div>
              </template>
            </div>

            <div class="chips">
              <button
                v-for="t in db.tags"
                :key="t.id"
                class="chip"
                :class="{on: isChipOn(t.id)}"
                @click="onChipClick(t.id)"
              >#{{ t.name }}</button>
            </div>
          </div>

          <!-- 左欄清單 -->
          <div class="side-list" v-if="tab==='manage'">
            <div
              v-for="it in filteredForList"
              :key="it.id"
              class="side-item"
              :class="{active: it.id===selectedId}"
              @click="selectItem(it.id)"
            >
              <div class="thumb sm" :style="{ backgroundImage: `url(${it.image || placeholder})` }"></div>
              <div class="grow">
                <div class="name"><strong>{{ it.name }}</strong></div>
                <div class="muted small">單位：{{ it.unit }}｜狀態：{{ statusText(statusForScope(it)) }}</div>
              </div>
            </div>
            <p v-if="!filteredForList.length" class="muted center">沒有符合的食材</p>
          </div>

          <div class="side-list" v-else-if="tab==='tags'" ref="tagListRef">
            <div class="tag-row" v-for="t in filteredTags" :key="t.id" :data-id="t.id">
              <span class="grip">⠿</span>
              <div class="grow">#{{ t.name }}</div>
              <div class="muted small">使用 {{ tagUsageCount(t.id) }}</div>
              <button class="link small" @click="renameTag(t)">重新命名</button>
              <button class="link danger small" @click="removeTag(t)">刪除</button>
            </div>
            <p v-if="!filteredTags.length" class="muted center">沒有標籤</p>
          </div>

          <div class="side-list" v-else>
            <div
              v-for="it in filteredForStatus"
              :key="it.id"
              class="side-item"
              @click="scrollToRow(it.id)"
            >
              <div class="thumb sm" :style="{ backgroundImage: `url(${it.image || placeholder})` }"></div>
              <div class="grow">
                <div class="name"><strong>{{ it.name }}</strong></div>
                <div class="muted small">狀態：{{ statusText(statusForScope(it)) }}</div>
              </div>
            </div>
            <p v-if="!filteredForStatus.length" class="muted center">查無資料</p>
          </div>
        </aside>

        <transition name="fade"><div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false"></div></transition>

        <!-- 右側 -->
        <main class="inv-main card">
          <!-- 狀況設定 -->
          <template v-if="tab==='status'">
            <div class="main-head">
              <div class="row gap">
                <div class="seg">
                  <button :class="['segbtn', scope==='global' && 'active']" @click="scope='global'">全門市統一</button>
                  <button :class="['segbtn', scope==='store' && 'active']"  @click="scope='store'">單店覆寫</button>
                </div>
                <select v-if="scope==='store'" v-model="selectedStoreId" class="input">
                  <option v-for="s in db.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="spacer"></div>
              <div class="row gap" v-if="checkedIds.size">
                <div>已選 {{ checkedIds.size }} 項</div>
                <button class="btn small" @click="setBatchStatus('available')">設為可用</button>
                <button class="btn small warn" @click="setBatchStatus('low')">設為缺貨</button>
                <button class="btn small danger" @click="setBatchStatus('disabled')">設為停售</button>
                <button class="btn ghost small" @click="checkedIds.clear()">清除選取</button>
              </div>
            </div>

            <div class="status-list" ref="statusListRef">
              <div
                v-for="it in filteredForStatus"
                :key="it.id"
                class="status-row"
                :id="'row-'+it.id"
              >
                <label class="ck">
                  <input type="checkbox" :value="it.id" v-model="checkedIdsArr">
                  <span></span>
                </label>

                <div class="thumb" :style="{ backgroundImage: `url(${it.image || placeholder})` }"></div>

                <div class="grow">
                  <div class="name"><strong>{{ it.name }}</strong> <span class="muted">（{{ it.code || '無代碼' }}）</span></div>
                  <div class="muted small">
                    <span v-for="tid in it.tags" :key="tid" class="pill">#{{ tagName(tid) }}</span>
                    <span>｜單位：{{ it.unit }}｜安全庫存：{{ it.safeStock ?? '—' }}</span>
                    <span v-if="scope==='store' && isOverridden(it)" class="over-chip">已覆寫</span>
                  </div>
                </div>

                <div class="right-actions">
                  <button class="state-btn" :class="statusForScope(it)" @click="cycleStatusScoped(it)">
                    {{ statusText(statusForScope(it)) }}
                  </button>
                  <button v-if="scope==='store' && isOverridden(it)" class="btn ghost small" @click="clearOverride(it)">清除覆寫</button>
                </div>
              </div>
            </div>
          </template>

          <!-- 食材管理 -->
          <template v-else-if="tab==='manage'">
            <div class="main-head">
              <div class="left">
                <button class="icon-btn only-mobile" title="清單" @click="drawerOpen=true">☰</button>
                <div class="title">{{ editing.id ? '編輯食材' : '新增食材' }}</div>
              </div>
              <div class="spacer"></div>
              <div class="row gap">
                <button v-if="editing.id" class="btn ghost" @click="duplicateItem()">複製</button>
                <button v-if="editing.id" class="btn danger" @click="removeItem()">刪除</button>
                <button class="btn" @click="revertEditing()">還原</button>
                <button class="btn primary" :disabled="!canSave" @click="saveItem()">儲存</button>
              </div>
            </div>

            <div class="form-cols">
              <div class="uploader">
                <div class="thumb xl" :style="{ backgroundImage: `url(${editing.image || placeholder})` }"></div>
                <label class="btn ghost small mt-8">
                  上傳圖片
                  <input type="file" accept="image/*" @change="pickImage">
                </label>
                <button v-if="editing.image" class="btn ghost small" @click="editing.image=''">移除圖片</button>
              </div>

              <div class="fields">
                <div class="row gap">
                  <label class="label">食材名稱</label>
                  <input v-model.trim="editing.name" class="input grow" placeholder="請輸入名稱">
                </div>
                <div class="row gap">
                  <label class="label">食材代碼</label>
                  <input v-model.trim="editing.code" class="input grow" placeholder="選填：條碼/自訂代碼">
                </div>
                <div class="row gap">
                  <label class="label">單位</label>
                  <select v-model="editing.unit" class="input">
                    <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
                  </select>
                  <label class="label">效期(天)</label>
                  <input v-model.number="editing.shelfLife" type="number" min="0" class="input w120" placeholder="0=不追蹤">
                </div>
                <div class="row gap">
                  <label class="label">供應商</label>
                  <input v-model.trim="editing.supplier" class="input grow" placeholder="輸入供應商名稱">
                </div>
                <div class="row gap">
                  <label class="label">安全庫存</label>
                  <input v-model.number="editing.safeStock" type="number" min="0" class="input w160" placeholder="例如 10">
                  <label class="chk ml12">
                    <input type="checkbox" v-model="editing.trackExpiry"><span></span>
                  </label>
                  <span class="muted">啟用批號／效期追蹤</span>
                </div>
                <div class="row gap">
                  <label class="label">成本</label>
                  <input v-model.number="editing.cost" type="number" min="0" step="0.01" class="input w160">
                  <label class="label">售價</label>
                  <input v-model.number="editing.price" type="number" min="0" step="0.01" class="input w160">
                </div>

                <div class="row gap">
                  <label class="label">狀態</label>
                  <div class="seg">
                    <button :class="['segbtn', scope==='global' && 'active']" @click="scope='global'">全門市</button>
                    <button :class="['segbtn', scope==='store' && 'active']"  @click="scope='store'">單店</button>
                  </div>
                  <select v-if="scope==='store'" v-model="selectedStoreId" class="input">
                    <option v-for="s in db.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                  <button class="state-btn" :class="statusForScope(editing)" @click="cycleStatusScoped(editing)">
                    {{ statusText(statusForScope(editing)) }}
                  </button>
                  <button v-if="scope==='store' && isOverridden(editing)" class="btn ghost small" @click="clearOverride(editing)">清除覆寫</button>
                </div>

                <div class="row">
                  <label class="label">標籤</label>
                  <div class="grow tagdock">
                    <div class="taglist">
                      <span v-for="tid in editing.tags" :key="tid" class="pill">
                        #{{ tagName(tid) }}
                        <button class="x" @click="removeTagFromEditing(tid)">✕</button>
                      </span>
                      <span v-if="!editing.tags.length" class="muted">尚未指定標籤</span>
                    </div>
                    <div class="row gap">
                      <select v-model="tagToAdd" class="input w200">
                        <option disabled value="">選擇標籤</option>
                        <option v-for="t in db.tags" :key="t.id" :value="t.id">#{{ t.name }}</option>
                      </select>
                      <button class="btn small" :disabled="!tagToAdd" @click="addTagToEditing()">加入</button>
                      <input v-model.trim="newTagName" class="input w200" placeholder="新增標籤名稱">
                      <button class="btn ghost small" :disabled="!newTagName" @click="quickCreateTag()">＋ 新增標籤</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </template>

          <!-- 標籤管理說明 -->
          <template v-else>
            <h3 class="h3">標籤管理</h3>
            <p class="muted">在左側可新增／重新命名／刪除標籤；編輯食材時可直接加入或新建標籤。</p>
          </template>
        </main>
      </div>

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
    </template>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import Sortable from 'sortablejs'
import * as ds from '@/store/datasource'

defineOptions({ name: 'BossIngredients' })

/* ---------- UI 常數 ---------- */
const UNITS = ['個','份','公斤','公克','公升','毫升','盒','包','罐','瓶','條']
const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
    <rect width="100%" height="100%" fill="#eef2ff"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="#94a3b8" font-family="sans-serif" font-size="14">No Image</text>
  </svg>`)
const FALLBACK_KEY = 'boss-ingredients-fallback'

/* ---------- 載入狀態 ---------- */
const ready = ref(false)
const errorMsg = ref('')

/* ---------- 來源訂閱 ---------- */
const snap = reactive(ds.read() || {})
let unsub = null

function ensureContainers(o){
  o.stores ||= []
  o.inventory ||= []
  o.settings ||= { store:{} }
  o.settings.store ||= {}
}

onMounted(() => {
  try {
    ensureContainers(snap)
    if (typeof ds.subscribe === 'function') {
      unsub = ds.subscribe((s) => {
        Object.assign(snap, s || {})
        ensureContainers(snap)
        loadDataFromSource()
      })
    }
    loadDataFromSource()
    ready.value = true
  } catch (e) {
    errorMsg.value = String(e?.message || e)
  }
})
onBeforeUnmount(() => unsub?.())

/* ---------- 主資料（ingredients/tags） ---------- */
const db = reactive({ stores: [], ingredients: [], tags: [] })
const toastMsg = ref(''); function toast(m){ toastMsg.value=m; setTimeout(()=>toastMsg.value='',1400) }
function rid(){ try{ return crypto.randomUUID() } catch { return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2,8) } }

function loadDataFromSource(){
  // 更新 stores
  db.stores = Array.isArray(snap.stores) ? [...snap.stores] : []

  // 1) 資料來源直接提供 ingredients/tags
  if (Array.isArray(snap.ingredients) && Array.isArray(snap.tags)) {
    db.ingredients = JSON.parse(JSON.stringify(snap.ingredients))
    db.tags        = JSON.parse(JSON.stringify(snap.tags))
    localStorage.removeItem(FALLBACK_KEY)
    return
  }

  // 2) 讀 fallback
  const raw = localStorage.getItem(FALLBACK_KEY)
  if (raw) {
    try {
      const obj = JSON.parse(raw)
      db.ingredients = Array.isArray(obj.ingredients) ? obj.ingredients : []
      db.tags        = Array.isArray(obj.tags) ? obj.tags : []
      return
    } catch { /* 壞資料則忽略 */ }
  }

  // 3) 由 inventory 推導
  const seen = new Map()
  const tagFresh = { id: rid(), name: '生鮮' }
  const tagDry   = { id: rid(), name: '乾貨' }
  const tagPack  = { id: rid(), name: '包材' }

  for (const i of (snap.inventory || [])) {
    const sku = i?.sku || i?.code || i?.name
    if (!sku || seen.has(sku)) continue
    seen.set(sku, {
      id: rid(),
      code: sku,
      name: i?.name || sku,
      unit: i?.unit || '件',
      shelfLife: 0,
      supplier: '',
      safeStock: 0,
      trackExpiry: !!i?.exp,
      cost: 0, price: 0,
      statusGlobal: 'available',
      statusByStore: {},
      tags: [ (i?.unit?.includes('瓶') || i?.unit?.includes('罐') || i?.unit?.includes('盒')) ? tagPack.id :
              (i?.exp ? tagFresh.id : tagDry.id) ],
      image: ''
    })
  }
  db.ingredients = Array.from(seen.values())
  db.tags = [tagFresh, tagDry, tagPack]
  saveFallback()
}

function saveFallback(){
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify({ ingredients: db.ingredients, tags: db.tags }))
  } catch {}
}

/* ---------- 後端 CRUD（若無則寫入 fallback） ---------- */
async function upsertTag(tag){
  if (typeof ds.upsertTag === 'function') return ds.upsertTag(tag)
  saveFallback()
}
async function deleteTagById(id){
  if (typeof ds.deleteTag === 'function') return ds.deleteTag(id)
  saveFallback()
}
async function upsertIngredient(it){
  if (typeof ds.upsertIngredient === 'function') return ds.upsertIngredient(it)
  saveFallback()
}
async function deleteIngredientById(id){
  if (typeof ds.deleteIngredient === 'function') return ds.deleteIngredient(id)
  saveFallback()
}

/* ---------- Tabs / 抽屜 ---------- */
const tab = ref('status')
const drawerOpen = ref(false)
function switchTab(t){ tab.value = t; drawerOpen.value = false; nextTick(bindSortable) }

/* ---------- 搜尋 / Chips ---------- */
const qList = ref(''); const qTag = ref(''); const qStatus = ref('')
const sideSearchPlaceholder = computed(() =>
  tab.value==='manage' ? '搜尋食材…' :
  tab.value==='tags'   ? '搜尋標籤…'   :
                          '搜尋食材名稱或代碼…'
)
const sideSearchModel = computed({
  get(){
    return tab.value==='manage' ? qList.value :
           tab.value==='tags'   ? qTag.value  :
                                  qStatus.value
  },
  set(v){
    if (tab.value==='manage') qList.value = v
    else if (tab.value==='tags') qTag.value = v
    else qStatus.value = v
  }
})
const listTagFilter = reactive(new Set())
const statusTagFilter = reactive(new Set())
function tagName(id){ return db.tags.find(t=>t.id===id)?.name ?? '（已刪除）' }
function isChipOn(id){
  if (tab.value==='manage') return listTagFilter.has(id)
  if (tab.value==='status') return statusTagFilter.has(id)
  return qTag.value && tagName(id) === qTag.value
}
function onChipClick(id){
  if (tab.value==='manage') {
    listTagFilter.has(id) ? listTagFilter.delete(id) : listTagFilter.add(id)
  } else if (tab.value==='status') {
    statusTagFilter.has(id) ? statusTagFilter.delete(id) : statusTagFilter.add(id)
  } else {
    qTag.value = (qTag.value === tagName(id)) ? '' : tagName(id)
  }
}

/* ---------- 狀況設定（全門市/單店） ---------- */
const scope = ref('global')
const selectedStoreId = ref('')
watch(() => db.stores.map(s=>s.id).join(','), () => {
  const def = snap?.settings?.store?.defaultStoreId || db.stores[0]?.id || ''
  if (!selectedStoreId.value || !db.stores.some(s=>s.id===selectedStoreId.value)) {
    selectedStoreId.value = def
  }
}, { immediate:true })

function statusText(s){ return s==='available'?'可用':s==='low'?'缺貨':'停售' }
function statusForScope(it){
  if (scope.value==='store'){
    return it.statusByStore?.[selectedStoreId.value] ?? it.statusGlobal
  }
  return it.statusGlobal
}
function setStatusForScope(it, val){
  if (scope.value==='store'){
    it.statusByStore ||= {}
    it.statusByStore[selectedStoreId.value] = val
  }else{
    it.statusGlobal = val
  }
}
function isOverridden(it){ return scope.value==='store' && it.statusByStore?.[selectedStoreId.value] !== undefined }
function clearOverride(it){
  if (!it.statusByStore) return
  delete it.statusByStore[selectedStoreId.value]
  upsertIngredient(it); toast('已清除覆寫')
}
function cycleStatusScoped(obj){
  const cur = statusForScope(obj)
  const next = cur==='available' ? 'low' : cur==='low' ? 'disabled' : 'available'
  setStatusForScope(obj, next)
  upsertIngredient(obj)
}
const checkedIds = reactive(new Set())
const checkedIdsArr = computed({
  get(){ return Array.from(checkedIds) },
  set(v){ checkedIds.clear(); v.forEach(x=>checkedIds.add(x)) }
})
const filteredForStatus = computed(() => {
  const q = qStatus.value.trim()
  return db.ingredients
    .filter(it => !statusTagFilter.size || it.tags.some(tid=>statusTagFilter.has(tid)))
    .filter(it => !q || it.name.includes(q) || (it.code || '').includes(q))
})
function setBatchStatus(s){
  for (const id of checkedIds) {
    const it = db.ingredients.find(x=>x.id===id)
    if (it) setStatusForScope(it, s)
  }
  Promise.all(db.ingredients.map(upsertIngredient)).then(()=>{})
  toast('已更新狀態'); checkedIds.clear()
}
const statusListRef = ref(null)
function scrollToRow(id){
  statusListRef.value?.querySelector?.(`#row-${id}`)?.scrollIntoView({behavior:'smooth', block:'center'})
}

/* ---------- 食材管理 ---------- */
const selectedId = ref(null)
const editing = reactive(blankItem())
const tagToAdd = ref(''); const newTagName = ref('')

function blankItem(){
  return { id:null, name:'', code:'', unit:UNITS[0], shelfLife:0, supplier:'',
          safeStock:0, trackExpiry:false, cost:0, price:0,
          statusGlobal:'available', statusByStore:{},
          tags:[], image:'' }
}
const filteredForList = computed(() => {
  const q = qList.value.trim()
  return db.ingredients
    .filter(it => !listTagFilter.size || it.tags.some(tid=>listTagFilter.has(tid)))
    .filter(it => !q || it.name.includes(q) || (it.code||'').includes(q))
})
function createNew(){ Object.assign(editing, blankItem()); selectedId.value = null }
function selectItem(id){
  selectedId.value = id
  const src = db.ingredients.find(x=>x.id===id)
  if (src) Object.assign(editing, JSON.parse(JSON.stringify(src)))
  drawerOpen.value = false
}
const canSave = computed(() => !!editing.name?.trim() && !!editing.unit)
async function saveItem(){
  if (!editing.name.trim()) return toast('請輸入食材名稱')
  if (!editing.id){
    editing.id = rid()
    db.ingredients.unshift(JSON.parse(JSON.stringify(editing)))
    toast('已新增食材')
  }else{
    const i = db.ingredients.findIndex(x=>x.id===editing.id)
    if (i>=0) db.ingredients[i] = JSON.parse(JSON.stringify(editing))
    toast('已更新食材')
  }
  await upsertIngredient(editing)
  saveFallback()
}
async function removeItem(){
  if (!editing.id) return
  if (!confirm(`確定刪除「${editing.name}」？`)) return
  db.ingredients = db.ingredients.filter(x=>x.id!==editing.id)
  await deleteIngredientById(editing.id)
  saveFallback()
  createNew(); toast('已刪除')
}
function duplicateItem(){
  if (!editing.id) return
  const copy = JSON.parse(JSON.stringify(editing))
  copy.id = null
  copy.name = editing.name + '（複製）'
  Object.assign(editing, copy)
  toast('已複製，請修改後儲存')
}
function revertEditing(){ selectedId.value ? selectItem(selectedId.value) : createNew() }
function pickImage(e){
  const f = e.target.files?.[0]; if (!f) return
  const reader = new FileReader()
  reader.onload = () => { editing.image = String(reader.result) }
  reader.readAsDataURL(f)
}
function addTagToEditing(){
  if (!tagToAdd.value) return
  if (!editing.tags.includes(tagToAdd.value)) editing.tags.push(tagToAdd.value)
  tagToAdd.value = ''
}
function removeTagFromEditing(id){ editing.tags = editing.tags.filter(x=>x!==id) }
function quickCreateTag(){
  if (!newTagName.value.trim()) return
  const t = { id: rid(), name: newTagName.value.trim() }
  db.tags.push(t); upsertTag(t); saveFallback()
  tagToAdd.value = t.id; newTagName.value = ''
  addTagToEditing()
}

/* ---------- 標籤管理 ---------- */
const filteredTags = computed(() => {
  const q = qTag.value.trim()
  return !q ? db.tags : db.tags.filter(t => t.name.includes(q))
})
async function createTag(){
  const name = newTagName.value.trim()
  if (!name) return toast('請輸入標籤名稱')
  if (db.tags.some(t=>t.name===name)) return toast('標籤名稱已存在')
  const t = { id: rid(), name }
  db.tags.push(t)
  newTagName.value = ''
  await upsertTag(t)
  saveFallback()
  toast('已新增標籤')
}
async function renameTag(t){
  const n = prompt('輸入新的標籤名稱：', t.name)
  if (!n) return
  const name = n.trim()
  if (!name) return
  if (db.tags.some(x=>x.id!==t.id && x.name===name)) return toast('名稱重複')
  t.name = name
  await upsertTag(t)
  saveFallback()
  toast('已更名')
}
async function removeTag(t){
  if (!confirm(`刪除標籤「${t.name}」？會同步從所有食材移除`)) return
  db.ingredients.forEach(it => { it.tags = it.tags.filter(id => id !== t.id) })
  db.tags = db.tags.filter(x=>x.id!==t.id)
  await deleteTagById(t.id)
  saveFallback()
  toast('已刪除標籤')
}
function tagUsageCount(id){ return db.ingredients.filter(it => it.tags.includes(id)).length }

const tagListRef = ref(null)
function bindSortable(){
  if (!tagListRef.value) return
  Sortable.create(tagListRef.value, {
    animation: 150, handle: '.grip', draggable: '.tag-row',
    onEnd: async () => {
      const ids = Array.from(tagListRef.value.querySelectorAll('.tag-row')).map(el => el.dataset.id)
      const map = new Map(db.tags.map(t=>[t.id,t]))
      db.tags = ids.map(id => map.get(id)).filter(Boolean)
      await Promise.all(db.tags.map(upsertTag))
      saveFallback()
    }
  })
}
onMounted(() => nextTick(bindSortable))

/* ---------- 匯出 / 匯入 ---------- */
function exportJSON(){
  const data = { ingredients: db.ingredients, tags: db.tags }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'ingredients.json'; a.click()
  URL.revokeObjectURL(url)
}
function importJSON(e){
  const f = e.target.files?.[0]; if (!f) return
  const reader = new FileReader()
  reader.onload = async () => {
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj || !Array.isArray(obj.ingredients) || !Array.isArray(obj.tags)) throw new Error()
      obj.ingredients.forEach(it=>{ it.statusByStore ||= {}; it.statusGlobal ||= 'available' })
      db.ingredients = obj.ingredients
      db.tags = obj.tags
      await Promise.all(db.tags.map(upsertTag))
      await Promise.all(db.ingredients.map(upsertIngredient))
      saveFallback()
      toast('已匯入資料')
    }catch{ toast('匯入失敗：檔案格式錯誤') }
  }
  reader.readAsText(f, 'utf-8')
}
</script>

<style scoped>
/* —— 版面與共用 —— */
.inv-page{padding:16px;background:#f6f8fc;min-height:100vh}
.inv-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.title{font-size:20px;font-weight:800}
.spacer{flex:1}
.card{background:#fff;border:1px solid #e6eaf2;border-radius:16px;padding:12px;margin-bottom:10px}
.muted{color:#64748b}

/* Tabs */
.inv-tabs{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.tab{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:8px 12px;cursor:pointer}
.tab.active{background:#e6f4ff;border-color:#cfe9ff}

/* Grid */
.inv-grid{display:grid;grid-template-columns:320px 1fr;gap:12px}

/* Side */
.inv-side{background:#fff;border:1px solid #e6eaf2;border-radius:16px;overflow:hidden;position:relative}
.side-tools{display:flex;flex-direction:column;gap:10px;padding:10px;border-bottom:1px solid #f0f3f8}
.search{display:flex;align-items:center;gap:6px;border:1px solid #e6eaf2;border-radius:12px;padding:0 10px;min-height:38px;background:#fbfcff}
.input{border:none;outline:none;background:transparent}
.side-actions{display:flex;align-items:center;gap:8px;min-height:40px}
.action-spacer{height:32px;flex:1}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{border:1px solid #e6eaf2;border-radius:999px;background:#fff;padding:6px 10px;cursor:pointer}
.chip.on{background:#eef2ff;border-color:#c7d2fe}
.side-list{max-height:calc(100vh - 240px);overflow:auto;padding:10px}
.side-item{display:flex;gap:10px;align-items:center;border:1px solid #e6eaf2;border-radius:10px;padding:8px;margin-bottom:8px;cursor:pointer;background:#fff}
.side-item.active{outline:2px solid #9ec5ff}
.thumb{width:64px;height:48px;background-size:cover;background-position:center;border-radius:8px;border:1px solid #e6eaf2}
.thumb.sm{width:44px;height:36px}

/* Main */
.inv-main .main-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.only-mobile{display:none}
.h3{margin:4px 0 8px}
.center{text-align:center}
.mt-8{margin-top:8px}
.w200{width:200px}.w160{width:160px}.w120{width:120px}
.ml12{margin-left:12px}
.seg{display:flex;gap:6px}
.segbtn{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer}
.segbtn.active{background:#e6f4ff;border-color:#cfe9ff}

/* 狀態按鈕 */
.state-btn{min-width:72px;border-radius:10px;border:1px solid #e6eaf2;padding:6px 10px;background:#fff;cursor:pointer}
.state-btn.available{border-color:#86efac;background:#f0fdf4;color:#166534}
.state-btn.low{border-color:#fde68a;background:#fffbeb;color:#92400e}
.state-btn.disabled{border-color:#fecaca;background:#fef2f2;color:#991b1b}
.pill{display:inline-flex;gap:6px;align-items:center;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:2px 8px}
.over-chip{margin-left:8px;background:#e0f2fe;border:1px solid #bae6fd;border-radius:999px;padding:2px 8px}

/* 狀況列表 */
.status-list{max-height:calc(100vh - 260px);overflow:auto}
.status-row{display:flex;align-items:center;gap:10px;border:1px solid #e6eaf2;border-radius:12px;padding:10px;margin-bottom:10px;background:#fff}
.ck{display:inline-flex;align-items:center}
.ck input{display:none}
.ck span{width:18px;height:18px;border:1px solid #cbd5e1;border-radius:4px;display:inline-block;background:#fff;position:relative}
.ck input:checked + span::after{content:'';position:absolute;inset:2px;background:#2563eb;border-radius:2px}

/* 右側操作 */
.right-actions{display:flex;align-items:center;gap:8px;margin-left:auto}

/* 表單 */
.form-cols{display:grid;grid-template-columns:220px 1fr;gap:16px}
.uploader input[type=file]{display:none}
.thumb.xl{width:180px;height:135px;border-radius:12px}
.fields .row{margin-bottom:10px}
.label{min-width:80px;color:#475569}
.tagdock{display:flex;flex-direction:column;gap:8px}
.taglist{display:flex;flex-wrap:wrap;gap:6px}
.taglist .pill .x{border:none;background:transparent;cursor:pointer;opacity:.7}

/* 標籤拖曳 */
.tag-row{display:flex;align-items:center;gap:10px;border:1px solid #e6eaf2;border-radius:10px;padding:8px;background:#fff;margin-bottom:8px}
.grip{cursor:grab;opacity:.6}

/* 手機抽屜 */
.backdrop{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:30}

/* 底部工具列 */
.bottom{max-width:1200px;margin:12px auto 0;background:#fff;border:1px solid #e6eaf2;border-radius:16px;padding:12px}

@media (max-width:1024px){
  .inv-grid{grid-template-columns:1fr}
  .inv-side{position:fixed;inset:0 auto 0 0;width:82%;max-width:340px;z-index:40;transform:translateX(-100%);transition:.2s}
  .inv-side.open{transform:translateX(0)}
  .only-mobile{display:inline-flex}
  .status-list{max-height:none}
  .form-cols{grid-template-columns:1fr}
}
</style>
