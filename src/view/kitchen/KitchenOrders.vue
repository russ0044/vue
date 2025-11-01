<template>
  <section class="kitchen-page">
    <!-- 頁首 -->
    <header class="k-header glass">
      <div class="title">中央廚房・訂單準備</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="goHome">返回主頁</button>
    </header>

    <!-- 篩選與生成 -->
    <div class="k-filters glass">
      <div class="row gap">
        <select v-model="selectedStoreId" class="input sm select" @change="persistFilter">
          <option value="">全部門市</option>
          <option v-for="s in db.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <input type="date" class="input sm date" v-model="dateStr" @change="persistFilter">

        <div class="chips">
          <button
            v-for="tg in tags"
            :key="tg"
            class="chip"
            :class="{ on: tagFilter.has(tg) }"
            @click="toggleTag(tg)"
          >{{ tg }}</button>
        </div>
      </div>

      <div class="spacer"></div>

      <button class="btn primary small" @click="doGenerateTodayOrder">
        生成今日訂單
      </button>

      <button class="btn ghost small only-mobile" @click="drawerOpen = true">清單</button>
    </div>

    <!-- 主體 -->
    <div class="k-grid">
      <!-- 左側清單 -->
      <aside class="k-side" :class="{ open: drawerOpen }">
        <div class="side-list">
          <div
            class="side-item"
            v-for="o in filteredOrders"
            :key="o.id"
            :class="{ active: o.id === selectedId }"
            @click="selectLeft(o.id)"
          >
            <div class="grow">
              <div class="name"><strong>{{ storeName(o.storeId) }}</strong></div>
              <div class="muted small">{{ o.date }}｜品項：{{ o.items.length }}</div>
            </div>
            <div class="badge">訂單</div>
          </div>

          <p v-if="!filteredOrders.length" class="muted center side-empty">目前沒有訂單</p>
        </div>
      </aside>

      <transition name="fade">
        <div v-if="drawerOpen" class="backdrop" @click="drawerOpen = false" />
      </transition>

      <!-- 右側主區 -->
      <main class="k-main card">
        <div class="main-head">
          <div class="left">
            <div class="view-title">訂單詳情</div>
            <div v-if="currentOrder" class="mini-stats">
              <div class="mini-box">
                <div class="mini-label">總數量</div>
                <div class="mini-value">{{ totalQty(currentOrder) }}</div>
              </div>
              <div class="mini-box">
                <div class="mini-label">品項數</div>
                <div class="mini-value">{{ currentOrder.items.length }}</div>
              </div>
            </div>
          </div>

          <div class="spacer"></div>

          <div class="row gap" v-if="currentOrder">
            <button class="btn" @click="doRecalc">數量校正</button>
            <button class="btn ghost" @click="doDuplicate">複製到其他門市</button>
            <button class="btn primary" @click="doCloseOrder">完成並存檔</button>
          </div>
        </div>

        <!-- 未選訂單 -->
        <div v-if="!currentOrder" class="empty-state">
          <div class="empty-title">尚未選擇訂單</div>
          <div class="muted">請從左側選擇訂單，或按下「生成今日訂單」</div>
        </div>

        <!-- 訂單內容 -->
        <div v-else class="paper">
          <div class="paper-head">
            <div>門市：{{ storeName(currentOrder.storeId) }}</div>
            <div>日期：{{ currentOrder.date }}</div>
          </div>

          <div v-for="group in groupedOrd" :key="group.name" class="section">
            <div class="sec-title">{{ group.name }}</div>
            <div class="table">
              <div class="th">
                <div class="w200">品名</div>
                <div class="w90">單位</div>
                <div class="w120">數量</div>
                <div class="grow">備註</div>
              </div>
              <div class="tr" v-for="it in group.rows" :key="it.key">
                <div class="w200">{{ it.name }}</div>
                <div class="w90">{{ it.unit }}</div>
                <div class="w120">
                  <input
                    type="number"
                    class="input"
                    min="0"
                    v-model.number="it.qty"
                    @change="saveAll()"
                  />
                </div>
                <div class="grow">
                  <input
                    class="input"
                    v-model.trim="it.note"
                    placeholder="備註…"
                    @change="saveAll()"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 摘要 -->
          <div class="order-summary">
            <div class="summary-box">
              <div class="summary-label">出貨總數量</div>
              <div class="summary-value">{{ totalQty(currentOrder) }}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">品項數</div>
              <div class="summary-value">{{ currentOrder.items.length }}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">狀態</div>
              <div class="summary-value status-chip">準備中</div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 底部工具列 -->
    <footer class="footer-bar glass">
      <div class="tagline">中央廚房・配貨與出貨整單</div>
      <div class="spacer"></div>
  
      <div class="footer-actions">
        <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
        <label class="btn ghost small file-btn">
          匯入 JSON
          <input type="file" accept="application/json" @change="onImportJSON">
        </label>
      </div>
    </footer>

    <!-- 提示 -->
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useKitchenData } from '@/composables/useKitchenData.js'

