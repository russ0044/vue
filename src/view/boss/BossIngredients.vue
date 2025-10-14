<template>
  <section class="inv-page">
    <header class="inv-header">
      <div class="title">食材資料</div>
      <div class="spacer"></div>
      <button class="icon-btn" title="頁面設定" @click="toast('尚未實作：頁面設定')">⚙</button>
    </header>

    <div class="inv-tabs">
      <button :class="['tab', tab==='status' && 'active']" @click="switchTab('status')">食材狀況設定</button>
      <button :class="['tab', tab==='manage' && 'active']" @click="switchTab('manage')">食材管理</button>
      <button :class="['tab', tab==='tags'   && 'active']" @click="switchTab('tags')">標籤管理</button>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
      <label class="btn ghost small file-btn">
        匯入 JSON
        <input type="file" accept="application/json" @change="importJSON">
      </label>
    </div>

    <div class="inv-grid">
      <!-- 左欄（樣式與結構在三個分頁完全一致） -->
      <aside class="inv-side" :class="{open: drawerOpen}">
        <div class="side-store">
          <div class="avatar">🥗</div>
          <div class="meta">
            <div class="name">{{ store.name }}</div>
            <div class="muted">ID：{{ store.id }}</div>
          </div>
          <button class="icon-btn" title="店家設定" @click="toast('尚未實作：店家設定')">⚙</button>
        </div>

        <!-- 統一的工具列：搜尋列 → 動作列 → 標籤列（高度一致） -->
        <div class="side-tools">
          <!-- 搜尋列 -->
          <div class="search">
            <span>{{ tab==='tags' ? '🔖' : '🔎' }}</span>
            <input class="input"
                   :placeholder="sideSearchPlaceholder"
                   v-model="sideSearchModel">
          </div>

          <!-- 動作列（統一高度，分頁帶入對應動作；沒動作就留空位） -->
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

          <!-- 標籤 Chips（統一顯示；邏輯依分頁作用） -->
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

        <!-- 左欄清單（樣式一致的卡片項） -->
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

      <!-- 右欄內容 -->
      <main class="inv-main card">
        <!-- 狀況設定（全門市/單店覆寫） -->
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

              <div class="row gap">
                <button class="state-btn" :class="statusForScope(it)" @click="cycleStatusScoped(it)">
                  {{ statusText(statusForScope(it)) }}
                </button>
                <button v-if="scope==='store' && isOverridden(it)" class="btn ghost small" @click="clearOverride(it)">清除覆寫</button>
              </div>
            </div>
          </div>
        </template>

        <!-- 食材管理（右側編輯器） -->
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

        <!-- 標籤管理（右側說明） -->
        <template v-else>
          <h3 class="h3">標籤管理</h3>
          <p class="muted">在左側可新增／重新命名／刪除標籤；編輯食材時可直接加入或新建標籤。</p>
        </template>
      </main>
    </div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import Sortable from 'sortablejs'
defineOptions({ name: 'BossIngredients' })

