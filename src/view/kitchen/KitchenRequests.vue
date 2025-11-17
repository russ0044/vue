<!-- src/views/kitchen/KitchenRequests.vue -->
<template>
  <section class="kitchen-page">
    <!-- 頁首：標題 + 返回 -->
    <header class="k-header glass">
      <div class="title">中央廚房 · 請貨處理</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="goHome">返回主頁</button>
    </header>

    <!-- 篩選列：門市 / 日期 / 類別Tag -->
    <div class="k-filters glass">
      <div class="row gap">
        <select v-model="selectedStoreId" class="input sm" @change="persistFilter">
          <option value="">全部門市</option>
          <option v-for="s in db.stores" :key="s.id" :value="s.id">
            {{ s.name }}
          </option>
        </select>

        <input
          type="date"
          class="input sm"
          v-model="dateStr"
          @change="persistFilter"
        >

        <div class="chips">
          <button
            v-for="tg in tags"
            :key="tg"
            class="chip"
            :class="{ on: tagFilter.has(tg) }"
            @click="toggleTag(tg)"
          >#{{ tg }}</button>
        </div>
      </div>

      <div class="spacer"></div>

      <!-- 手機打開側欄 -->
      <button class="icon-btn only-mobile" title="清單" @click="drawerOpen = true">
        ☰
      </button>
    </div>

    <!-- 主體區塊：左清單 + 右內容 -->
    <div class="k-grid">
      <!-- 左欄：請貨單列表 -->
      <aside class="k-side" :class="{ open: drawerOpen }">
        <div class="side-list">
          <div
            class="side-item"
            v-for="r in filteredRequests"
            :key="r.id"
            :class="{ active: r.id === selectedId }"
            @click="selectLeft(r.id)"
          >
            <div class="grow">
              <div class="name"><strong>{{ storeName(r.storeId) }}</strong></div>
              <div class="muted small">
                申請：{{ r.date }}｜品項：{{ r.items.length }}
              </div>
            </div>
            <div class="badge" :class="r.status">{{ statusText(r.status) }}</div>
          </div>

          <p v-if="!filteredRequests.length" class="muted center side-empty">
            沒有請貨單
          </p>
        </div>
      </aside>

      <!-- 手機遮罩 -->
      <transition name="fade">
        <div
          v-if="drawerOpen"
          class="backdrop"
          @click="drawerOpen = false"
        />
      </transition>

      <!-- 右欄詳細 -->
      <main class="k-main card">
        <div class="main-head">
          <div class="left">
            <div class="view-title">請貨處理</div>

            <div v-if="currentRequest" class="mini-stats">
              <div class="mini-box">
                <div class="mini-label">就緒率</div>
                <div class="mini-value">{{ readyRate(currentRequest) }}%</div>
              </div>
              <div class="mini-box">
                <div class="mini-label">缺料項數</div>
                <div class="mini-value warn">
                  {{ shortageCount(currentRequest) }}
                </div>
              </div>
            </div>
          </div>

          <div class="spacer"></div>

          <div class="row gap" v-if="currentRequest">
            <button
              class="btn"
              @click="doAllReady"
              :disabled="!currentRequest.items.length"
            >
              全部就緒
            </button>

            <button
              class="btn primary"
              @click="doApprove"
            >
              接收並建立訂單
            </button>
          </div>
        </div>

        <!-- 內容紙張：尚未選擇 -->
        <div v-if="!currentRequest" class="empty-state">
          <div class="ico">📄</div>
          <div class="muted">請從左側選擇一張請貨單</div>
        </div>

        <!-- 內容紙張：已選擇 -->
        <div v-else class="paper">
          <div class="paper-head">
            <div>門市：{{ storeName(currentRequest.storeId) }}</div>
            <div>日期：{{ currentRequest.date }}</div>
          </div>

          <div
            class="section"
            v-for="group in groupedReq"
            :key="group.name"
          >
            <div class="sec-title">{{ group.name }}</div>

            <div class="table">
              <div class="th">
                <div class="w200">品名</div>
                <div class="w90">單位</div>
                <div class="w120">請貨數</div>
                <div class="w120">就緒數</div>
                <div class="grow">備註</div>
              </div>

              <div
                class="tr"
                v-for="it in group.rows"
                :key="it.key"
              >
                <div class="w200">{{ it.name }}</div>
                <div class="w90">{{ it.unit }}</div>
                <div class="w120">{{ it.qty }}</div>
                <div class="w120">
                  <input
                    type="number"
                    class="input"
                    min="0"
                    v-model.number="it.ready"
                    @change="saveAll()"
                  >
                </div>
                <div class="grow">
                  <input
                    class="input"
                    v-model.trim="it.note"
                    placeholder="備註…"
                    @change="saveAll()"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- footer 工具列 -->
    <footer class="footer-bar glass">
      <div class="tagline">中央廚房・原料請購 / 補料紀錄</div>
      <div class="spacer"></div>
      <div class="footer-actions">
        <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
        <label class="btn ghost small file-btn">
          匯入 JSON
          <input type="file" accept="application/json" @change="onImportJSON">
        </label>
      </div>
    </footer>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast" class="toast">
        {{ toast }}
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useKitchenData } from '@/composables/useKitchenData.js'
import seed from '@/seed/seedData'   // ★ 直接引入假資料

