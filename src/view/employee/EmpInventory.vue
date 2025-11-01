<template>
  <section class="inventory-page" :class="{ dark: isDark }">
    <!-- 頁首 -->
    <header class="top-bar card">
      <div class="left">
        <div class="title-row">
          <div class="title">店面庫存</div>

          <!-- 只有老闆才顯示回主頁按鈕，或你想全體顯示也可以 -->
          <button
            class="btn ghost small back-btn"
            v-if="canGoHome"
            @click="goHome"
            title="返回主頁"
          >
            返回主頁
          </button>
        </div>

        <!-- 條件列：店面 / 搜尋 / 排序 -->
        <div class="toolbar">
          <!-- 店面選單：老闆可選全部；員工只能選自己有權限的店 -->
          <label class="row">
            <span class="label">店面：</span>
            <select v-model="storeId" class="input sm">
              <option
                v-for="s in accessibleStores"
                :key="toStr(s.id)"
                :value="toStr(s.id)"
              >
                {{ s.name }}
              </option>
            </select>
          </label>

          <!-- 搜尋 -->
          <input
            class="input grow"
            v-model.trim="q"
            placeholder="搜尋品名 / SKU"
          />

          <!-- 排序欄位 -->
          <label class="row">
            <span class="label">排序：</span>
            <select v-model="sortBy" class="input sm">
              <option value="sku">SKU</option>
              <option value="name">品名</option>
              <option value="qty">數量</option>
              <option value="exp">效期</option>
            </select>
          </label>

          <!-- 升冪 / 降冪 -->
          <button class="btn ghost small" @click="asc = !asc">
            {{ asc ? '▲ 升冪' : '▼ 降冪' }}
          </button>
        </div>
      </div>

      <div class="spacer"></div>

      <!-- 右側小資訊：目前模式 / 主題指示 -->
      <div class="right-info">
        <div class="hint-block">
          <div class="hint-label">資料來源</div>
          <div class="hint-value">{{ currentModeLabel }}</div>
        </div>

        <div class="hint-block">
          <div class="hint-label">主題</div>
          <div class="hint-value">{{ isDark ? '深色' : '淺色' }}</div>
        </div>
      </div>
    </header>

    <!-- 主要卡片：表格 -->
    <main class="card table-card">
      <template v-if="loading">
        <div class="loading-block muted">
          資料載入中…
        </div>
      </template>

      <template v-else>
        <table class="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>品名</th>
              <th class="num">數量</th>
              <th>單位</th>
              <th>效期</th>
              <th>狀態</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="i in filteredSorted"
              :key="toStr(i.storeId) + ':' + (i.sku || i.id)"
            >
              <td>{{ i.sku || '—' }}</td>

              <td class="ellipsis" :title="i.name">
                {{ i.name || '—' }}
              </td>

              <td class="num">
                <span :class="qtyClass(i)">{{ safeNum(i.qty) }}</span>
              </td>

              <td>{{ i.unit || '-' }}</td>

              <td>
                <span :class="expClass(i)">
                  {{ expLabel(i) }}
                </span>
              </td>

              <td>
                <span :class="badge(i)">
                  {{ stateText(i) }}
                </span>
              </td>
            </tr>

            <tr v-if="filteredSorted.length === 0">
              <td colspan="6" class="muted center">
                無資料
                <span v-if="!storeId">（尚未選擇店面）</span>
                <span v-else-if="!hasAnyInv">（此店面目前沒有庫存紀錄）</span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </main>

    <!-- Toast (例如日後要做提醒可以用)
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
    -->
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as ds from '@/store/datasource'
import { useScope } from '@/store/scope'

defineOptions({ name: 'InventoryViewUnified' })

/*
  🔗 三端統一資料來源：
  datasource.read() / datasource.subscribe() 會回傳一個全域資料物件 view：
  {
    runtime: { mode:'local'|'firebase', theme:'light'|'dark', ... },
    stores: [ {id:'hn-taipei', name:'海南雞 台北店'}, ... ],
    inventory: [ {storeId:'hn-taipei', sku:'CK-001', name:'去骨雞腿', qty:22, unit:'份', exp:'2025-11-06'}, ... ],
    thresholds: [ {storeId:'hn-taipei', minQty:6}, ... ],
    settings: {
      store:{ allowNegativeStock:false, defaultStoreId:'hn-taipei', defaultExpDays:3 }
    },
    users: [...],
    ...
  }

  ✅ firebase / local 的切換邏輯已經在 datasource 裡面，這裡不需要再多一組 select。
*/
const view = reactive(ds.read() || {})
let unsub = null
const loading = ref(true)

