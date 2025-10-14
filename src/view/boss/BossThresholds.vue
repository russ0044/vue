<template>
  <section class="inv-page">
    <!-- 頁首 -->
    <header class="inv-header">
      <div class="title">警示門檻（老闆）</div>
      <div class="spacer"></div>
      <button class="icon-btn" title="頁面設定" @click="toast('尚未實作：頁面設定')">⚙</button>
    </header>

    <!-- 頂部工具 -->
    <div class="inv-tabs">
      <div class="seg">
        <button :class="['segbtn', scope==='global' && 'active']" @click="switchScope('global')">全門市統一</button>
        <button :class="['segbtn', scope==='store'  && 'active']" @click="switchScope('store')">單店覆寫</button>
      </div>
      <select v-if="scope==='store'" v-model="selectedStoreId" class="input">
        <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <div class="spacer"></div>

      <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
      <label class="btn ghost small file-btn">
        匯入 JSON
        <input type="file" accept="application/json" @change="importJSON">
      </label>
    </div>

    <div class="inv-grid">
      <!-- 左欄（與全站一致樣式，頁內滾動，不影響總功能欄） -->
      <aside class="inv-side">
        <div class="side-store">
          <div class="avatar">📦</div>
          <div class="meta">
            <div class="name">{{ store.name }}</div>
            <div class="muted">ID：{{ store.id }}</div>
          </div>
          <button class="icon-btn" title="店家設定" @click="toast('尚未實作：店家設定')">⚙</button>
        </div>

        <!-- 搜尋＋批次 -->
        <div class="side-tools">
          <div class="search">
            <span>🔎</span>
            <input class="input" placeholder="搜尋食材名稱或代碼…" v-model.trim="qList">
          </div>

          <div class="side-actions">
            <div class="muted small" v-if="checkedIds.size">已選 {{ checkedIds.size }} 項</div>
            <div class="spacer"></div>
            <button class="btn small" :disabled="!checkedIds.size" @click="applyBatchToSelected">套用到勾選</button>
            <button class="btn small" :disabled="!checkedIds.size || scope!=='store'" @click="clearBatchOverride">清除覆寫</button>
          </div>

          <div class="chips">
            <button
              v-for="t in tags"
              :key="t.id"
              class="chip"
              :class="{on: tagFilter.has(t.id)}"
              @click="toggleTag(t.id)"
            >#{{ t.name }}</button>
          </div>
        </div>

        <!-- 左側清單 -->
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
                {{ (it.code||'—') }}｜單位：{{ it.unit }}
                <span v-if="scope==='store' && isOverridden(it.id)" class="over-chip">已覆寫</span>
              </div>
            </div>
          </div>
          <p v-if="!filteredIngredients.length" class="muted center">沒有符合的食材</p>
        </div>
      </aside>

      <!-- 右欄：規則編輯 -->
      <main class="inv-main card">
        <template v-if="selected">
          <div class="main-head">
            <div class="title">設定：{{ selected.name }} <span class="muted small">（{{ selected.code || '無代碼' }}）</span></div>
            <div class="spacer"></div>
            <button v-if="scope==='store' && isOverridden(selected.id)" class="btn ghost" @click="clearOverride(selected.id)">清除覆寫</button>
            <button class="btn" @click="resetEditing">還原</button>
            <button class="btn primary" :disabled="!validAll" @click="saveEditing">儲存</button>
          </div>

          <div class="form-cols">
            <!-- 基本門檻 -->
            <section class="card-lite">
              <h3 class="h3">基本門檻</h3>
              <div class="row gap">
                <label class="label">下限</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.min">
                <label class="label">再進貨點(ROP)</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.rop">
                <label class="label">上限</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.max">
              </div>

              <div class="row gap mt-8">
                <label class="label">單次下單上限</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.perOrderMax">
                <label class="label">每日總上限</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.dailyMax">
                <label class="label">允許欠單</label>
                <label class="chk">
                  <input type="checkbox" v-model="edit.allowBackorder"><span></span>
                </label>
              </div>

              <p v-if="!validRange" class="warn-text">※ 請確認：下限 ≤ ROP ≤ 上限</p>
            </section>

            <!-- 進階警示 -->
            <section class="card-lite">
              <h3 class="h3">進階警示</h3>
              <div class="row gap">
                <label class="label">效期剩餘天數警示</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.expiryWarnDays">
                <label class="label">成本異常波動％</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.priceChangePct">
                <label class="label">連續缺貨天數</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.shortageDays">
                <label class="label">下單頻率異常％</label>
                <input type="number" min="0" class="input w120" v-model.number="edit.freqSpikePct">
              </div>
              <p class="muted small">說明：  
                成本異常波動％為與過去平均成本的差異；下單頻率異常％為相較過去平均下單頻率的增幅門檻。</p>
            </section>

            <!-- 限制策略 -->
            <section class="card-lite">
              <h3 class="h3">員工下單限制策略</h3>
              <div class="row gap">
                <label class="radio">
                  <input type="radio" value="block" v-model="edit.enforce">
                  <span></span> 禁止超量（超過上限或不符門檻直接阻擋）
                </label>
              </div>
              <div class="row gap">
                <label class="radio">
                  <input type="radio" value="approve" v-model="edit.enforce">
                  <span></span> 需主管核准（建立申請，老闆核准後才成立）
                </label>
              </div>
              <div class="row gap">
                <label class="radio">
                  <input type="radio" value="warn" v-model="edit.enforce">
                  <span></span> 僅提醒（可繼續下單，但系統會標示異常）
                </label>
              </div>
            </section>

            <!-- 套用工具 -->
            <section class="card-lite">
              <h3 class="h3">快速套用</h3>
              <div class="row gap">
                <button class="btn" @click="applyToAllItems">套用到所有食材（同篩選結果）</button>
                <button class="btn" v-if="scope==='global'" @click="applyToAllStores">套用到全部門市（建立覆寫）</button>
              </div>
              <p class="muted small">提示：若在「單店覆寫」下，儲存會只影響該門市；在「全門市統一」下，儲存會更新共用規則。</p>
            </section>
          </div>
        </template>

        <template v-else>
          <div class="empty">請從左側選擇一個食材</div>
        </template>
      </main>
    </div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
