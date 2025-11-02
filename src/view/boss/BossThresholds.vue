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
        <input
          class="input search-input"
          placeholder="搜尋食材名稱或代碼…"
          v-model.trim="qList"
        >
      </div>
    </div>

    <div class="inv-grid">
      <!-- 左欄：清單 -->
      <aside class="inv-side">
        <div class="side-tools">
          <div class="row gap">
            <div class="muted small" v-if="checkedIds.size">已選 {{ checkedIds.size }} 項</div>
            <div class="spacer"></div>

            <button class="btn small" :disabled="!checkedIds.size" @click="applyBatchToSelected">
              套用到勾選
            </button>

            <button
              class="btn small ghost"
              :disabled="!checkedIds.size || scope!=='store'"
              @click="clearBatchOverride"
            >
              清除覆寫
            </button>
          </div>

          <div class="chips">
            <button
              v-for="t in tags"
              :key="t.id"
              class="chip"
              :class="{ on: tagFilter.has(t.id) }"
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
            :class="{ active: it.id===selectedId }"
            @click="selectIngredient(it.id)"
          >
            <label class="ck" @click.stop>
              <input type="checkbox" :value="it.id" v-model="checkedIdsArr">
              <span></span>
            </label>

            <div
              class="thumb sm"
              :style="{ backgroundImage: `url(${it.image || placeholder})` }"
            ></div>

            <div class="grow">
              <div class="name"><strong>{{ it.name }}</strong></div>
              <div class="muted small">
                {{ it.code || '—' }}｜{{ it.unit || '-' }}
                <span
                  v-if="scope==='store' && isOverridden(it.id)"
                  class="over-chip"
                >已覆寫</span>
              </div>
            </div>
          </div>

          <p v-if="!filteredIngredients.length" class="muted center">沒有符合的食材</p>
        </div>
      </aside>

      <!-- 右欄：編輯卡 -->
      <main class="inv-main card">
        <template v-if="selected">
          <div class="main-head">
            <div class="main-title">設定：{{ selected.name }}</div>
            <div class="spacer"></div>

            <button
              v-if="scope==='store' && isOverridden(selected.id)"
              class="btn ghost"
              @click="clearOverride(selected.id)"
            >清除覆寫</button>

            <button class="btn ghost" @click="resetEditing">還原</button>
            <button class="btn primary" :disabled="!validAll" @click="saveEditing">儲存</button>
          </div>

          <!-- 基本門檻 -->
          <section class="panel">
            <div class="panel-title">基本門檻</div>
            <div class="grid">
              <div class="fg">
                <label class="label-top">下限</label>
                <div class="ctrl-row">
                  <input
                    type="number"
                    inputmode="numeric"
                    min="0"
                    v-model.number="edit.min"
                    class="num"
                  />
                </div>
                <div class="hint">建議依安全庫存下限設定</div>
              </div>

              <div class="fg">
                <label class="label-top">再進貨點（ROP）</label>
                <div class="ctrl-row">
                  <input
                    type="number"
                    inputmode="numeric"
                    min="0"
                    v-model.number="edit.rop"
                    class="num"
                  />
                </div>
                <div class="hint">到達此數量觸發補貨</div>
              </div>

              <div class="fg">
                <label class="label-top">上限</label>
                <div class="ctrl-row">
                  <input
                    type="number"
                    inputmode="numeric"
                    min="0"
                    v-model.number="edit.max"
                    class="num"
                  />
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
                  <input
                    type="number"
                    inputmode="numeric"
                    min="0"
                    v-model.number="edit.expiryWarnDays"
                    class="num"
                  />
                  <span class="suffix-chip">天</span>
                </div>
              </div>

              <div class="fg">
                <label class="label-top">成本波動</label>
                <div class="ctrl-row">
                  <input
                    type="number"
                    inputmode="numeric"
                    min="0"
                    v-model.number="edit.priceChangePct"
                    class="num"
                  />
                  <span class="suffix-chip">%</span>
                </div>
              </div>

              <div class="fg">
                <label class="label-top">缺貨天數</label>
                <div class="ctrl-row">
                  <input
                    type="number"
                    inputmode="numeric"
                    min="0"
                    v-model.number="edit.shortageDays"
                    class="num"
                  />
                  <span class="suffix-chip">天</span>
                </div>
              </div>

              <div class="fg fg-tip">
                <div class="info">
                  提示：以上門檻僅影響系統警示，不會直接改動庫存數。
                </div>
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

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { read, subscribe } from '@/store/datasource'

defineOptions({ name: 'BossThresholds' })