/*
  👤 權限來源：
  我們假設 useScope() 會回傳目前登入使用者的資訊，像：
  {
    userId: 'U101',
    role: 'staff' | 'boss' | 'kitchen',
    storeId: 'hn-taipei', // 對 staff/kitchen 代表他所屬的店
    allowedStores: ['hn-taipei','hn-kaohsiung'] // 可選，看你要不要實作
  }
*/
const scope = useScope()

/* ------------------- UI 本地狀態 ------------------- */
const storeId = ref('')        // 目前畫面選的店
const q = ref('')
const sortBy = ref('name')
const asc = ref(true)

// 主題同步
const isDark = ref(
  (localStorage.getItem('theme') || 'auto') === 'dark'
)

/* ------------------- 初始化容器，避免 undefined crash ------------------- */
function ensureContainers() {
  view.runtime      ||= { mode: 'local', theme: 'light' }
  view.stores       ||= []
  view.inventory    ||= []
  view.thresholds   ||= []
  view.settings     ||= { store:{} }
  view.settings.store ||= {
    allowNegativeStock: false,
    defaultStoreId: '',
    defaultExpDays: 3,
  }
}

/* ------------------- 權限：哪些店可以選？ -------------------
   - boss: 全部店 (view.stores)
   - kitchen/staff: 限制在自己 storeId 或 allowedStores
*/
const accessibleStores = computed(() => {
  const all = view.stores || []
  if (scope.role === 'boss') {
    return all
  }

  // staff / kitchen
  // 如果有 allowedStores，取交集；否則只拿 scope.storeId
  const allowed = Array.isArray(scope.allowedStores) && scope.allowedStores.length
    ? scope.allowedStores
    : [scope.storeId]

  return all.filter(s => allowed.includes(String(s.id)))
})

/* 是否能顯示「返回主頁」按鈕 */
const canGoHome = computed(() => scope.role === 'boss')

/* ------------------- 初始化預設店面 ------------------- */
function initDefaultStoreId() {
  // 已選店不合法 → 重挑
  const validIds = new Set(accessibleStores.value.map(s => toStr(s.id)))
  if (!storeId.value || !validIds.has(storeId.value)) {
    // 嘗試用系統預設店面，但要在使用者可看範圍內
    const sysDefault = toStr(view.settings?.store?.defaultStoreId)
    if (sysDefault && validIds.has(sysDefault)) {
      storeId.value = sysDefault
      return
    }

    // 嘗試用使用者自己的門市
    const mine = toStr(scope.storeId)
    if (mine && validIds.has(mine)) {
      storeId.value = mine
      return
    }

    // fallback: accessibleStores 第一家
    storeId.value = toStr(accessibleStores.value?.[0]?.id || '')
  }
}

/* 如果資料或權限店面清單變動，就重新校正 storeId */
watch(
  () => [accessibleStores.value.map(s => toStr(s.id)).join(','), view.settings?.store?.defaultStoreId],
  () => initDefaultStoreId(),
  { immediate: true }
)

