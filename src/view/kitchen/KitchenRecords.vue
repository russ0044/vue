<!-- src/views/kitchen/KitchenRecords.vue -->
<template>
  <section class="kitchen-page">
    <!-- 頁首 -->
    <header class="k-header glass">
      <div class="title">中央廚房・出貨紀錄</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="goHome">返回主頁</button>
    </header>

    <!-- 篩選 -->
    <div class="k-filters glass">
      <div class="row gap">
        <select
          v-model="selectedStoreId"
          class="input sm select"
          @change="persistFilter"
        >
          <option value="">全部門市</option>
          <option
            v-for="s in db.stores"
            :key="s.id"
            :value="s.id"
          >
            {{ s.name }}
          </option>
        </select>

        <input
          type="date"
          class="input sm date"
          v-model="dateStr"
          @change="persistFilter"
        />
      </div>

      <div class="spacer"></div>

      <div class="row gap">
        <button
          class="btn ghost small only-mobile"
          @click="drawerOpen = true"
        >
          清單 ☰
        </button>
      </div>
    </div>

    <!-- 主體 -->
    <div class="k-grid">
      <!-- 左側清單 -->
      <aside class="k-side" :class="{ open: drawerOpen }">
        <div class="side-list">
          <div
            class="side-item"
            v-for="rec in filteredRecords"
            :key="rec.id"
            :class="{ active: rec.id === selectedId }"
            @click="selectLeft(rec.id)"
          >
            <div class="grow">
              <div class="name">
                <strong>{{ storeName(rec.storeId) }}</strong>
              </div>
              <div class="muted small">
                {{ rec.date }}｜{{ rec.items.length }} 筆
              </div>
            </div>
            <div class="badge">紀錄</div>
          </div>

          <p
            v-if="!filteredRecords.length"
            class="muted center side-empty"
          >
            無出貨紀錄
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

      <!-- 右側內容 -->
      <main class="k-main card">
        <div class="main-head">
          <div class="left">
            <div class="view-title">紀錄內容</div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div
          v-if="!currentRecord"
          class="empty-state"
        >
          <div class="empty-title">尚未選擇紀錄</div>
          <div class="muted">請從左側選擇一筆出貨紀錄</div>
        </div>

        <!-- 詳細 -->
        <div
          v-else
          class="paper"
        >
          <div class="paper-head">
            <div>門市：{{ storeName(currentRecord.storeId) }}</div>
            <div>日期：{{ currentRecord.date }}</div>
          </div>

          <div class="section">
            <div class="sec-title">摘要</div>
            <div class="muted">
              {{ currentRecord.summary || '—' }}
            </div>
          </div>

          <div class="section">
            <div class="sec-title">出貨清單</div>

            <div class="table">
              <div class="th">
                <div class="w200">品名</div>
                <div class="w90">單位</div>
                <div class="w120">數量</div>
                <div class="grow">備註</div>
              </div>

              <div
                v-for="it in currentRecord.items"
                :key="it.key || it.name"
                class="tr"
              >
                <div class="w200">{{ it.name }}</div>
                <div class="w90">{{ it.unit }}</div>
                <div class="w120">{{ it.qty }}</div>
                <div class="grow">{{ it.note }}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 底部工具列 -->
    <footer class="footer-bar glass">
      <div class="tagline">中央廚房・批次 / 產量 / 追溯</div>
      <div class="spacer"></div>
      <div class="footer-actions">
        <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
        <label class="btn ghost small file-btn">
          匯入 JSON
          <input type="file" accept="application/json" @change="onImportJSON" />
        </label>
      </div>
    </footer>

    <!-- 提示 -->
    <transition name="fade">
      <div
        v-if="toast"
        class="toast"
      >
        {{ toast }}
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useKitchenData } from '@/composables/useKitchenData.js'
import seed from '@/seed/seedData' // ★ 引入假資料