/* ===== 常數 / 假圖 ===== */
const UNITS = ['個','份','公斤','公克','公升','毫升','盒','包','罐','瓶','條']
const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
    <rect width="100%" height="100%" fill="#eef2ff"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="#94a3b8" font-family="sans-serif" font-size="14">No Image</text>
  </svg>`)

/* ===== 分頁 / 抽屜 ===== */
const tab = ref('status')
const drawerOpen = ref(false)
function switchTab(t){ tab.value = t; drawerOpen.value = false; nextTick(bindSortable) }

/* ===== DB（含單店覆寫） ===== */
const db = reactive(loadDB())
function saveDB(){ localStorage.setItem('boss-ingredients', JSON.stringify(db)) }
function loadDB(){
  const raw = localStorage.getItem('boss-ingredients')
  if (raw){
    try{
      const obj = JSON.parse(raw)
      obj.ingredients ||= []; obj.tags ||= []; obj.stores ||= defaultStores()
      obj.ingredients.forEach(it=>{
        if (it.status && !it.statusGlobal) it.statusGlobal = it.status
        it.statusByStore ||= {}
      })
      return obj
    }catch{}
  }
  const tags = [
    { id: rid(), name: '生鮮' },
    { id: rid(), name: '冷凍' },
    { id: rid(), name: '蔬菜' },
  ]
  const stores = defaultStores()
  const ingredients = [
    { id: rid(), name: '新鮮雞腿', code:'CK-001', unit:'份', shelfLife:2, supplier:'良品生鮮',
      safeStock:10, trackExpiry:true, cost:25, price:60, statusGlobal:'available', statusByStore:{}, tags:[tags[0].id], image:'' },
    { id: rid(), name: '新鮮豬腿', code:'PK-002', unit:'公斤', shelfLife:3, supplier:'鮮肉行',
      safeStock:8, trackExpiry:true, cost:180, price:260, statusGlobal:'low', statusByStore:{}, tags:[tags[0].id], image:'' },
    { id: rid(), name: '高麗菜', code:'VE-010', unit:'顆', shelfLife:5, supplier:'市場商行',
      safeStock:6, trackExpiry:false, cost:30, price:80, statusGlobal:'available', statusByStore:{}, tags:[tags[2].id], image:'' },
  ]
  return { ingredients, tags, stores }
}
function defaultStores(){
  return [
    { id: rid(), name: '某某餐飲-總店' },
    { id: rid(), name: '某某餐飲-東門店' },
    { id: rid(), name: '某某餐飲-西門店' },
  ]
}

/* ===== 共用工具 ===== */
const store = reactive({ name:'某某餐飲店', id:'123456789' })
function rid(){ return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2,10) }
const toastMsg = ref(''); function toast(m){ toastMsg.value=m; setTimeout(()=>toastMsg.value='',1400) }
function tagName(id){ return db.tags.find(t=>t.id===id)?.name ?? '（已刪除）' }
function statusText(s){ return s==='available'?'可用':s==='low'?'缺貨':'停售' }

/* ===== 左欄統一搜尋模型 / Chips 行為 ===== */
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
function isChipOn(id){
  if (tab.value==='manage') return listTagFilter.has(id)
  if (tab.value==='status') return statusTagFilter.has(id)
  // tags：以是否被當作搜尋字串來亮顯
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

/* ===== 狀況設定（全門市/單店） ===== */
const scope = ref('global')
const selectedStoreId = ref(db.stores[0]?.id || '')
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
function isOverridden(it){
  return scope.value==='store' && it.statusByStore?.[selectedStoreId.value] !== undefined
}
function clearOverride(it){
  if (!it.statusByStore) return
  delete it.statusByStore[selectedStoreId.value]
  saveDB(); toast('已清除覆寫')
}
function cycleStatusScoped(obj){
  const cur = statusForScope(obj)
  const next = cur==='available' ? 'low' : cur==='low' ? 'disabled' : 'available'
  setStatusForScope(obj, next); saveDB()
}
/* 狀況分頁：篩選/多選 */
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
  saveDB(); toast('已更新狀態'); checkedIds.clear()
}
const statusListRef = ref(null)
function scrollToRow(id){
  statusListRef.value?.querySelector?.(`#row-${id}`)?.scrollIntoView({behavior:'smooth', block:'center'})
}

/* ===== 食材管理 ===== */
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
function saveItem(){
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
  saveDB()
}
function removeItem(){
  if (!editing.id) return
  if (!confirm(`確定刪除「${editing.name}」？`)) return
  db.ingredients = db.ingredients.filter(x=>x.id!==editing.id)
  saveDB(); createNew(); toast('已刪除')
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
  reader.onload = () => { editing.image = String(reader.result); }
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
  db.tags.push(t); saveDB()
  tagToAdd.value = t.id; newTagName.value = ''
  addTagToEditing()
}

