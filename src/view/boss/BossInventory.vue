<template>
  <section class="inventory-container" :class="{ dark: isDark }">
    <div class="header">
      <h2 class="section-title">店面庫存</h2>
      <button class="btn ghost" @click="goHome" title="返回主頁">返回主頁</button>
    </div>

    <div class="toolbar">
      <label class="row">
        <span>店面：</span>
        <select v-model="storeId" class="input">
          <option v-for="s in view.stores" :key="s.id" :value="toStr(s.id)">{{ s.name }}</option>
        </select>
      </label>

      <input class="input grow" v-model.trim="q" placeholder="搜尋品名 / SKU" />

      <label class="row">
        <span>排序：</span>
        <select v-model="sortBy" class="input">
          <option value="sku">SKU</option>
          <option value="name">品名</option>
          <option value="qty">數量</option>
          <option value="exp">效期</option>
        </select>
      </label>
      <button class="btn ghost" @click="asc = !asc">{{ asc ? '▲ 升冪' : '▼ 降冪' }}</button>
    </div>

    <div class="card">
      <template v-if="loading">
        <p class="muted">載入中…</p>
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
            <tr v-for="i in filteredSorted" :key="toStr(i.storeId) + ':' + (i.sku || i.id)">
              <td>{{ i.sku || '—' }}</td>
              <td class="ellipsis" :title="i.name">{{ i.name || '—' }}</td>
              <td class="num"><span :class="qtyClass(i)">{{ safeNum(i.qty) }}</span></td>
              <td>{{ i.unit || '-' }}</td>
              <td><span :class="expClass(i)">{{ expLabel(i) }}</span></td>
              <td><span :class="badge(i)">{{ stateText(i) }}</span></td>
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
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as ds from '@/store/datasource'

defineOptions({ name: 'EmpInventory' })

/* ---------------- state from datasource ---------------- */
const view = reactive(ds.read() || {})
let unsub = null
const loading = ref(true)

function ensureContainers() {
  view.stores      ||= []
  view.inventory   ||= []
  view.thresholds  ||= []
  view.settings    ||= { store: { allowNegativeStock: false, defaultStoreId: '', defaultExpDays: 3 } }
  view.settings.store ||= { allowNegativeStock: false, defaultStoreId: '', defaultExpDays: 3 }
}

ensureContainers()

onMounted(() => {
  // 訂閱資料源（假資料／Firebase 皆適用）
  unsub = ds.subscribe?.((snap) => {
    Object.assign(view, snap || {})
    ensureContainers()
    initDefaultStore()
    loading.value = false
  })
  // 首次載入也要做一次初始化
  initDefaultStore()
  loading.value = false

  // 主題同步
  if (isDark.value) document.documentElement.classList.add('dark')
})
onBeforeUnmount(() => unsub?.())

/* ---------------- local UI state ---------------- */
const storeId = ref('')
const q = ref('')
const sortBy = ref('name')
const asc = ref(true)
const isDark = ref((localStorage.getItem('theme') || 'auto') === 'dark')

function initDefaultStore(){
  // 若目前未選或選到不存在的 id，就依設定或第一家帶入
  const ids = new Set((view.stores || []).map(s => toStr(s.id)))
  const current = storeId.value
  if (!current || !ids.has(current)) {
    const def = toStr(view?.settings?.store?.defaultStoreId) || ''
    storeId.value = (def && ids.has(def)) ? def : (toStr(view.stores?.[0]?.id) || '')
  }
}

/* 當店面列表變化，重新校正 storeId */
watch(() => view.stores.map(s => toStr(s.id)).join(','), () => initDefaultStore())

/* ---------------- computed helpers ---------------- */
const thDict = computed(() =>
  Object.fromEntries((view.thresholds || []).map(t => [toStr(t.storeId ?? t.id), t]))
)

const hasAnyInv = computed(() =>
  (view.inventory || []).some(i => toStr(i.storeId) === storeId.value)
)

const filteredSorted = computed(() => {
  const sid = storeId.value
  const list = (view.inventory || []).filter(i => toStr(i.storeId) === sid)

  const keyword = q.value.trim().toLowerCase()
  const filtered = !keyword
    ? list
    : list.filter(i =>
        String(i.name || '').toLowerCase().includes(keyword) ||
        String(i.sku || '').toLowerCase().includes(keyword)
      )

  const s = sortBy.value
  const mul = asc.value ? 1 : -1
  return [...filtered].sort((a, b) => {
    if (s === 'qty') return (safeNum(a.qty) - safeNum(b.qty)) * mul
    if (s === 'exp') return (toDateMs(a.exp) - toDateMs(b.exp)) * mul
    if (s === 'sku') return String(a.sku || '').localeCompare(String(b.sku || '')) * mul
    return String(a.name || '').localeCompare(String(b.name || '')) * mul
  })
})

/* ---------------- UI formatters ---------------- */
function stateText(i) {
  const rule = thDict.value[toStr(i.storeId)]
  const low = Number.isFinite(+rule?.minQty) ? +rule.minQty : (Number.isFinite(+i.low) ? +i.low : 0)
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
  const defaultExpWarn = Number.isFinite(+view.settings?.store?.defaultExpDays) ? +view.settings.store.defaultExpDays : 3
  return left >= 0 && left <= defaultExpWarn
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
  if (isExpired(i)) return 'txt-danger'
  if (isNearDue(i)) return 'txt-warn'
  return ''
}

/* ---------------- misc helpers ---------------- */
function toStr(v){ return v == null ? '' : String(v) }
function safeNum(v){ const n = Number(v); return Number.isFinite(n) ? n : 0 }

function goHome(){
  try {
    // 若專案有 router
    // eslint-disable-next-line no-eval
    const r = (eval('window.__app_router__')) || null
    if (r?.push) { r.push('/'); return }
  } catch {}
  if (location.hash !== '#/') location.hash = '#/'
}
</script>

<style scoped>
.inventory-container {
  background-color: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding: 20px;
  transition: background 0.3s, color 0.3s;
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}

.section-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.input {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
}

.btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
.btn.ghost {
  background: #e5e7eb;
  color: #111827;
  border: 1px solid #e6eaf2;
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 16px;
  border: 1px solid var(--border);
}

/* 表格樣式 */
.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 15px;
}
.table th, .table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.table th {
  background: var(--thead-bg);
  color: var(--thead-text);
  font-weight: 600;
}
.table tr:hover td {
  background: var(--hover-bg);
}
.num { text-align: right; }

.badge-ok { color: #16a34a; font-weight: 600; }
.badge-warn { color: #ca8a04; font-weight: 600; }
.badge-danger { color: #dc2626; font-weight: 600; }

.txt-warn { color: #ca8a04; }
.txt-danger { color: #dc2626; }
.qty-bad { color: #dc2626; font-weight: bold; }

.muted { color: var(--muted); }

:root {
  --bg: #f9fafb;
  --text: #111827;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --thead-bg: #f1f5f9;
  --thead-text: #1f2937;
  --hover-bg: #f9fafb;
  --muted: #6b7280;
}

.dark {
  --bg: #0f172a;
  --text: #e2e8f0;
  --card-bg: #1e293b;
  --border: #334155;
  --thead-bg: #1e293b;
  --thead-text: #f1f5f9;
  --hover-bg: #273549;
  --muted: #94a3b8;
}
</style>
