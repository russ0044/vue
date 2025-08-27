<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 標題 + 設定 -->
      <div class="top-bar">
        <div class="title-box">庫存異動（{{ titleMap[type] || '—' }}）</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 借調限定工具列 -->
      <div v-if="type === 'borrow'" class="borrow-bar">
        <button class="pill" @click="openStorePicker">選擇門市</button>
        <div class="pill">門市：{{ targetStore || '—' }}</div>
      </div>

      <!-- 可捲動內容 -->
      <div class="scrollbar">
        <!-- 熟食區 -->
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

        <!-- 蔬菜區 -->
        <div class="section-card">
          <div class="section-title">蔬菜區</div>

          <div class="item-row" v-for="(row, i) in vegItems" :key="'v-'+i">
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

        <!-- 原因 -->
        <div class="reason-card">
          <div class="reason-title">原因</div>
          <textarea
            class="reason-input"
            rows="4"
            placeholder="請輸入原因..."
            v-model.trim="reason"
          ></textarea>
        </div>

        <!-- 動作 -->
        <div class="actions">
          <button class="btn primary" @click="submit">送出</button>
          <button class="btn" @click="cancel">取消</button>
        </div>
      </div>

      <!-- 左下返回 -->
      <button class="back-button" @click="goBack">◀</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// /stock/move/:type  -> scrap | loss | borrow
const type = computed(() => String(route.params.type || 'scrap'))

const titleMap = { scrap: '報廢', loss: '損耗', borrow: '借調' }

// 借調目標門市（示意）
const targetStore = ref('2號')
const openStorePicker = () => {
  // TODO: 改成彈窗/下拉選擇，這裡示意切換
  targetStore.value = targetStore.value === '2號' ? '3號' : '2號'
}

// 範例項目（可串 API）
const cookedItems = ref([{ id: 'c1', name: '新鮮雞腿', qty: 0 }])
const vegItems    = ref([{ id: 'v1', name: '大力士菠菜', qty: 0 }])

const inc = (row) => (row.qty = (row.qty || 0) + 1)
const dec = (row) => (row.qty = Math.max(0, (row.qty || 0) - 1))

// 原因（依 type 給預設提示）
const reason = ref('')
watch(type, (t) => {
  if (t === 'scrap')  reason.value ||= '效期過期，依SOP報廢。'
  if (t === 'loss')   reason.value ||= '保存不當造成損耗。'
  if (t === 'borrow') reason.value ||= '臨時缺料，跨門市借調。'
}, { immediate: true })

// 送出
const submit = () => {
  const payload = {
    type: type.value,
    targetStore: type.value === 'borrow' ? targetStore.value : null,
    items: [...cookedItems.value, ...vegItems.value]
      .filter(i => Number(i.qty) > 0)
      .map(i => ({ id: i.id, name: i.name, qty: Number(i.qty) })),
    reason: reason.value.trim()
  }

  // 驗證
  if (!payload.items.length) return alert('請至少輸入一個品項數量')
  if ((type.value === 'scrap' || type.value === 'loss') && !payload.reason)
    return alert('請填寫原因')
  if (type.value === 'borrow' && !payload.targetStore)
    return alert('請選擇借調門市')

  // TODO: 依 type 呼叫 API
  // e.g. POST /api/stock/move  body:{...payload}
  console.log('submit payload:', payload)
  alert('已送出！')
  router.back()
}

const cancel = () => router.back()
const goBack = () => router.back()
const goToSetting = () => router.push('/setting')
</script>

<style scoped>
/* 一致版面：320px、藍底、白卡、可捲動 */
.dashboard-container {
  background-color: #dceeff;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.dashboard-box {
  background: #fff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  width: 320px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 標題列 */
.top-bar { display:flex; justify-content:space-between; align-items:center; }
.title-box { border:2px solid #000; background:#fff; padding:12px 16px; font-size:18px; font-weight:bold; }
.gear-icon { background:none; border:none; font-size:20px; cursor:pointer; }

/* 借調工具列 */
.borrow-bar { display:flex; gap:10px; align-items:center; margin-top:10px; }
.pill { border:1px solid #000; border-radius:999px; background:#fff; padding:6px 12px; cursor:pointer; }

/* 內容可捲動 */
.scrollbar { flex:1; overflow-y:auto; padding-right:6px; margin-top:12px; }

/* 區塊卡片 */
.section-card { border:1px solid #000; border-radius:10px; padding:10px; margin-bottom:12px; background:#fff; }
.section-title { display:inline-block; border:1px solid #000; border-radius:999px; padding:4px 10px; font-weight:bold; margin-bottom:8px; }

/* 品項列 */
.item-row { border:1px solid #000; border-radius:6px; padding:8px; display:flex; justify-content:space-between; align-items:center; background:#fff; margin-bottom:8px; }
.item-left { display:flex; align-items:center; gap:10px; }
.img { width:40px; height:32px; background:#ccc; display:grid; place-items:center; font-weight:bold; }
.name { font-weight:600; }

/* 數量控制 */
.item-qty { display:flex; align-items:center; gap:6px; }
.qty-btn { border:1px solid #000; background:#fff; border-radius:6px; width:28px; height:28px; cursor:pointer; font-weight:bold; }
.qty-input { width:56px; text-align:center; border:1px solid #000; border-radius:6px; padding:4px 6px; }

/* 原因 */
.reason-card { border:1px solid #000; border-radius:6px; padding:8px; background:#fff; margin-bottom:12px; }
.reason-title { font-weight:bold; margin-bottom:6px; }
.reason-input { width:100%; border:1px solid #999; border-radius:4px; padding:8px; resize:vertical; }

/* 動作 */
.actions { display:flex; gap:12px; margin-bottom:20px; }
.btn { flex:1; border:1px solid #000; border-radius:999px; background:#fff; padding:10px 0; cursor:pointer; }
.btn.primary { background:#f5f5f5; font-weight:bold; }

/* 左下返回 */
.back-button { position:absolute; bottom:12px; left:12px; background:none; border:none; font-size:20px; cursor:pointer; }
</style>