defineOptions({ name: 'BossThresholds' })

/* 假圖 */
const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
  <rect width="100%" height="100%" fill="#eef2ff"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">No Image</text>
</svg>`)

/* 小工具 */
function rid(){ return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2,10) }
const toastMsg = ref(''); function toast(m){ toastMsg.value = m; setTimeout(()=>toastMsg.value='',1400) }

/* ─── 讀取「食材/門市/標籤」：沿用 boss-ingredients ─── */
const { ingredients, tags, stores } = loadIngredients()
function loadIngredients(){
  const raw = localStorage.getItem('boss-ingredients')
  if (raw){
    try{
      const obj = JSON.parse(raw)
      obj.ingredients ||= []; obj.tags ||= []; obj.stores ||= [
        { id: rid(), name: '某某餐飲-總店' },
        { id: rid(), name: '某某餐飲-東門店' },
        { id: rid(), name: '某某餐飲-西門店' },
      ]
      return obj
    }catch{}
  }
  // 沒資料時給最小可運行的假資料
  const t1 = { id: rid(), name: '生鮮' }, t2 = { id: rid(), name: '蔬菜' }
  const s1 = { id: rid(), name: '某某餐飲-總店' }, s2 = { id: rid(), name: '某某餐飲-東門店' }
  const ingredients = [
    { id: rid(), name:'新鮮雞腿', code:'CK-001', unit:'份', tags:[t1.id], image:'' },
    { id: rid(), name:'高麗菜',   code:'VE-010', unit:'顆', tags:[t2.id], image:'' },
  ]
  return { ingredients, tags:[t1,t2], stores:[s1,s2] }
}

/* ─── 左欄搜尋/篩選/勾選 ─── */
const store = reactive({ name:'某某餐飲店', id:'123456789' })
const qList = ref('')
const tagFilter = reactive(new Set())
function toggleTag(id){ tagFilter.has(id) ? tagFilter.delete(id) : tagFilter.add(id) }

const checkedIds = reactive(new Set())
const checkedIdsArr = computed({
  get(){ return Array.from(checkedIds) },
  set(v){ checkedIds.clear(); v.forEach(x=>checkedIds.add(x)) }
})

const filteredIngredients = computed(()=>{
  const q = qList.value.trim()
  return ingredients
    .filter(it => !tagFilter.size || it.tags?.some(tid=>tagFilter.has(tid)))
    .filter(it => !q || it.name.includes(q) || (it.code||'').includes(q))
})

/* ─── 門檻資料庫（獨立儲存） ───
  結構：
  thresholds = {
    [ingredientId]: {
      global: Rule,
      byStore: { [storeId]: Rule }
    }
  }
*/
const thresholds = reactive(loadThresholds())
function loadThresholds(){
  const raw = localStorage.getItem('boss-thresholds')
  if (raw){
    try{
      const obj = JSON.parse(raw)
      return obj || {}
    }catch{}
  }
  return {} // 初始空物件
}
function saveThresholds(){ localStorage.setItem('boss-thresholds', JSON.stringify(thresholds)) }

/* 預設規則 */
function defaultRule(){
  return {
    min: 0,
    rop: 0,
    max: 100,
    perOrderMax: 50,
    dailyMax: 100,
    allowBackorder: false,
    expiryWarnDays: 3,
    priceChangePct: 20,
    shortageDays: 2,
    freqSpikePct: 50,
    enforce: 'approve', // block | approve | warn
  }
}

/* 作用範圍：全門市/單店覆寫 */
const scope = ref('global') // 'global' | 'store'
const selectedStoreId = ref(stores[0]?.id || '')
function switchScope(s){ scope.value = s }

/* 當前選取的食材 */
const selectedId = ref(null)
const selected = computed(()=> ingredients.find(x=>x.id===selectedId.value) || null)
function selectIngredient(id){
  selectedId.value = id
  loadEditing()
}

/* 判斷是否覆寫 */
function isOverridden(ingId){
  const rec = thresholds[ingId]
  if (!rec) return false
  return !!(rec.byStore && rec.byStore[selectedStoreId.value] !== undefined)
}

/* 取得實際規則（依 scope fallback） */
function ruleFor(ingId){
  const rec = thresholds[ingId] || (thresholds[ingId] = { global: defaultRule(), byStore:{} })
  if (scope.value==='store'){
    return rec.byStore[selectedStoreId.value] ?? rec.global
  }
  return rec.global
}

/* 編輯中的規則（不直接寫 DB，點儲存才寫入） */
const edit = reactive(defaultRule())
function loadEditing(){
  if (!selected.value) return
  Object.assign(edit, JSON.parse(JSON.stringify(ruleFor(selected.value.id))))
}
watch([selectedId, scope, selectedStoreId], loadEditing)

/* 驗證 */
const validRange = computed(()=> edit.min <= edit.rop && edit.rop <= edit.max)
const validAll   = computed(()=> validRange.value)

/* 動作：儲存／還原／覆寫管理 */
function saveEditing(){
  if (!selected.value) return
  const ingId = selected.value.id
  const rec = thresholds[ingId] || (thresholds[ingId] = { global: defaultRule(), byStore:{} })
  if (scope.value==='store'){
    rec.byStore[selectedStoreId.value] = JSON.parse(JSON.stringify(edit))
  }else{
    rec.global = JSON.parse(JSON.stringify(edit))
  }
  saveThresholds()
  toast('已儲存門檻')
}
function resetEditing(){ loadEditing(); toast('已還原') }
function clearOverride(ingId){
  const rec = thresholds[ingId]; if (!rec || !rec.byStore) return
  delete rec.byStore[selectedStoreId.value]
  saveThresholds(); loadEditing(); toast('已清除覆寫')
}

/* 批次套用到勾選 */
function applyBatchToSelected(){
  if (!checkedIds.size || !validAll.value) return
  const data = JSON.parse(JSON.stringify(edit))
  checkedIds.forEach(id=>{
    const rec = thresholds[id] || (thresholds[id] = { global: defaultRule(), byStore:{} })
    if (scope.value==='store') rec.byStore[selectedStoreId.value] = JSON.parse(JSON.stringify(data))
    else rec.global = JSON.parse(JSON.stringify(data))
  })
  saveThresholds(); toast('已套用至勾選的食材')
}

/* 套用到所有（目前篩選後）食材 */
function applyToAllItems(){
  if (!validAll.value) return
  const data = JSON.parse(JSON.stringify(edit))
  filteredIngredients.value.forEach(it=>{
    const rec = thresholds[it.id] || (thresholds[it.id] = { global: defaultRule(), byStore:{} })
    if (scope.value==='store') rec.byStore[selectedStoreId.value] = JSON.parse(JSON.stringify(data))
    else rec.global = JSON.parse(JSON.stringify(data))
  })
  saveThresholds(); toast('已套用至目前清單的所有食材')
}

/* 全門市統一 → 一鍵生成所有門市覆寫 */
function applyToAllStores(){
  if (!selected.value || scope.value!=='global' || !validAll.value) return
  const rec = thresholds[selected.value.id] || (thresholds[selected.value.id] = { global: defaultRule(), byStore:{} })
  const data = JSON.parse(JSON.stringify(edit))
  stores.forEach(s => { rec.byStore[s.id] = JSON.parse(JSON.stringify(data)) })
  saveThresholds(); toast('已建立全部門市覆寫')
}

/* 批次清除覆寫（僅在單店下） */
function clearBatchOverride(){
  if (scope.value!=='store' || !checkedIds.size) return
  checkedIds.forEach(id=>{
    const rec = thresholds[id]; if (rec?.byStore) delete rec.byStore[selectedStoreId.value]
  })
  saveThresholds(); toast('已清除勾選的覆寫')
}

/* 匯入／匯出 */
function exportJSON(){
  const blob = new Blob([JSON.stringify(thresholds, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='boss-thresholds.json'; a.click()
  URL.revokeObjectURL(url)
}
function importJSON(e){
  const f = e.target.files?.[0]; if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const obj = JSON.parse(String(reader.result))
      if (!obj || typeof obj!=='object') throw new Error()
      for (const k in obj) thresholds[k] = obj[k]
      saveThresholds(); loadEditing(); toast('已匯入門檻')
    }catch{ toast('匯入失敗：檔案格式錯誤') }
  }
  reader.readAsText(f, 'utf-8')
}
</script>

<style scoped>
/* 固定頁面自身滾動，避免影響整站側欄 */
.inv-page{padding:16px;background:#f6f8fc;height:100vh;overflow:auto;contain:layout paint}
.inv-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.title{font-size:20px;font-weight:800}
.icon-btn{border:none;background:transparent;cursor:pointer;font-size:18px;opacity:.85}
.icon-btn:hover{opacity:1}
.spacer{flex:1}

.inv-tabs{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.btn{border:1px solid #cfe0ff;background:#fff;color:#2563eb;border-radius:10px;padding:8px 12px;cursor:pointer}
.btn.primary{background:#2563eb;border-color:#2563eb;color:#fff}
.btn.ghost{border-color:#e6eaf2;color:#334155;background:#fff}
.btn.small{padding:6px 10px}
.file-btn{position:relative;overflow:hidden}
.file-btn input{position:absolute;inset:0;opacity:0;cursor:pointer}

.inv-grid{display:grid;grid-template-columns:320px 1fr;gap:12px;contain:layout paint}
.inv-side{background:#fff;border:1px solid #e6eaf2;border-radius:16px;overflow:hidden}
.side-store{display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid #f0f3f8}
.avatar{width:40px;height:40px;border-radius:50%;background:#eef2ff;display:grid;place-items:center}
.meta{flex:1}.name{font-weight:700}
.side-tools{display:flex;flex-direction:column;gap:10px;padding:10px;border-bottom:1px solid #f0f3f8}
.search{display:flex;align-items:center;gap:6px;border:1px solid #e6eaf2;border-radius:12px;padding:0 10px;min-height:38px;background:#fbfcff}
.input{border:none;outline:none;background:transparent}
.side-actions{display:flex;align-items:center;gap:8px;min-height:40px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{border:1px solid #e6eaf2;border-radius:999px;background:#fff;padding:6px 10px;cursor:pointer}
.chip.on{background:#eef2ff;border-color:#c7d2fe}
.side-list{max-height:calc(100vh - 280px);overflow:auto;padding:10px}
.side-item{display:flex;gap:10px;align-items:center;border:1px solid #e6eaf2;border-radius:10px;padding:8px;margin-bottom:8px;background:#fff;cursor:pointer}
.side-item.active{outline:2px solid #9ec5ff}
.thumb{width:64px;height:48px;background-size:cover;background-position:center;border-radius:8px;border:1px solid #e6eaf2}
.thumb.sm{width:44px;height:36px}
.center{text-align:center}.muted{color:#64748b}.small{font-size:12px}

.card{background:#fff;border:1px solid #e6eaf2;border-radius:16px;padding:12px}
.card-lite{border:1px dashed #e6eaf2;border-radius:12px;padding:12px;margin-bottom:12px;background:#fcfdff}
.main-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.h3{margin:4px 0 8px}
.row{display:flex;align-items:center}
.gap{gap:8px}
.mt-8{margin-top:8px}
.label{min-width:90px;color:#475569}
.w120{width:120px}
.warn-text{color:#b91c1c;margin-top:6px}

.ck{display:inline-flex;align-items:center;margin-right:6px}
.ck input{display:none}
.ck span{width:18px;height:18px;border:1px solid #cbd5e1;border-radius:4px;display:inline-block;background:#fff;position:relative}
.ck input:checked + span::after{content:'';position:absolute;inset:2px;background:#2563eb;border-radius:2px}

.seg{display:flex;gap:6px}
.segbtn{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer}
.segbtn.active{background:#e6f4ff;border-color:#cfe9ff}

.over-chip{margin-left:6px;background:#e0f2fe;border:1px solid #bae6fd;border-radius:999px;padding:2px 8px}
.radio{display:flex;align-items:center;gap:8px}
.radio input{appearance:none;width:16px;height:16px;border:1px solid #cbd5e1;border-radius:50%;position:relative}
.radio input:checked{border-color:#2563eb}
.radio input:checked::after{content:'';position:absolute;inset:3px;background:#2563eb;border-radius:50%}
.chk{display:inline-flex;align-items:center}
.chk input{display:none}
.chk span{width:20px;height:20px;border:1px solid #cbd5e1;border-radius:6px;display:inline-block;position:relative;background:#fff}
.chk input:checked + span::after{content:'';position:absolute;inset:3px;background:#2563eb;border-radius:4px}

/* RWD */
@media (max-width:1024px){
  .inv-grid{grid-template-columns:1fr}
  .side-list{max-height:none}
}
/* 根容器不再自己控制 100vh，交給 .route-shell；避免雙捲軸 */
.inv-page{
  padding: 16px;
  background: #f6f8fc;
  min-height: 100%;
  height: auto;
  overflow: visible;
}

/* Grid 兩欄：確保右側可以縮放、不擠出螢幕 */
.inv-grid{
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  min-width: 0;          /* 🔑 允許子元素縮小 */
}

/* 右側主卡片：允許內容換行、不要被裁切 */
.inv-main{
  min-width: 0;          /* 🔑 避免長行把容器撐爆 */
  overflow: visible;     /* 讓長文字完整顯示 */
}

/* 側欄清單視窗內滾，不影響整體 */
.side-list{ max-height: calc(100vh - 280px); overflow: auto; }

/* 表單列：允許自動換行避免文字被截斷 */
.row{ display:flex; align-items:center; }
.row.gap{ gap:8px; flex-wrap: wrap; }      /* 🔑 多欄位不足時自動換行 */
.label{ min-width: 90px; color:#475569; }  /* 可依需要調整 min-width */

/* 任何可能很長的文字都可安全換行 */
.inv-main, .card, .card-lite{
  overflow-wrap: anywhere;  /* 🔑 長詞/英文也能換行 */
}

/* 若仍見右側「最後一欄文字被吃掉」的情況，補上這行 */
.inv-grid > * { min-width: 0; }

</style>