/* 取資料 / 方法（共用 composable） */
const {
  db,
  dataSourceMode,
  fetchAll,
  saveAll,
  setMode,
  storeName,
  applyAllReady,
  approveRequest,
  readyRate,
  shortageCount,
  exportJSON,
  importJSONFile,
} = useKitchenData()

/* UI 狀態 */
const router = useRouter()
const toast = ref('')
function tip (msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 1400)
}

const drawerOpen = ref(false)
const selectedId  = ref(null)

/* 篩選條件（門市 / 日期） */
const selectedStoreId = ref(localStorage.getItem('km-store') || '')
const dateStr         = ref(localStorage.getItem('km-date')  || '')

/* 類別 Tag */
const tags = ['熟食區', '雜項區']
const tagFilter = reactive(new Set())

/* 如果之後要在畫面上顯示資料來源切換，可用這個 computed */
const modeLocal = computed({
  get: () => dataSourceMode.value,
  set: v => {
    setMode(v)
    tip('資料來源模式已切換')
  }
})

function onModeChanged () {
  // setMode 內已 fetchAll()
}

/* 記住目前門市 / 日期條件 */
function persistFilter () {
  localStorage.setItem('km-store', selectedStoreId.value || '')
  localStorage.setItem('km-date',  dateStr.value || '')
}

/* Tag 切換 */
function toggleTag (tg) {
  tagFilter.has(tg) ? tagFilter.delete(tg) : tagFilter.add(tg)
}

/* 狀態文字 */
function statusText (s) {
  if (s === 'pending') return '待處理'
  if (s === 'partial') return '部分就緒'
  if (s === 'done')    return '完成'
  return s || '—'
}

/* 左側清單：依門市 / 日期 / Tag 過濾 */
const filteredRequests = computed(() => {
  let list = db.requests || []

  if (selectedStoreId.value) {
    list = list.filter(r => r.storeId === selectedStoreId.value)
  }

  // 有選日期才套日期條件；沒選就看全部日期
  if (dateStr.value) {
    list = list.filter(r => r.date === dateStr.value)
  }

  if (tagFilter.size) {
    list = list.filter(r => r.items.some(it => tagFilter.has(it.cat)))
  }

  // 新日期排前面
  return list.slice().sort((a, b) => {
    if (a.date === b.date) {
      return a.storeId > b.storeId ? 1 : -1
    }
    return a.date > b.date ? -1 : 1
  })
})