/* ===== 標籤管理（左欄拖曳） ===== */
const filteredTags = computed(() => {
  const q = qTag.value.trim()
  return !q ? db.tags : db.tags.filter(t => t.name.includes(q))
})
function createTag(){
  if (!newTagName.value.trim()) return
  if (db.tags.some(t=>t.name===newTagName.value.trim())) return toast('標籤名稱已存在')
  db.tags.push({ id: rid(), name: newTagName.value.trim() })
  newTagName.value = ''; saveDB(); toast('已新增標籤')
}
function renameTag(t){
  const n = prompt('輸入新的標籤名稱：', t.name)
  if (!n) return
  if (db.tags.some(x=>x.id!==t.id && x.name===n.trim())) return toast('名稱重複')
  t.name = n.trim(); saveDB(); toast('已更名')
}
function removeTag(t){
  if (!confirm(`刪除標籤「${t.name}」？會同步從所有食材移除`)) return
  db.ingredients.forEach(it => { it.tags = it.tags.filter(id => id !== t.id) })
  db.tags = db.tags.filter(x=>x.id!==t.id)
  saveDB(); toast('已刪除標籤')
}
function tagUsageCount(id){ return db.ingredients.filter(it => it.tags.includes(id)).length }
const tagListRef = ref(null)
function bindSortable(){
  if (tagListRef.value){
    Sortable.create(tagListRef.value, {
      animation: 150,
      handle: '.grip',
      draggable: '.tag-row',
      onEnd: () => {
        const ids = Array.from(tagListRef.value.querySelectorAll('.tag-row')).map(el => el.dataset.id)
        const map = new Map(db.tags.map(t=>[t.id,t]))
        db.tags = ids.map(id => map.get(id)).filter(Boolean)
        saveDB()
      }
    })
  }
}
onMounted(() => nextTick(bindSortable))

/* ===== 匯入匯出 ===== */
function exportJSON(){
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'ingredients.json'; a.click()
  URL.revokeObjectURL(url)
}
function importJSON(e){
  const f = e.target.files?.[0]; if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj || !Array.isArray(obj.ingredients) || !Array.isArray(obj.tags)) throw new Error()
      obj.stores ||= defaultStores()
      obj.ingredients.forEach(it=>{
        if (it.status && !it.statusGlobal) it.statusGlobal = it.status
        it.statusByStore ||= {}
      })
      db.ingredients = obj.ingredients
      db.tags = obj.tags
      db.stores = obj.stores
      saveDB(); toast('已匯入資料')
    }catch{ toast('匯入失敗：檔案格式錯誤') }
  }
  reader.readAsText(f, 'utf-8')
}
</script>