const {
  db,
  fetchAll,
  saveAll,
  storeName,
  generateTodayOrderForStore,
  recalcOrder,
  duplicateToOtherStores,
  closeOrder,
  totalQty,
  exportJSON,
  importJSONFile,
  setMode, // 由系統設定控制資料來源：local / firebase
} = useKitchenData()

const router = useRouter()
const route = useRoute()
const toast = ref('')

const drawerOpen = ref(false)
const selectedId = ref(route.query.focus || null)
const selectedStoreId = ref(localStorage.getItem('km-store') || '')
const dateStr = ref(localStorage.getItem('km-date') || new Date().toISOString().slice(0, 10))
const tags = ['熟食區', '雜項區']
const tagFilter = reactive(new Set())

function tip(msg){ toast.value = msg; setTimeout(() => (toast.value = ''), 1400) }

/* 儲存篩選條件 */
function persistFilter(){
  localStorage.setItem('km-store', selectedStoreId.value)
  localStorage.setItem('km-date', dateStr.value)
}

/* Tag 選擇 */
function toggleTag(tg){
  tagFilter.has(tg) ? tagFilter.delete(tg) : tagFilter.add(tg)
}

/* 過濾訂單 */
const filteredOrders = computed(() =>
  db.orders
    .filter(o => !selectedStoreId.value || o.storeId === selectedStoreId.value)
    .filter(o => o.date === dateStr.value)
    .filter(o => !tagFilter.size || o.items.some(it => tagFilter.has(it.cat)))
    .sort((a, b) => (a.storeId > b.storeId ? 1 : -1))
)
const currentOrder = computed(() => db.orders.find(o => o.id === selectedId.value) || null)

/* 依分類分組 */
const groupedOrd = computed(() => {
  if (!currentOrder.value) return []
  const g = {}
  currentOrder.value.items.forEach(it => {
    if (!g[it.cat]) g[it.cat] = []
    g[it.cat].push(it)
  })
  return Object.keys(g).map(name => ({ name, rows: g[name] }))
})

function selectLeft(id){ selectedId.value = id; drawerOpen.value = false }

/* 功能 */
function doGenerateTodayOrder(){
  const sid = selectedStoreId.value || (db.stores[0]?.id || '')
  const date = dateStr.value
  if (!sid){ tip('沒有可用的門市'); return }
  const res = generateTodayOrderForStore(sid, date)
  tip(res.msg)
  if (res.ok) selectedId.value = res.newOrderId
}
function doRecalc(){
  if (!currentOrder.value) return
  recalcOrder(currentOrder.value)
  tip('數量已校正')
}
function doDuplicate(){
  const res = duplicateToOtherStores(currentOrder.value)
  tip(res.msg)
}
function doCloseOrder(){
  const res = closeOrder(currentOrder.value)
  tip(res.msg)
  if (res.ok) selectedId.value = null
}
function onImportJSON(e){
  const f = e.target.files?.[0]
  if (!f) return
  importJSONFile(f, () => tip('已匯入資料'), () => tip('匯入失敗：格式錯誤'))
}

/* 初始化：以系統設定為準；這裡先預設 local（seedData），若你的全域設定切到 firebase，系統會在外層呼叫 setMode('firebase') 後再進來 */
onMounted(async () => {
  setMode('local')
  await fetchAll()
})

/* 導回主頁 */
function goHome(){ router.push({ name: 'boss-inventory' }) }
</script>

<style scoped>
/* ---------- 主題色（亮/暗） ---------- */
:root{
  --bg:#f7f9fc;
  --glass:rgba(255,255,255,0.9);
  --card:#ffffff;
  --border:#e3e8f0;
  --accent:#2563eb;
  --text:#0f172a;
  --muted:#64748b;
}
.dark :root,
.dark .kitchen-page{
  --bg:#0f172a;
  --glass:rgba(30,37,53,0.85);
  --card:#1e2535;
  --border:#334155;
  --accent:#60a5fa;
  --text:#e2e8f0;
  --muted:#94a3b8;
}

/* ---------- 版型 ---------- */
.kitchen-page{background:var(--bg);min-height:100vh;display:flex;flex-direction:column;padding:16px 16px 76px;}
.glass{backdrop-filter:blur(10px);}
.spacer{flex:1;}
.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.gap{gap:10px;}

.k-header{display:flex;align-items:center;background:var(--glass);border:1px solid var(--border);border-radius:14px;padding:12px 16px;box-shadow:0 6px 18px rgba(0,0,0,.06);}
.title{font-size:18px;font-weight:700;color:var(--text);letter-spacing:.02em;}

