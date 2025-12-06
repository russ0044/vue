<!-- src/view/boss/BossInventory.vue -->
<template>
  <section class="inventory-container">
    <div class="header">
      <h2 class="section-title">店面庫存（老闆）</h2>
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
          <option value="id">序號</option>
          <option value="sku">SKU</option>
          <option value="name">品名</option>
          <option value="qty">數量</option>
          <option value="exp">效期</option>
        </select>
      </label>
      <button class="btn ghost" @click="asc = !asc">
        {{ asc ? '▲ 升冪' : '▼ 降冪' }}
      </button>
    </div>

    <div class="card">
      <template v-if="loading">
        <p class="muted">載入中…</p>
      </template>

      <template v-else>
        <table class="table">
          <thead>
            <tr>
              <th class="num">#</th>
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
              v-for="(i, idx) in filteredSorted"
              :key="toStr(i.storeId) + ':' + (i.sku || i.id)"
            >
              <td class="num">{{ idx + 1 }}</td>
              <td>{{ i.sku || '—' }}</td>
              <td class="ellipsis" :title="i.name">{{ i.name || '—' }}</td>
              <td class="num">
                <span :class="qtyClass(i)">{{ safeNum(i.qty) }}</span>
              </td>
              <td>{{ i.unit || '-' }}</td>
              <td>
                <span :class="expClass(i)">{{ expLabel(i) }}</span>
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
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as ds from '@/store/datasource'
import { getMinQtyFromAllSources, getExpiryWarnDays } from '@/utils/thresholds'

defineOptions({ name: 'BossInventory' })

/* ---------------- state from datasource ---------------- */
const view = reactive(ds.read() || {})
let unsub = null
const loading = ref(true)

function ensureContainers () {
  view.stores ||= []
  view.inventory ||= []
  view.thresholds ||= []
  view.products ||= [] // 產品資料（含 safeStock）
  view.settings ||= {
    store: { allowNegativeStock: false, defaultStoreId: '', defaultExpDays: 3 }
  }
  view.settings.store ||= {
    allowNegativeStock: false,
    defaultStoreId: '',
    defaultExpDays: 3
  }
}

/* 若無資料則生成最小假資料（在 datasource.mode==='mock' 時會用到） */
function seedIfEmpty () {
  if (!Array.isArray(view.stores) || view.stores.length === 0) {
    view.stores = [
      { id: 'hn-taipei', name: '海南雞 台北店' },
      { id: 'hn-taichung', name: '海南雞 台中店' },
      { id: 'hn-kaohsiung', name: '海南雞 高雄店' }
    ]
  }
  if (!Array.isArray(view.thresholds) || view.thresholds.length === 0) {
    view.thresholds = [
      { id: 'hn-taipei', storeId: 'hn-taipei', minQty: 6 },
      { id: 'hn-taichung', storeId: 'hn-taichung', minQty: 6 },
      { id: 'hn-kaohsiung', storeId: 'hn-kaohsiung', minQty: 6 }
    ]
  }
  if (!Array.isArray(view.inventory) || view.inventory.length === 0) {
    const today = new Date()
    const fmt = (d) => d.toISOString().slice(0, 10)
    const addDays = (n) => {
      const t = new Date(today)
      t.setDate(t.getDate() + n)
      return fmt(t)
    }
    view.inventory = [
      {
        id: 'I1',
        storeId: 'hn-taipei',
        sku: 'CK-001',
        name: '去骨雞腿（熟）',
        qty: 22,
        unit: '份',
        exp: addDays(3)
      },
      {
        id: 'I2',
        storeId: 'hn-taipei',
        sku: 'RI-030',
        name: '泰國香米',
        qty: 45,
        unit: '公斤',
        exp: null
      },
      {
        id: 'I3',
        storeId: 'hn-taichung',
        sku: 'CK-002',
        name: '去骨雞胸（熟）',
        qty: 8,
        unit: '份',
        exp: addDays(2)
      },
      {
        id: 'I4',
        storeId: 'hn-kaohsiung',
        sku: 'CU-092',
        name: '小黃瓜',
        qty: 15,
        unit: '條',
        exp: addDays(1)
      }
    ]
  }
  // products 一般會由 seedData 提供，這裡只保證是陣列即可
  if (!Array.isArray(view.products)) view.products = []
}

ensureContainers()
seedIfEmpty()

onMounted(() => {
  unsub = ds.subscribe?.((snap) => {
    Object.assign(view, snap || {})
    ensureContainers()
    seedIfEmpty()
    initDefaultStore()
    loading.value = false
  })
  initDefaultStore()
  loading.value = false
})
onBeforeUnmount(() => unsub?.())

