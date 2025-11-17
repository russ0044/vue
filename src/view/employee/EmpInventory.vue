<template>
  <section class="inventory-page">
    <!-- 頁首 -->
    <header class="top-bar card">
      <div class="left">
        <div class="title-row">
          <div class="title">店面庫存</div>

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
              <option value="no">序號</option>
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
              <th class="num w60">序</th>
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
              <td class="num">{{ i._no }}</td>

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
              <td colspan="7" class="muted center">
                無資料
                <span v-if="!storeId">（尚未選擇店面）</span>
                <span v-else-if="!hasAnyInv">（此店面目前沒有庫存紀錄）</span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </main>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as ds from '@/store/datasource'
import { useScope } from '@/store/scope'

defineOptions({ name: 'InventoryViewUnified' })

/* ========= 與全域 datasource 對齊 ========= */
const view = reactive(ds.read() || {})
let unsub = null
const loading = ref(true)

/* ========= 權限來源 ========= */
const scope = useScope()

/* ========= 本地 UI 狀態 ========= */
const storeId = ref('')
const q = ref('')
const sortBy = ref('no')  // 預設顯示序號
const asc = ref(true)

/* ========= 初始化容器，避免 undefined crash ========= */
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

/* ========= 可選店面（Boss: 全部；其他：allowedStores 或自己的 store） ========= */
const accessibleStores = computed(() => {
  const all = view.stores || []
  if (String(scope.role || '').toLowerCase() === 'boss') return all

  const allowed = Array.isArray(scope.allowedStores) && scope.allowedStores.length
    ? scope.allowedStores.map(toStr)
    : [toStr(scope.storeId)]

  return all.filter(s => allowed.includes(toStr(s.id)))
})

/* 是否顯示「返回主頁」 */
const canGoHome = computed(() => String(scope.role || '').toLowerCase() === 'boss')

/* ========= 預設店面選擇 ========= */
function initDefaultStoreId() {
  const validIds = new Set(accessibleStores.value.map(s => toStr(s.id)))
  if (!storeId.value || !validIds.has(storeId.value)) {
    const sysDefault = toStr(view.settings?.store?.defaultStoreId)
    if (sysDefault && validIds.has(sysDefault)) { storeId.value = sysDefault; return }
    const mine = toStr(scope.storeId)
    if (mine && validIds.has(mine)) { storeId.value = mine; return }
    storeId.value = toStr(accessibleStores.value?.[0]?.id || '')
  }
}

watch(
  () => [accessibleStores.value.map(s => toStr(s.id)).join(','), view.settings?.store?.defaultStoreId],
  () => initDefaultStoreId(),
  { immediate: true }
)

/* ========= 訂閱資料源 ========= */
onMounted(() => {
  ensureContainers()

  unsub = ds.subscribe?.((snap) => {
    Object.assign(view, snap || {})
    ensureContainers()
    initDefaultStoreId()
    loading.value = false
  })

  // 首次也跑一次
  initDefaultStoreId()
  loading.value = false
})

onBeforeUnmount(() => {
  unsub?.()
})

/* ========= computed：門檻字典 / 是否有任何庫存 / 過濾+排序 ========= */
const thDict = computed(() => {
  return Object.fromEntries(
    (view.thresholds || []).map(t => [toStr(t.storeId ?? t.id), t])
  )
})

const hasAnyInv = computed(() =>
  (view.inventory || []).some(i => toStr(i.storeId) === storeId.value)
)

/** 重要：先過濾，再標上序號 _no，再依使用者選擇排序 */
const filteredSorted = computed(() => {
  const list = (view.inventory || []).filter(
    i => toStr(i.storeId) === storeId.value
  )

  const keyword = q.value.trim().toLowerCase()
  const filtered = !keyword
    ? list
    : list.filter(i =>
        String(i.name || '').toLowerCase().includes(keyword) ||
        String(i.sku  || '').toLowerCase().includes(keyword)
      )

  // 依目前篩選結果標上序號（1-based）
  const withNo = filtered.map((it, idx) => ({ ...it, _no: idx + 1 }))

  const s = sortBy.value
  const mul = asc.value ? 1 : -1
  return [...withNo].sort((a, b) => {
    if (s === 'no')  return (a._no - b._no) * mul
    if (s === 'qty') return (safeNum(a.qty) - safeNum(b.qty)) * mul
    if (s === 'exp') return (toDateMs(a.exp) - toDateMs(b.exp)) * mul
    if (s === 'sku') return String(a.sku || '').localeCompare(String(b.sku || '')) * mul
    return String(a.name || '').localeCompare(String(b.name || '')) * mul
  })
})