<style scoped>
/* 命名空間 inv-，避免影響全站左側主功能欄 */
.inv-page{padding:16px;background:#f6f8fc;min-height:100vh}
.inv-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.title{font-size:20px;font-weight:800}
.icon-btn{border:none;background:transparent;cursor:pointer;font-size:18px;opacity:.85}
.icon-btn:hover{opacity:1}
.spacer{flex:1}

/* Tabs */
.inv-tabs{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.tab{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:8px 12px;cursor:pointer}
.tab.active{background:#e6f4ff;border-color:#cfe9ff}
.btn{border:1px solid #cfe0ff;background:#fff;color:#2563eb;border-radius:10px;padding:8px 12px;cursor:pointer}
.btn.primary{background:#2563eb;border-color:#2563eb;color:#fff}
.btn.ghost{border-color:#e6eaf2;color:#334155;background:#fff}
.btn.small{padding:6px 10px}
.btn.danger{border-color:#fecaca;color:#b91c1c;background:#fff}
.btn.warn{border-color:#fde68a;color:#b45309;background:#fff}
.file-btn{position:relative;overflow:hidden}
.file-btn input{position:absolute;inset:0;opacity:0;cursor:pointer}

/* 內容雙欄 */
.inv-grid{display:grid;grid-template-columns:320px 1fr;gap:12px}

/* 左欄（三分頁一致） */
.inv-side{background:#fff;border:1px solid #e6eaf2;border-radius:16px;overflow:hidden;position:relative}
.side-store{display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid #f0f3f8}
.avatar{width:40px;height:40px;border-radius:50%;background:#eef2ff;display:grid;place-items:center}
.meta{flex:1}.name{font-weight:700}

.side-tools{display:flex;flex-direction:column;gap:10px;padding:10px;border-bottom:1px solid #f0f3f8}
.search{display:flex;align-items:center;gap:6px;border:1px solid #e6eaf2;border-radius:12px;padding:0 10px;min-height:38px;background:#fbfcff}
.input{border:none;outline:none;background:transparent}
.side-actions{display:flex;align-items:center;gap:8px;min-height:40px} /* 統一高度 */
.action-spacer{height:32px;flex:1} /* 無動作時佔位 */
.chips{display:flex;gap:8px;flex-wrap:wrap}

.chip{border:1px solid #e6eaf2;border-radius:999px;background:#fff;padding:6px 10px;cursor:pointer}
.chip.on{background:#eef2ff;border-color:#c7d2fe}

.side-list{max-height:calc(100vh - 280px);overflow:auto;padding:10px}
.side-item{display:flex;gap:10px;align-items:center;border:1px solid #e6eaf2;border-radius:10px;padding:8px;margin-bottom:8px;cursor:pointer;background:#fff}
.side-item.active{outline:2px solid #9ec5ff}
.thumb{width:64px;height:48px;background-size:cover;background-position:center;border-radius:8px;border:1px solid #e6eaf2}
.thumb.sm{width:44px;height:36px}
.w-full{width:100%}

/* 右欄主卡片 */
.card{background:#fff;border:1px solid #e6eaf2;border-radius:16px;padding:12px}
.inv-main .main-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.only-mobile{display:none}
.h3{margin:4px 0 8px}
.muted{color:#64748b}.small{font-size:12px}
.center{text-align:center}
.mt-8{margin-top:8px}
.w200{width:200px}.w160{width:160px}.w120{width:120px}
.ml12{margin-left:12px}

/* Seg */
.seg{display:flex;gap:6px}
.segbtn{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer}
.segbtn.active{background:#e6f4ff;border-color:#cfe9ff}

/* 狀態按鈕 */
.state-btn{min-width:72px;border-radius:10px;border:1px solid #e6eaf2;padding:6px 10px;background:#fff;cursor:pointer}
.state-btn.available{border-color:#86efac;background:#f0fdf4;color:#166534}
.state-btn.low{border-color:#fde68a;background:#fffbeb;color:#92400e}
.state-btn.disabled{border-color:#fecaca;background:#fef2f2;color:#991b1b}
.pill{display:inline-flex;gap:6px;align-items:center;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:2px 8px;margin-right:6px}
.over-chip{margin-left:8px;background:#e0f2fe;border:1px solid #bae6fd;border-radius:999px;padding:2px 8px}

/* 狀況列表 */
.status-list{max-height:calc(100vh - 260px);overflow:auto}
.status-row{display:flex;align-items:center;gap:10px;border:1px solid #e6eaf2;border-radius:12px;padding:10px;margin-bottom:10px;background:#fff}
.ck{display:inline-flex;align-items:center}
.ck input{display:none}
.ck span{width:18px;height:18px;border:1px solid #cbd5e1;border-radius:4px;display:inline-block;background:#fff;position:relative}
.ck input:checked + span::after{content:'';position:absolute;inset:2px;background:#2563eb;border-radius:2px}

/* 管理表單 */
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
@media (max-width:1024px){
  .inv-grid{grid-template-columns:1fr}
  .inv-side{position:fixed;inset:0 auto 0 0;width:82%;max-width:340px;z-index:40;transform:translateX(-100%);transition:.2s}
  .inv-side.open{transform:translateX(0)}
  .only-mobile{display:inline-flex}
  .status-list{max-height:none}
  .form-cols{grid-template-columns:1fr}
}
</style>
  