/* ------------------- 訂閱資料源 ------------------- */
onMounted(() => {
  ensureContainers()

  unsub = ds.subscribe?.((snap) => {
    Object.assign(view, snap || {})
    ensureContainers()

    // 同步 dark / light 顯示
    isDark.value =
      (view.runtime?.theme || localStorage.getItem('theme') || 'light') === 'dark'

    initDefaultStoreId()

    loading.value = false
  })

  // 首次也跑一次
  isDark.value =
    (view.runtime?.theme || localStorage.getItem('theme') || 'light') === 'dark'
  initDefaultStoreId()
  loading.value = false

  // 幫 <html> 加 dark class，讓全局類似 Tailwind dark: 風格也可用
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

onBeforeUnmount(() => {
  unsub?.()
})

/* ------------------- computed：字典、清單、排序 ------------------- */
const thDict = computed(() => {
  // { 'hn-taipei': {minQty:6}, ... }
  return Object.fromEntries(
    (view.thresholds || []).map(t => [toStr(t.storeId ?? t.id), t])
  )
})

const hasAnyInv = computed(() =>
  (view.inventory || []).some(i => toStr(i.storeId) === storeId.value)
)

const filteredSorted = computed(() => {
  const list = (view.inventory || []).filter(
    i => toStr(i.storeId) === storeId.value
  )

  // 搜尋
  const keyword = q.value.trim().toLowerCase()
  const filtered = !keyword
    ? list
    : list.filter(i =>
        String(i.name || '').toLowerCase().includes(keyword) ||
        String(i.sku  || '').toLowerCase().includes(keyword)
      )

  // 排序
  const s = sortBy.value
  const mul = asc.value ? 1 : -1
  return [...filtered].sort((a, b) => {
    if (s === 'qty') {
      return (safeNum(a.qty) - safeNum(b.qty)) * mul
    }
    if (s === 'exp') {
      return (toDateMs(a.exp) - toDateMs(b.exp)) * mul
    }
    if (s === 'sku') {
      return String(a.sku || '').localeCompare(String(b.sku || '')) * mul
    }
    // default name
    return String(a.name || '').localeCompare(String(b.name || '')) * mul
  })
})

/* ------------------- 樣式 / 文字顯示邏輯 ------------------- */
function stateText(i) {
  // 安全門檻 = thresholds[storeId].minQty > item.low > 0
  const rule = thDict.value[toStr(i.storeId)]
  const low =
    Number.isFinite(+rule?.minQty) ? +rule.minQty
    : Number.isFinite(+i.low)      ? +i.low
    : 0

  if (safeNum(i.qty) < low) return '低於門檻'
  if (isExpired(i)) return '已過期'
  if (isNearDue(i)) return '將到期'
  return 'OK'
}

function badge(i) {
  const s = stateText(i)
  if (s === 'OK') return 'badge-ok'
  if (s === '將到期') return 'badge-warn'
  return 'badge-danger'
}

function qtyClass(i) {
  const allowNeg = !!view.settings?.store?.allowNegativeStock
  if (!allowNeg && safeNum(i.qty) < 0) return 'qty-bad'
  return ''
}

/* 時效 / 效期 */
function toDateMs(v) {
  if (!v) return Number.POSITIVE_INFINITY
  const ms = Date.parse(v)
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY
}
function daysLeft(i) {
  const ms = toDateMs(i.exp)
  if (!Number.isFinite(ms)) return Infinity
  const diff = Math.floor((ms - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
}
function isExpired(i) { return daysLeft(i) < 0 }
function isNearDue(i) {
  const left = daysLeft(i)
  const warnDays = Number.isFinite(+view.settings?.store?.defaultExpDays)
    ? +view.settings.store.defaultExpDays
    : 3
  return left >= 0 && left <= warnDays
}
function expLabel(i) {
  if (!i?.exp) return '-'
  const left = daysLeft(i)
  const date = String(i.exp)
  if (left < 0) return `${date}（已過期 ${Math.abs(left)} 天）`
  if (left === 0) return `${date}（今日到期）`
  if (isNearDue(i)) return `${date}（${left} 天後）`
  return date
}
function expClass(i) {
  if (isExpired(i))  return 'txt-danger'
  if (isNearDue(i))  return 'txt-warn'
  return ''
}

/* 其他 utils */
function toStr(v){ return v == null ? '' : String(v) }
function safeNum(v){ const n = Number(v); return Number.isFinite(n) ? n : 0 }

function goHome(){
  // 這裡保留你原本的容錯 push
  try {
    // 你專案的 router 可能是存在 window 方便同頁整合
    // eslint-disable-next-line no-eval
    const r = (eval('window.__app_router__')) || null
    if (r?.push) { r.push('/'); return }
  } catch {}
  if (location.hash !== '#/') location.hash = '#/'
}

/* 顯示目前資料來源模式（local / firebase） */
const currentModeLabel = computed(() => {
  const m = view.runtime?.mode || 'local'
  return m === 'firebase' ? 'Firebase' : 'Local（假資料）'
})
</script>

<style scoped>
/* 主色系 / 狀態色用 CSS 變數，主題切換時只要換 root 或加上 .dark 覆寫 */
:root{
  --bg:#f6f8fc;
  --card:#fff;
  --border:#e6eaf2;
  --text:#0f172a;
  --muted:#64748b;
  --thead-bg:#f1f5f9;
  --thead-text:#1f2937;
  --hover-bg:#f9fafb;

  --status-ok:#16a34a;
  --status-warn:#ca8a04;
  --status-danger:#dc2626;
}

.dark{
  --bg:#0f172a;
  --card:#1e293b;
  --border:#334155;
  --text:#e2e8f0;
  --muted:#94a3b8;
  --thead-bg:#1e293b;
  --thead-text:#f1f5f9;
  --hover-bg:#273549;

  --status-ok:#4ade80;
  --status-warn:#eab308;
  --status-danger:#f87171;
}

.inventory-page{
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  padding:16px;
  box-sizing:border-box;
  display:flex;
  flex-direction:column;
  gap:12px;
  font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;
}

/* 卡片通用 */
.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 8px 24px rgba(0,0,0,.04);
}

/* 頂部列 */
.top-bar{
  padding:12px 16px;
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  gap:12px;
}
.left{
  min-width:0;
}
.title-row{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px;
  margin-bottom:8px;
}
.title{
  font-size:20px;
  font-weight:700;
  line-height:1.3;
  color:var(--text);
}
.back-btn{
  margin-left:auto;
}

.toolbar{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  align-items:center;
}
.label{
  font-size:13px;
  line-height:1.2;
  color:var(--muted);
  white-space:nowrap;
}

/* 右上資訊塊 */
.right-info{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  min-width:max-content;
}
.hint-block{
  min-width:max-content;
  background:var(--card);
  border:1px solid var(--border);
  border-radius:10px;
  box-shadow:0 4px 12px rgba(0,0,0,.03);
  padding:8px 10px;
}
.hint-label{
  font-size:11px;
  line-height:1.2;
  color:var(--muted);
  margin-bottom:4px;
}
.hint-value{
  font-size:14px;
  font-weight:600;
  line-height:1.2;
  color:var(--text);
}

.spacer{ flex:1 }

/* 表格卡片 */
.table-card{
  padding:16px;
}
.loading-block{
  padding:24px;
  text-align:center;
  font-size:14px;
}

/* 輸入元件 / 按鈕 */
.row{
  display:flex;
  align-items:center;
  gap:6px;
  flex-wrap:wrap;
}
.input{
  padding:6px 10px;
  border-radius:10px;
  border:1px solid var(--border);
  background:var(--card);
  color:var(--text);
  font-size:14px;
  line-height:1.2;
  outline:none;
}
.input.sm{
  padding:6px 8px;
  font-size:13px;
}
.input:focus{
  border-color:#9ec5ff;
  box-shadow:0 0 0 3px rgba(99,162,255,.15);
}
.grow{
  flex:1;
  min-width:140px;
}

.btn{
  border:1px solid var(--border);
  background:var(--card);
  color:#2563eb;
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:14px;
  line-height:1.2;
  white-space:nowrap;
}
.btn.ghost{
  background:var(--card);
  color:#334155;
  border-color:var(--border);
}
.btn.small{
  padding:6px 10px;
  font-size:13px;
}

/* 表格 */
.table{
  width:100%;
  border-collapse:collapse;
  font-size:15px;
}
.table thead th{
  text-align:left;
  background:var(--thead-bg);
  color:var(--thead-text);
  font-weight:600;
  padding:10px 12px;
  border-bottom:1px solid var(--border);
  font-size:14px;
}
.table tbody td{
  padding:10px 12px;
  border-bottom:1px solid var(--border);
  vertical-align:top;
  font-size:14px;
  line-height:1.4;
  color:var(--text);
}
.table tbody tr:hover td{
  background:var(--hover-bg);
}
.num{
  text-align:right;
}

/* 狀態 Badge / 數量 / 效期文字 */
.badge-ok{
  color:var(--status-ok);
  font-weight:600;
}
.badge-warn{
  color:var(--status-warn);
  font-weight:600;
}
.badge-danger{
  color:var(--status-danger);
  font-weight:600;
}

.txt-warn{
  color:var(--status-warn);
}
.txt-danger{
  color:var(--status-danger);
}
.qty-bad{
  color:var(--status-danger);
  font-weight:700;
}

.center{
  text-align:center;
}
.muted{
  color:var(--muted);
  font-size:14px;
}

.ellipsis{
  white-space:nowrap;
  text-overflow:ellipsis;
  overflow:hidden;
  max-width:240px;
}

/* Toast 預留（目前沒用） */
.toast{
  position:fixed;
  right:16px;
  bottom:16px;
  background:#111827;
  color:#fff;
  padding:10px 12px;
  border-radius:10px;
  opacity:.95;
  font-size:13px;
  line-height:1.3;
  z-index:70;
}

@media (max-width:768px){
  .title-row{
    width:100%;
    justify-content:space-between;
  }
  .right-info{
    width:100%;
    flex-direction:row;
    justify-content:flex-start;
  }
  .toolbar{
    flex-direction:column;
    align-items:stretch;
  }
  .row{
    width:100%;
    justify-content:space-between;
  }
  .grow{
    width:100%;
    flex:none;
  }
  .ellipsis{
    max-width:140px;
  }
}
</style>