/* 目前選到哪一筆請貨單 */
const currentRequest = computed(
  () => db.requests.find(r => r.id === selectedId.value) || null
)

/* 分群顯示（熟食區 / 雜項區 ...） */
const groupedReq = computed(() => {
  if (!currentRequest.value) return []
  const g = {}
  currentRequest.value.items.forEach(it => {
    if (!g[it.cat]) g[it.cat] = []
    g[it.cat].push(it)
  })
  return Object.keys(g).map(name => ({ name, rows: g[name] }))
})

function selectLeft (id) {
  selectedId.value = id
  drawerOpen.value = false
}

/* 操作：全部就緒 */
function doAllReady () {
  if (!currentRequest.value) return
  applyAllReady(currentRequest.value)
  tip('已全部設定為就緒')
}

/* 操作：接收並建立訂單 */
function doApprove () {
  if (!currentRequest.value) return
  const result = approveRequest(currentRequest.value)
  if (!result.ok) {
    tip(result.msg || '無法建立訂單')
    return
  }
  tip('已建立訂單')
}

/* 匯出 & 匯入 */
function onImportJSON (e) {
  const f = e.target.files?.[0]
  if (!f) return
  importJSONFile(
    f,
    () => tip('已匯入資料'),
    () => tip('匯入失敗：格式錯誤')
  )
}

/* 回主頁（依你的路由名稱調整） */
function goHome () {
  router.push({ name: 'boss-inventory' })
}

/* 初始載入：如無資料，從 seed 灌假資料，再自動選日期 + 第一筆 */
onMounted(async () => {
  await fetchAll()

  // ★ 如果目前完全沒有請貨單，就從 seed 裡的 kitchenRequests 填入假資料
  if (!db.requests || !db.requests.length) {
    const s = seed() || {}
    if (Array.isArray(s.kitchenRequests)) {
      // 深拷貝一份，以免直接改到 seed 本體
      db.requests = s.kitchenRequests.map(r => ({
        id: r.id,
        storeId: r.storeId,
        date: r.date,
        status: r.status || 'pending',
        items: (r.items || []).map(it => ({
          ...it,
          ready: it.ready ?? 0,
          note: it.note ?? '',
        }))
      }))
    }
  }

  // 如果沒有日期或這個日期沒有資料，就找「有資料的最新日期」
  if (!dateStr.value || !(db.requests || []).some(r => r.date === dateStr.value)) {
    const latestDate = (db.requests || []).reduce((acc, r) => {
      if (!acc || r.date > acc) return r.date
      return acc
    }, '')

    if (latestDate) {
      dateStr.value = latestDate
      persistFilter()
    } else if (!dateStr.value) {
      // 真的完全沒有資料，就顯示今天
      dateStr.value = new Date().toISOString().slice(0, 10)
      persistFilter()
    }
  }

  // 自動選第一筆請貨單
  if (!selectedId.value && filteredRequests.value.length) {
    selectedId.value = filteredRequests.value[0].id
  }
})
</script>

<style scoped>
/* ---------- 主題色（亮/暗） ---------- */
:root {
  --bg: #f7f9fc;
  --glass: rgba(255, 255, 255, 0.9);
  --card: #ffffff;
  --border: #e3e8f0;
  --accent: #2563eb;
  --text: #0f172a;
  --muted: #64748b;
}
.dark :root,
.dark .kitchen-page {
  --bg: #0f172a;
  --glass: rgba(30, 37, 53, 0.85);
  --card: #1e2535;
  --border: #334155;
  --accent: #60a5fa;
  --text: #e2e8f0;
  --muted: #94a3b8;
}

/* ---------- 版型 ---------- */
.kitchen-page {
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 76px;
}
.glass {
  backdrop-filter: blur(10px);
}
.spacer {
  flex: 1;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.gap {
  gap: 10px;
}

.k-header {
  display: flex;
  align-items: center;
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}
.title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.02em;
}

