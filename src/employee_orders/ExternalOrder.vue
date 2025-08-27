<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 標題 -->
      <div class="top-bar">
        <div class="title-box">外部訂貨</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 供應商 + 到貨日 -->
      <div class="toolbar">
        <select class="select" v-model="supplier">
          <option value="">選擇供應商</option>
          <option v-for="s in suppliers" :key="s" :value="s">{{ s }}</option>
        </select>
        <input class="date" type="date" v-model="eta" />
      </div>

      <!-- 可捲動內容 -->
      <div class="scrollbar">
        <!-- 區塊：熟食區 -->
        <div class="section-card">
          <div class="section-title">熟食區</div>
          <div class="item-row" v-for="(row, i) in cookedItems" :key="'c-'+i">
            <div class="item-left">
              <div class="img">圖</div>
              <div class="name">{{ row.name }}</div>
            </div>
            <div class="item-qty">
              <button class="qty-btn" @click="dec(row)">－</button>
              <input class="qty-input" type="number" min="0" v-model.number="row.qty" />
              <button class="qty-btn" @click="inc(row)">＋</button>
            </div>
          </div>
        </div>

        <!-- 區塊：醬料區 -->
        <div class="section-card">
          <div class="section-title">醬料區</div>
          <div class="item-row" v-for="(row, i) in sauceItems" :key="'s-'+i">
            <div class="item-left">
              <div class="img">圖</div>
              <div class="name">{{ row.name }}</div>
            </div>
            <div class="item-qty">
              <button class="qty-btn" @click="dec(row)">－</button>
              <input class="qty-input" type="number" min="0" v-model.number="row.qty" />
              <button class="qty-btn" @click="inc(row)">＋</button>
            </div>
          </div>
        </div>

        <!-- 備註 -->
        <div class="reason-card">
          <div class="reason-title">備註</div>
          <textarea class="reason-input" rows="4" v-model.trim="note" placeholder="例如：先到先出、紙箱保留…"></textarea>
        </div>

        <!-- 動作 -->
        <div class="actions">
          <button class="btn primary" @click="submit">送出</button>
          <button class="btn" @click="cancel">取消</button>
        </div>
      </div>

      <!-- 返回 -->
      <button class="back-button" @click="goBack">◀</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const suppliers = ['良品食品行', '百味供應社', '天和商行']
const supplier = ref('')
const eta = ref('') // 到貨日期

const cookedItems = ref([
  { id: 'c1', name: '新鮮雞腿', qty: 0 },
  { id: 'c2', name: '新鮮豬腿', qty: 0 },
])
const sauceItems = ref([
  { id: 's1', name: '某牌辣椒醬', qty: 0 },
  { id: 's2', name: '某牌醬油', qty: 0 },
])

const inc = (row) => (row.qty = (row.qty || 0) + 1)
const dec = (row) => (row.qty = Math.max(0, (row.qty || 0) - 1))

const note = ref('')

const submit = () => {
  const items = [...cookedItems.value, ...sauceItems.value].filter(i => Number(i.qty) > 0)
  if (!supplier.value) return alert('請選擇供應商')
  if (!eta.value) return alert('請選擇到貨日期')
  if (!items.length) return alert('請至少輸入一項數量')

  const payload = { kind: 'external', supplier: supplier.value, eta: eta.value, items, note: note.value }
  console.log('external order payload:', payload)
  alert('外部訂貨已送出！')
  router.back()
}

const cancel = () => router.back()
const goBack = () => router.back()
const goToSetting = () => router.push('/setting')
</script>

<style scoped>
/* Layout */
.dashboard-container { background:#dceeff; height:100vh; display:flex; justify-content:center; align-items:center; }
.dashboard-box { background:#fff; width:320px; height:90vh; padding:20px; position:relative; display:flex; flex-direction:column; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,.1); }

/* Top bar */
.top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.title-box { background:#fff; padding:12px 16px; font-size:18px; font-weight:700; border:2px solid #000; }
.gear-icon { background:none; border:0; font-size:20px; cursor:pointer; }

/* Toolbar */
.toolbar { display:flex; gap:8px; margin-bottom:12px; }
.select, .date { border:1px solid #999; border-radius:6px; padding:6px 10px; }

/* Scroll */
.scrollbar { flex:1; overflow-y:auto; padding-right:6px; }

/* Sections */
.section-card { background:#fff; border:1px solid #000; border-radius:10px; padding:10px; margin-bottom:12px; }
.section-title { display:inline-block; border:1px solid #000; border-radius:999px; padding:4px 10px; font-weight:700; margin-bottom:8px; }

/* Items */
.item-row { background:#fff; border:1px solid #000; border-radius:6px; padding:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; }
.item-left { display:flex; align-items:center; gap:10px; }
.img { width:40px; height:32px; background:#ccc; display:grid; place-items:center; font-weight:700; }
.name { font-weight:600; }
.item-qty { display:flex; align-items:center; gap:6px; }
.qty-btn { width:28px; height:28px; border:1px solid #000; border-radius:6px; background:#fff; cursor:pointer; font-weight:700; }
.qty-input { width:56px; text-align:center; border:1px solid #000; border-radius:6px; padding:4px 6px; }

/* Note */
.reason-card { background:#fff; border:1px solid #000; border-radius:6px; padding:8px; margin-bottom:12px; }
.reason-title { font-weight:700; margin-bottom:6px; }
.reason-input { width:100%; border:1px solid #999; border-radius:4px; padding:8px; resize:vertical; }

/* Actions */
.actions { display:flex; gap:12px; margin-bottom:20px; }
.btn { flex:1; padding:10px 0; background:#fff; border:1px solid #000; border-radius:999px; cursor:pointer; }
.btn.primary { background:#f5f5f5; font-weight:700; }

/* Back */
.back-button { position:absolute; bottom:12px; left:12px; background:none; border:0; font-size:20px; cursor:pointer; }
</style>