/* UI 提示訊息 */
const toastMsg = ref('')
const toast = (m) => {
  toastMsg.value = m
  setTimeout(() => (toastMsg.value = ''), 1300)
}

/* 佔位圖（無圖用） */
const placeholder =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
  <rect width="100%" height="100%" fill="#eef2ff"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="14">No Image</text>
</svg>`
  )

/* 從資料來源（可能是 mock/Firebase）讀資料 */
const d = reactive(read())
let unSub = null
onMounted(() => {
  unSub = subscribe?.((snap) => Object.assign(d, snap))
})
onBeforeUnmount(() => {
  unSub?.()
})

const stores = computed(() => (Array.isArray(d?.stores) ? d.stores : []))

const ingredients = computed(() =>
  Array.isArray(d?.inventory)
    ? d.inventory.map((i) => ({
        id: String(i.sku),
        name: i.name,
        code: String(i.sku),
        unit: i.unit,
        image: '',
        tags: []
      }))
    : []
)

/* 標籤（可選功能） */
const tags = ref([])

/* 左欄搜尋 / 篩選 */
const qList = ref('')
const tagFilter = reactive(new Set())
function toggleTag(id) {
  tagFilter.has(id) ? tagFilter.delete(id) : tagFilter.add(id)
}

const filteredIngredients = computed(() => {
  const q = qList.value.trim()
  return ingredients.value
    .filter(
      (it) =>
        !tagFilter.size ||
        (it.tags || []).some((tid) => tagFilter.has(tid))
    )
    .filter(
      (it) =>
        !q ||
        it.name?.includes(q) ||
        it.code?.includes(q)
    )
})

/* 多選 */
const checkedIds = reactive(new Set())
const checkedIdsArr = computed({
  get() {
    return Array.from(checkedIds)
  },
  set(v) {
    checkedIds.clear()
    v.forEach((x) => checkedIds.add(x))
  }
})

/* 門檻資料存取（目前用 localStorage，可之後換 Firebase） */
const thresholds = reactive(loadThresholds())
function loadThresholds() {
  try {
    return JSON.parse(localStorage.getItem('boss-thresholds') || '{}')
  } catch {
    return {}
  }
}
function saveThresholds() {
  localStorage.setItem('boss-thresholds', JSON.stringify(thresholds))
}
function defaultRule() {
  return {
    min: 0,
    rop: 0,
    max: 100,
    expiryWarnDays: 3,
    priceChangePct: 20,
    shortageDays: 2
  }
}

/* 畫面狀態：全域 or 單店覆寫 */
const scope = ref('global')
const selectedStoreId = ref('')

onMounted(() => {
  selectedStoreId.value = stores.value[0]?.id || ''
})

watch(stores, (nv) => {
  if (!nv?.length) {
    selectedStoreId.value = ''
    return
  }
  if (!nv.some((s) => s.id === selectedStoreId.value)) {
    selectedStoreId.value = nv[0].id
  }
})

/* 左側選取的食材 */
const selectedId = ref(null)
const selected = computed(() =>
  filteredIngredients.value.find((i) => i.id === selectedId.value)
)
function selectIngredient(id) {
  selectedId.value = id
  loadEditing()
}

/* 編輯表單資料 */
const edit = reactive(defaultRule())

function ruleFor(ingId) {
  const rec =
    thresholds[ingId] ||
    (thresholds[ingId] = { global: defaultRule(), byStore: {} })

  return scope.value === 'store'
    ? rec.byStore[selectedStoreId.value] || rec.global
    : rec.global
}

function loadEditing() {
  if (selected.value) {
    Object.assign(
      edit,
      JSON.parse(JSON.stringify(ruleFor(selected.value.id)))
    )
  }
}
watch([selectedId, scope, selectedStoreId], loadEditing)

/* 驗證 */
const validRange = computed(
  () => edit.min <= edit.rop && edit.rop <= edit.max
)
const validAll = computed(() => validRange.value)

/* 儲存 / 還原 / 清除覆寫 */
function saveEditing() {
  if (!selected.value) return
  const id = selected.value.id
  const rec =
    thresholds[id] ||
    (thresholds[id] = { global: defaultRule(), byStore: {} })

  if (scope.value === 'store') {
    rec.byStore[selectedStoreId.value] = JSON.parse(
      JSON.stringify(edit)
    )
  } else {
    rec.global = JSON.parse(JSON.stringify(edit))
  }

  saveThresholds()
  toast('已儲存')
}

function resetEditing() {
  loadEditing()
  toast('已還原')
}

function isOverridden(id) {
  const rec = thresholds[id]
  return !!(
    scope.value === 'store' &&
    rec?.byStore &&
    rec.byStore[selectedStoreId.value] !== undefined
  )
}

function clearOverride(id) {
  const rec = thresholds[id]
  if (rec?.byStore) delete rec.byStore[selectedStoreId.value]
  saveThresholds()
  loadEditing()
  toast('已清除覆寫')
}

/* 批次動作 & 匯出入 JSON */
function applyBatchToSelected() {
  if (!checkedIds.size) return
  const data = JSON.parse(JSON.stringify(edit))
  checkedIds.forEach((id) => {
    const rec =
      thresholds[id] ||
      (thresholds[id] = { global: defaultRule(), byStore: {} })
    if (scope.value === 'store') {
      rec.byStore[selectedStoreId.value] = data
    } else {
      rec.global = data
    }
  })
  saveThresholds()
  toast('已套用')
}

function clearBatchOverride() {
  if (scope.value !== 'store' || !checkedIds.size) return
  checkedIds.forEach((id) => {
    const rec = thresholds[id]
    if (rec?.byStore)
      delete rec.byStore[selectedStoreId.value]
  })
  saveThresholds()
  toast('已清除覆寫')
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(thresholds, null, 2)], {
    type: 'application/json'
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'boss-thresholds.json'
  a.click()
}

function importJSON(e) {
  const f = e.target.files?.[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => {
    try {
      const obj = JSON.parse(String(r.result))
      if (!obj || typeof obj !== 'object') throw new Error()
      Object.assign(thresholds, obj)
      saveThresholds()
      loadEditing()
      toast('已匯入')
    } catch {
      toast('匯入失敗：檔案格式錯誤')
    }
  }
  r.readAsText(f, 'utf-8')
}
</script>

<style scoped>
/* 整頁背景使用殼的 --bg-page，字色使用 --text-main */
.inv-page {
  padding: 16px;
  background: var(--bg-page);
  color: var(--text-main);
  min-height: calc(100vh - 72px);
  display: flex;
  flex-direction: column;
}

/* 頂部標題列 */
.inv-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.title {
  font-size: 20px;
  font-weight: 800;
}
.spacer {
  flex: 1;
}

/* 篩選工具列（card-lite 視覺） */
.inv-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.card-lite {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
}
.dark .card-lite {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.8);
}

/* 全門市統一 / 單店覆寫 切換鈕 */
.seg {
  display: flex;
  gap: 6px;
}
.segbtn {
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-main);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.2;
}
.segbtn.active {
  background: var(--chip-bg);
  border-color: var(--chip-border);
  color: var(--chip-text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.dark .segbtn.active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.store-select {
  min-width: 220px;
}

/* 搜尋框 */
.search {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 10px;
  min-height: 38px;
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.2;
}
.search-input {
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.2;
  min-width: 140px;
}

/* ====== 主區塊：左右兩欄 ====== */
.inv-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
}

/* 左欄 */
.inv-side {
  background: var(--bg-side);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.04);
}
.dark .inv-side {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.side-tools {
  padding: 10px;
  border-bottom: 1px solid var(--border);
}
.row.gap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

/* 標籤 chip */
.chip {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-main);
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.2;
}
.chip.on {
  background: var(--chip-bg);
  border-color: var(--chip-border);
  color: var(--chip-text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.dark .chip.on {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

/* 清單滾動區 */
.side-list {
  max-height: calc(100vh - 300px);
  overflow: auto;
  padding: 10px;
}

/* 單一食材列 */
.side-item {
  display: flex;
  gap: 10px;
  align-items: center;

  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  margin-bottom: 8px;
  background: var(--bg-card);
  color: var(--text-main);

  cursor: pointer;
  transition: 0.15s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.side-item.active {
  outline: 2px solid #9ec5ff;
  outline-offset: 0;
}
.dark .side-item {
  box-shadow: 0 2px 6px rgba(0,0,0,.7);
}
.side-item:hover {
  background: color-mix(in oklab, var(--bg-card) 90%, var(--text-main) 10%);
}
.dark .side-item:hover {
  background: color-mix(in oklab, var(--bg-card) 92%, #ffffff 8%);
}

.thumb.sm {
  width: 44px;
  height: 36px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.grow {
  min-width: 0;
  flex: 1 1 auto;
}
.name {
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.3;
  font-weight: 600;
}

/* 右邊主卡片 */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,.04);
  color: var(--text-main);
}
.dark .card {
  box-shadow: 0 24px 48px rgba(0,0,0,.9);
}

.main-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.main-title {
  font-weight: 700;
  font-size: 16px;
  line-height: 1.3;
}

/* ====== 設定面板區塊 ====== */
.panel {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-side);
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,.03);
}
.dark .panel {
  box-shadow: 0 16px 32px rgba(0,0,0,.8);
}
.panel-title {
  font-weight: 800;
  margin-bottom: 10px;
  color: var(--text-main);
}

/* 自適應欄位網格：最小 220px，自動換行不重疊 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

/* form group */
.fg {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  color: var(--text-main);
}
.label-top {
  font-weight: 700;
  color: var(--text-main);
  font-size: 14px;
}
.ctrl-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 數字輸入框 */
.num {
  flex: 1 1 auto;
  min-width: 0;

  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-main);

  font-size: 15px;
  line-height: 1.3;
  outline: none;
}
.num:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.35);
}

/* 單位徽章：跟 chip 系列一致概念 */
.suffix-chip {
  white-space: nowrap;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-side);
  color: var(--text-main);
  font-size: 13px;
  line-height: 1.2;
}

/* 規則檢查區塊 */
.fg-note .note {
  border: 1px dashed var(--chip-border);
  background: var(--chip-bg);
  color: var(--chip-text);
  border-radius: 10px;
  padding: 8px;
  font-size: 13px;
  line-height: 1.4;
}
.fg-note.bad .note {
  border-color: #fecaca;
  background: #fff7f7;
  color: #991b1b;
}
.dark .fg-note.bad .note {
  background: #4b1f1f;
  color: #fecaca;
  border-color: #7f1d1d;
}

.fg .hint {
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.4;
}

/* 下方提醒區塊 */
.fg-tip .info {
  border: 1px dashed #d1fae5;
  background: #f0fdf4;
  border-radius: 10px;
  padding: 8px;
  color: #065f46;
  font-size: 13px;
  line-height: 1.4;
}
.dark .fg-tip .info {
  /* 深色下用稍微偏亮綠背景，避免太刺眼 */
  background: color-mix(in oklab, #065f46 20%, #ffffff 10%, var(--bg-side) 70%);
  border-color: #5eead4;
  color: #6ee7b7;
}

/* ====== 底部：匯出 / 匯入 ====== */
.bottom {
  margin-top: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,.04);
  padding: 12px;
  width: fit-content;
}
.dark .bottom {
  box-shadow: 0 24px 48px rgba(0,0,0,.9);
}

.row.gap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 共用按鈕樣式，對齊 BossShell 右上角 chip-btn/btn 的語言 */
.btn {
  border: 1px solid color-mix(in oklab, #2563eb, #ccd7ff 65%);
  background: var(--bg-card);
  color: #2563eb;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  box-shadow: 0 2px 4px rgba(0,0,0,.03);
}
.dark .btn {
  box-shadow: 0 2px 8px rgba(0,0,0,.8);
}
.btn.primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.btn.ghost {
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-main);
}
.btn.small {
  padding: 6px 10px;
  font-size: 13px;
  min-height: 30px;
}

.file-btn {
  position: relative;
  overflow: hidden;
}
.file-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

/* 勾選框 */
.ck {
  display: inline-flex;
  align-items: center;
}
.ck input {
  display: none;
}
.ck span {
  width: 18px;
  height: 18px;
  border: 1px solid var(--border);
  border-radius: 4px;
  display: inline-block;
  background: var(--bg-card);
  position: relative;
}
.ck input:checked + span::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: #2563eb;
  border-radius: 2px;
}

/* 已覆寫小標章 */
.over-chip {
  margin-left: 6px;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 500;
  color: #075985;
}
.dark .over-chip {
  background: #083344;
  border-color: #164e63;
  color: #7dd3fc;
}

/* 細文字、置中 */
.muted {
  color: var(--text-sub);
}
.small {
  font-size: 12px;
}
.center {
  text-align: center;
}

/* Toast （在右下角）*/
.toast {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: var(--text-main);
  color: var(--text-invert);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.3;
  box-shadow: 0 16px 32px rgba(0,0,0,.4);
  z-index: 9999;
}
.dark .toast {
  background: var(--bg-card);
  color: var(--text-main);
  box-shadow: 0 24px 48px rgba(0,0,0,.9);
  border: 1px solid var(--border);
}

/* 淡入淡出動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* RWD：小螢幕時左欄與右欄上下堆疊，清單解除高度限制 */
@media (max-width: 1024px) {
  .inv-grid {
    grid-template-columns: 1fr;
  }
  .side-list {
    max-height: none;
  }
}
</style>
