<template>
  <section class="inventory-container">
    <h2 class="section-title">店面庫存</h2>

    <div class="toolbar">
      <label class="row">
        <span>店面：</span>
        <select v-model="storeId" class="input">
          <option v-for="s in d.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
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
          <tr v-for="i in filteredSorted" :key="i.storeId + ':' + i.sku">
            <td>{{ i.sku }}</td>
            <td class="ellipsis" :title="i.name">{{ i.name }}</td>
            <td class="num"><span :class="qtyClass(i)">{{ i.qty ?? 0 }}</span></td>
            <td>{{ i.unit || '-' }}</td>
            <td><span :class="expClass(i)">{{ expLabel(i) }}</span></td>
            <td><span :class="badge(i)">{{ stateText(i) }}</span></td>
          </tr>
          <tr v-if="filteredSorted.length === 0">
            <td colspan="6" class="muted center">無資料</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { read } from '@/store/datasource'

defineOptions({ name: 'EmpInventory' })

// ✅ 直接取得反應式的全域資料（會自動因 mock / firebase 切換而更新）
const d = read()

const storeId = ref('')
const q = ref('')
const sortBy = ref('name')
const asc = ref(true)

// 依資料載入狀況初始化/修正預設店面
watch(
  () => [d.stores, d.settings],
  () => {
    if (!storeId.value) {
      storeId.value = d.settings?.store?.defaultStoreId || d.stores[0]?.id || ''
    } else if (!d.stores.some(s => s.id === storeId.value)) {
      storeId.value = d.settings?.store?.defaultStoreId || d.stores[0]?.id || ''
    }
  },
  { immediate: true, deep: false }
)

const thDict = computed(() =>
  Object.fromEntries((d.thresholds || []).map(t => [t.storeId || t.id, t]))
)

const filteredSorted = computed(() => {
  const list = (d.inventory || []).filter(i => i.storeId === storeId.value)
  const keyword = q.value.trim().toLowerCase()
  const filtered = !keyword
    ? list
    : list.filter(i =>
        (i.name || '').toLowerCase().includes(keyword) ||
        (i.sku  || '').toLowerCase().includes(keyword)
      )
  const s = sortBy.value
  const mul = asc.value ? 1 : -1
  return [...filtered].sort((a, b) => {
    if (s === 'qty') return ((a.qty ?? 0) - (b.qty ?? 0)) * mul
    if (s === 'exp') return (toDateMs(a.exp) - toDateMs(b.exp)) * mul
    if (s === 'sku') return (a.sku || '').localeCompare(b.sku || '') * mul
    return (a.name || '').localeCompare(b.name || '') * mul
  })
})

function stateText(i) {
  const rule = thDict.value[i.storeId]
  const low = rule?.minQty ?? i.low ?? 0
  if ((i.qty ?? 0) < low) return '低於門檻'
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
  const allowNeg = !!d.settings?.store?.allowNegativeStock
  if (!allowNeg && (i.qty ?? 0) < 0) return 'qty-bad'
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
  const defaultExpWarn = d.settings?.store?.defaultExpDays ?? 3
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
</script>

<style scoped>
.inventory-container {
  background-color: var(--page-bg);
  color: var(--text);
  min-height: 100vh;
  padding: 20px;
  transition: background 0.3s, color 0.3s;
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
}

.section-title { font-size: 22px; font-weight: 600; margin-bottom: 12px; }

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

.btn { padding: 6px 12px; border-radius: 8px; border: none; background: #2563eb; color: #fff; cursor: pointer; font-size: 14px; }
.btn.ghost { background: #e5e7eb; color: #111827; }

.card { background: var(--card-bg); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 16px; border: 1px solid var(--border); }

/* 表格樣式 */
.table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 15px; }
.table th, .table td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
.table th { background: var(--thead-bg); color: var(--thead-text); font-weight: 600; }
.table tr:hover td { background: var(--hover-bg); }
.num { text-align: right; }

.badge-ok { color: #16a34a; font-weight: 600; }
.badge-warn { color: #ca8a04; font-weight: 600; }
.badge-danger { color: #dc2626; font-weight: 600; }

.txt-warn { color: #ca8a04; }
.txt-danger { color: #dc2626; }
.qty-bad { color: #dc2626; font-weight: bold; }

.muted { color: var(--muted); }
</style>