/* ========= 顯示邏輯 ========= */
function stateText(i) {
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

/* ========= 效期 ========= */
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

/* ========= 其他 utils ========= */
function toStr(v){ return v == null ? '' : String(v) }
function safeNum(v){ const n = Number(v); return Number.isFinite(n) ? n : 0 }

function goHome(){
  try {
    // 若你的 router 放在全域（例如為了跨頁 demo）
    // eslint-disable-next-line no-eval
    const r = (eval('window.__app_router__')) || null
    if (r?.push) { r.push('/'); return }
  } catch {}
  if (location.hash !== '#/') location.hash = '#/'
}
</script>

<style scoped>
/* ===== 這支樣式全面使用「全域主題變數」 =====
   由外層 .emp-shell / .emp-shell.dark 控制： */
.inventory-page{
  background:var(--bg-page);
  color:var(--text-main);
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
  background:var(--bg-card);
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
.left{ min-width:0; }
.title-row{
  display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:8px;
}
.title{
  font-size:20px; font-weight:700; line-height:1.3; color:var(--text-main);
}
.back-btn{ margin-left:auto; }

.toolbar{
  display:flex; flex-wrap:wrap; gap:10px; align-items:center;
}
.label{
  font-size:13px; line-height:1.2; color:var(--text-sub); white-space:nowrap;
}

.spacer{ flex:1 }

/* 表格卡片 */
.table-card{ padding:16px; }
.loading-block{ padding:24px; text-align:center; font-size:14px; }

/* 輸入元件 / 按鈕 */
.row{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.input{
  padding:6px 10px;
  border-radius:10px;
  border:1px solid var(--border);
  background:var(--bg-card);
  color:var(--text-main);
  font-size:14px; line-height:1.2; outline:none;
}
.input.sm{ padding:6px 8px; font-size:13px; }
.input:focus{
  border-color:#9ec5ff;
  box-shadow:0 0 0 3px rgba(99,162,255,.15);
}
.grow{ flex:1; min-width:140px; }

.btn{
  border:1px solid var(--border);
  background:var(--bg-card);
  color:#2563eb;
  border-radius:10px;
  padding:8px 12px;
  cursor:pointer;
  font-size:14px; line-height:1.2; white-space:nowrap;
}
.btn.ghost{
  background:var(--bg-card);
  color:var(--text-main);
  border-color:var(--border);
}
.btn.small{ padding:6px 10px; font-size:13px; }

/* 表格 */
.table{ width:100%; border-collapse:collapse; font-size:15px; }
.table thead th{
  text-align:left;
  /* 原本用深色變數，改成白色頭列，讓黑色框不那麼突出 */
  background:var(--bg-card);
  color:var(--text-main);
  font-weight:600;
  padding:10px 12px;
  border-bottom:1px solid var(--border);
  font-size:14px;
}
.table tbody td{
  padding:10px 12px;
  border-bottom:1px solid var(--border);
  vertical-align:top;
  font-size:14px; line-height:1.4; color:var(--text-main);
}
.table tbody tr:hover td{
  background:linear-gradient(to bottom, rgba(0,0,0,.02), transparent);
}
.num{ text-align:right; }
.w60{ width:60px; }

/* 狀態 Badge / 數量 / 效期文字 */
.badge-ok{ color:#16a34a; font-weight:600; }
.badge-warn{ color:#ca8a04; font-weight:600; }
.badge-danger{ color:#dc2626; font-weight:600; }

.txt-warn{ color:#ca8a04; }
.txt-danger{ color:#dc2626; }
.qty-bad{ color:#dc2626; font-weight:700; }

.center{ text-align:center; }
.muted{ color:var(--text-sub); font-size:14px; }

.ellipsis{
  white-space:nowrap; text-overflow:ellipsis; overflow:hidden; max-width:240px;
}

@media (max-width:768px){
  .title-row{ width:100%; justify-content:space-between; }
  .toolbar{ flex-direction:column; align-items:stretch; }
  .row{ width:100%; justify-content:space-between; }
  .grow{ width:100%; flex:none; }
  .ellipsis{ max-width:140px; }
}
</style>