.k-filters{display:flex;align-items:center;background:var(--glass);border:1px solid var(--border);border-radius:14px;padding:12px;margin:12px 0;box-shadow:0 6px 18px rgba(0,0,0,.05);}
.k-grid{display:grid;grid-template-columns:300px 1fr;gap:12px;}
.k-side{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:auto;box-shadow:0 8px 22px rgba(0,0,0,.06);}

/* ---------- 列表 ---------- */
.side-list{padding:10px;}
.side-item{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--border);border-radius:12px;padding:10px;margin-bottom:10px;background:var(--card);cursor:pointer;transition:.15s;}
.side-item:hover{transform:translateY(-1px);box-shadow:0 10px 20px rgba(0,0,0,.06);}
.side-item.active{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.15);}
.name{color:var(--text);}
.muted{color:var(--muted);font-size:13px;}
.small{font-size:12px;line-height:1.2;}
.center{text-align:center;}
.badge{border:1px solid var(--border);border-radius:999px;padding:2px 8px;font-size:12px;line-height:1.1;color:var(--text);}

/* ---------- 主卡片 ---------- */
.k-main.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 10px 26px rgba(0,0,0,.06);}
.view-title{font-size:17px;font-weight:700;color:var(--text);}
.mini-stats{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;}
.mini-box{border:1px solid var(--border);border-radius:10px;padding:8px 12px;background:transparent;}
.mini-label{font-size:11px;color:var(--muted);}
.mini-value{font-size:16px;font-weight:700;color:var(--text);}

.empty-state{border:1px dashed var(--border);border-radius:12px;padding:22px 16px;background:transparent;text-align:center;}
.empty-title{font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px;}

.paper{border:1px solid var(--border);border-radius:12px;overflow:hidden;}
.paper-head{display:flex;justify-content:space-between;background:rgba(0,0,0,.03);padding:12px 16px;border-bottom:1px dashed var(--border);}
.section{padding:16px;}
.sec-title{font-weight:700;font-size:14px;color:var(--text);margin-bottom:10px;}
.table{border:1px solid var(--border);border-radius:10px;overflow:hidden;font-size:14px;}
.th,.tr{display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(0,0,0,.06);padding:10px 12px;}
.th{background:rgba(0,0,0,.03);font-weight:600;color:var(--text);}
.tr:last-child{border-bottom:none;}
.w200{width:200px;} .w120{width:120px;} .w90{width:90px;} .grow{flex:1;min-width:0;}

/* ---------- 表單 ---------- */
.input{border:1px solid var(--border);border-radius:10px;padding:8px 10px;background:var(--card);color:var(--text);width:100%;}
.input.sm{padding:7px 10px;font-size:14px;}
.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.15);outline:none;}
/* 選擇框與日期：統一高度與圓角，移除醜邊框 */
.select,.date{min-width:200px;}

/* ---------- Chips ---------- */
.chips{display:flex;flex-wrap:wrap;gap:8px;}
.chip{border:1px solid var(--border);border-radius:999px;background:transparent;padding:6px 12px;cursor:pointer;font-size:13px;color:var(--text);transition:.12s;}
.chip:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(0,0,0,.06);}
.chip.on{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.15);}

/* ---------- 按鈕 ---------- */
.btn{border:1px solid var(--accent);background:transparent;color:var(--accent);border-radius:10px;padding:8px 12px;cursor:pointer;font-size:14px;white-space:nowrap;transition:.15s;}
.btn:hover{filter:brightness(1.02);}
.btn.primary{background:var(--accent);color:#fff;}
.btn.ghost{border-color:var(--border);color:var(--text);}
.btn.small{padding:6px 10px;font-size:13px;}

/* ---------- 底部工具列 ---------- */
.footer-bar{position:fixed;left:0;right:0;bottom:0;background:var(--glass);border-top:1px solid var(--border);box-shadow:0 -6px 24px rgba(0,0,0,.06);display:flex;align-items:center;padding:10px 16px;z-index:50;}
.tagline{font-size:13px;color:var(--muted);}
.footer-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.file-btn{position:relative;overflow:hidden;}
.file-btn input{position:absolute;inset:0;opacity:0;cursor:pointer;}

/* ---------- Toast ---------- */
.toast{position:fixed;right:16px;bottom:80px;background:#111827;color:#fff;padding:10px 12px;border-radius:10px;opacity:.95;font-size:13px;z-index:70;}

/* ---------- 手機側欄 ---------- */
.only-mobile{display:none;}
.backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:30;}
@media (max-width:1024px){
  .k-grid{grid-template-columns:1fr;}
  .k-side{position:fixed;inset:0 auto 0 0;width:82%;max-width:340px;z-index:40;transform:translateX(-100%);transition:.25s;box-shadow:8px 0 24px rgba(0,0,0,.25);}
  .k-side.open{transform:translateX(0);}
  .only-mobile{display:inline-flex;}
}
</style>