.k-filters {
  display: flex;
  align-items: center;
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  margin: 12px 0;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}
.k-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
}
.k-side {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: auto;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
}

/* ---------- 列表 ---------- */
.side-list {
  padding: 10px;
}
.side-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
  background: var(--card);
  cursor: pointer;
  transition: 0.15s;
}
.side-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
}
.side-item.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}
.name {
  color: var(--text);
}
.muted {
  color: var(--muted);
  font-size: 13px;
}
.small {
  font-size: 12px;
  line-height: 1.2;
}
.center {
  text-align: center;
}
.badge {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.1;
  color: var(--text);
}

/* ---------- 主卡片 ---------- */
.k-main.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
}
.view-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
}
.mini-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.mini-box {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  background: transparent;
}
.mini-label {
  font-size: 11px;
  color: var(--muted);
}
.mini-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.empty-state {
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 22px 16px;
  background: transparent;
  text-align: center;
}

/* 單據紙卡 */
.paper {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.paper-head {
  display: flex;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.03);
  padding: 12px 16px;
  border-bottom: 1px dashed var(--border);
}
.section {
  padding: 16px;
}
.sec-title {
  font-weight: 700;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 10px;
}
.table {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  font-size: 14px;
}
.th,
.tr {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px 12px;
}
.th {
  background: rgba(0, 0, 0, 0.03);
  font-weight: 600;
  color: var(--text);
}
.tr:last-child {
  border-bottom: none;
}
.w200 {
  width: 200px;
}
.w120 {
  width: 120px;
}
.w90 {
  width: 90px;
}
.grow {
  flex: 1;
  min-width: 0;
}

/* ---------- 表單 ---------- */
.input {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--card);
  color: var(--text);
  width: 100%;
}
.input.sm {
  padding: 7px 10px;
  font-size: 14px;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  outline: none;
}

/* ---------- Chips ---------- */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text);
  transition: 0.12s;
}
.chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
}
.chip.on {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* ---------- 按鈕 ---------- */
.btn {
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: 0.15s;
}
.btn:hover {
  filter: brightness(1.02);
}
.btn.primary {
  background: var(--accent);
  color: #fff;
}
.btn.ghost {
  border-color: var(--border);
  color: var(--text);
}
.btn.small {
  padding: 6px 10px;
  font-size: 13px;
}

/* ---------- 底部工具列 ---------- */
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--glass);
  border-top: 1px solid var(--border);
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  padding: 10px 16px;
  z-index: 50;
}
.tagline {
  font-size: 13px;
  color: var(--muted);
}
.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

/* ---------- Toast ---------- */
.toast {
  position: fixed;
  right: 16px;
  bottom: 80px;
  background: #111827;
  color: #fff;
  padding: 10px 12px;
  border-radius: 10px;
  opacity: 0.95;
  font-size: 13px;
  z-index: 70;
}

/* ---------- 手機側欄 ---------- */
.only-mobile {
  display: none;
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 30;
}
@media (max-width: 1024px) {
  .k-grid {
    grid-template-columns: 1fr;
  }
  .k-side {
    position: fixed;
    inset: 0 auto 0 0;
    width: 82%;
    max-width: 340px;
    z-index: 40;
    transform: translateX(-100%);
    transition: 0.25s;
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.25);
  }
  .k-side.open {
    transform: translateX(0);
  }
  .only-mobile {
    display: inline-flex;
  }
}

/* ---------- 請貨頁面額外樣式 ---------- */
.k-main .main-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.badge.done {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.badge.pending {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.badge.partial {
  background: #fafafa;
  border-color: #e5e7eb;
  color: #1f2937;
}

.ico {
  font-size: 28px;
  margin-bottom: 8px;
  line-height: 1;
}

.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  opacity: 0.85;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid transparent;
}
.icon-btn:hover {
  opacity: 1;
  border-color: #dbeafe;
  background: #eff6ff;
  color: #1e40af;
}
</style>