const {
  db,
  fetchAll,
  setMode,          // 'local' | 'firebase'
  storeName,
  exportJSON,
  importJSONFile,
} = useKitchenData()

const router = useRouter()
const toast = ref('')
function tip (msg) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 1400)
}

const drawerOpen      = ref(false)
const selectedId      = ref(null)
const selectedStoreId = ref(localStorage.getItem('km-store') || '')
const dateStr         = ref(localStorage.getItem('km-date')  || '')

/** 記住目前的門市 / 日期條件（跟原料申請共用同一組 key） */
function persistFilter () {
  localStorage.setItem('km-store', selectedStoreId.value || '')
  localStorage.setItem('km-date',  dateStr.value || '')
}

/** 左側清單：依門市 / 日期過濾；沒選日期時顯示全部 */
const filteredRecords = computed(() => {
  let list = db.records || []

  if (selectedStoreId.value) {
    list = list.filter(r => r.storeId === selectedStoreId.value)
  }

  if (dateStr.value) {
    list = list.filter(r => r.date === dateStr.value)
  }

  // 先新日期，再依門市排序
  return list.slice().sort((a, b) => {
    if (a.date === b.date) {
      return a.storeId > b.storeId ? 1 : -1
    }
    return a.date > b.date ? -1 : 1
  })
})

const currentRecord = computed(
  () => (db.records || []).find(r => r.id === selectedId.value) || null
)

function selectLeft (id) {
  selectedId.value = id
  drawerOpen.value = false
}

/** 匯入 JSON */
function onImportJSON (e) {
  const f = e.target.files?.[0]
  if (!f) return
  importJSONFile(
    f,
    () => tip('匯入完成'),
    () => tip('匯入失敗')
  )
}

/** 返回主頁（依你的路由名稱調整） */
function goHome () {
  router.push({ name: 'boss-inventory' })
}

/** 初始化：
 *  1) 先 fetchAll()
 *  2) 若沒有 records，從 seedData().kitchenRecords 灌入假資料
 *  3) 自動選擇有資料的最新日期 + 該日期第一筆紀錄
 */
onMounted(async () => {
  setMode('local')   // 預設讀假資料；若全域從設定切到 firebase，也可以覆蓋這個
  await fetchAll()

  // ★ 1. 如果完全沒有出貨紀錄，就從 seed 裡補一份
  if (!db.records || !db.records.length) {
    const s = seed() || {}
    const raw = Array.isArray(s.kitchenRecords) ? s.kitchenRecords : []
    db.records = raw.map(r => ({
      id: r.id,
      storeId: r.storeId,
      date: r.date,
      summary: r.summary || '',
      items: (r.items || []).map(it => ({
        ...it,
        note: it.note ?? '',
      })),
    }))
  }

  const records = db.records || []

  // ★ 2. 決定預設日期：如果目前沒有日期，或這個日期沒有任何紀錄，就抓最新一筆的日期
  if (!dateStr.value || !records.some(r => r.date === dateStr.value)) {
    const latestDate = records.reduce((acc, r) => {
      if (!acc || r.date > acc) return r.date
      return acc
    }, '')

    if (latestDate) {
      dateStr.value = latestDate
      persistFilter()
    } else if (!dateStr.value) {
      // 完全沒有資料就退回今天（純 UI）
      dateStr.value = new Date().toISOString().slice(0, 10)
      persistFilter()
    }
  }

  // ★ 3. 自動選第一筆紀錄，讓右側一打開就有東西
  if (!selectedId.value && filteredRecords.value.length) {
    selectedId.value = filteredRecords.value[0].id
  }
})
</script>

<style scoped>
/* ---------- 主題（亮/暗） ---------- */
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

/* ---------- 左側清單 ---------- */
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

/* 空狀態 */
.empty-state{border:1px dashed var(--border);border-radius:12px;padding:22px 16px;background:transparent;text-align:center;}
.empty-title{font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px;}

/* ---------- 紙張/表格 ---------- */
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
.select,.date{min-width:200px;}

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