/* ---------------- local UI state ---------------- */
const storeId = ref('')
const q = ref('')
const sortBy = ref('id') // 預設用「序號」排序
const asc = ref(true)

function initDefaultStore () {
  const ids = new Set((view.stores || []).map((s) => toStr(s.id)))
  const current = storeId.value
  if (!current || !ids.has(current)) {
    const def = toStr(view?.settings?.store?.defaultStoreId) || ''
    storeId.value = def && ids.has(def)
      ? def
      : toStr(view.stores?.[0]?.id) || ''
  }
}

/* 當店面列表變化，重新校正 storeId */
watch(
  () => view.stores.map((s) => toStr(s.id)).join(','),
  () => initDefaultStore()
)

/* ---------------- computed helpers ---------------- */
const hasAnyInv = computed(() =>
  (view.inventory || []).some((i) => toStr(i.storeId) === storeId.value)
)

const filteredSorted = computed(() => {
  const sid = storeId.value
  const list = (view.inventory || []).filter(
    (i) => toStr(i.storeId) === sid
  )

  const keyword = q.value.trim().toLowerCase()
  const filtered = !keyword
    ? list
    : list.filter(
        (i) =>
          String(i.name || '').toLowerCase().includes(keyword) ||
          String(i.sku || '').toLowerCase().includes(keyword)
      )

  const s = sortBy.value
  const mul = asc.value ? 1 : -1
  return [...filtered].sort((a, b) => {
    if (s === 'id') return String(a.id).localeCompare(String(b.id)) * mul
    if (s === 'qty') return (safeNum(a.qty) - safeNum(b.qty)) * mul
    if (s === 'exp') return (toDateMs(a.exp) - toDateMs(b.exp)) * mul
    if (s === 'sku') {
      return String(a.sku || '').localeCompare(String(b.sku || '')) * mul
    }
    return String(a.name || '').localeCompare(String(b.name || '')) * mul
  })
})

/* ---------------- UI formatters ---------------- */
function stateText (i) {
  const low = getMinQtyFromAllSources(i, view) // 使用 utils 中的整合門檻
  if (safeNum(i.qty) < low) return '低於門檻'
  if (isExpired(i)) return '已過期'
  if (isNearDue(i)) return '將到期'
  return 'OK'
}
function badge (i) {
  const s = stateText(i)
  if (s === 'OK') return 'badge-ok'
  if (s === '將到期') return 'badge-warn'
  return 'badge-danger'
}
function qtyClass (i) {
  const allowNeg = !!view.settings?.store?.allowNegativeStock
  if (!allowNeg && safeNum(i.qty) < 0) return 'qty-bad'
  return ''
}
function toDateMs (v) {
  if (!v) return Number.POSITIVE_INFINITY
  const ms = Date.parse(v)
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY
}
function daysLeft (i) {
  const ms = toDateMs(i.exp)
  if (!Number.isFinite(ms)) return Infinity
  const diff = Math.floor((ms - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
}
function isExpired (i) {
  return daysLeft(i) < 0
}
function isNearDue (i) {
  const left = daysLeft(i)
  const warnDays = getExpiryWarnDays(i, view) // 用 utils 取得警示天數
  return left >= 0 && left <= warnDays
}
function expLabel (i) {
  if (!i?.exp) return '-'
  const left = daysLeft(i)
  const date = String(i.exp)
  if (left < 0) return `${date}（已過期 ${Math.abs(left)} 天）`
  if (left === 0) return `${date}（今日到期）`
  if (isNearDue(i)) return `${date}（${left} 天後）`
  return date
}
function expClass (i) {
  if (isExpired(i)) return 'txt-danger'
  if (isNearDue(i)) return 'txt-warn'
  return ''
}

/* ---------------- misc helpers ---------------- */
function toStr (v) {
  return v == null ? '' : String(v)
}
function safeNum (v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function goHome () {
  try {
    const r = eval('window.__app_router__') || null
    if (r?.push) {
      r.push('/')
      return
    }
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
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

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
.row {
  display: flex;
  align-items: center;
  gap: 6px;
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
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
.btn.ghost {
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--border);
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
.table th,
.table td {
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
.num {
  text-align: right;
}

.badge-ok {
  color: #16a34a;
  font-weight: 600;
}
.badge-warn {
  color: #ca8a04;
  font-weight: 600;
}
.badge-danger {
  color: #dc2626;
  font-weight: 600;
}

.txt-warn {
  color: #ca8a04;
}
.txt-danger {
  color: #dc2626;
}
.qty-bad {
  color: #dc2626;
  font-weight: bold;
}

.muted {
  color: var(--muted);
}

.center {
  text-align: center;
}
</style>
