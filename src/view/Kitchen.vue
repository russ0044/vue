<template>
  <div class="kitchen-shell">
    <!-- 頂部列 -->
    <header class="topbar" role="banner">
      <div class="brand">
        <div class="avatar" aria-hidden="true">🍱</div>
        <div class="brand-text">
          <div class="brand-title">中央廚房</div>
          <div class="brand-sub">海南雞餐飲系統</div>
        </div>
      </div>

      <!-- 右：操作（樣式與 Boss 完全一致） -->
      <div class="actions">
        <!-- 🔔 通知鈴鐺（含紅點） -->
        <button
          ref="bellBtnRef"
          class="chip-btn ghost icon-only bell-btn"
          title="通知中心"
          aria-label="通知中心"
          @click="toggleBell"
        >
          🔔
          <span v-if="hasUnread" class="dot" aria-hidden="true"></span>
        </button>

        <button class="chip-btn ghost icon-only" title="系統設定" aria-label="系統設定" @click="goSettings">⚙</button>
        <span class="chip role-chip">中央廚房人員</span>
        <button class="chip-btn danger" @click="onLogout">登出</button>
      </div>
    </header>

    <!-- 通知面板（分組＋收放） -->
    <transition name="fade">
      <div
        v-if="bellOpen"
        ref="popoverRef"
        class="notif-popover card"
        role="dialog"
        aria-label="通知中心"
      >
        <div class="np-head">
          <div class="np-title">通知中心</div>
          <div class="np-sub">{{ themeLabel }}・{{ runtimeLabel }}・{{ todayStr }}</div>
        </div>

        <div v-if="alerts.length" class="np-list">
          <div v-for="(g, gi) in groupedAlerts" :key="g.key || gi" class="np-group">
            <!-- 群組標題（收放） -->
            <button
              class="np-group-head as-button"
              @click="toggleGroup(g.key)"
              :aria-expanded="openGroups.has(g.key) ? 'true' : 'false'"
              :aria-controls="`grp-${g.key}`"
            >
              <span class="np-group-title">{{ g.title }}</span>
              <span class="np-group-badge">{{ g.items.length }}</span>
              <span class="arrow" :class="{ open: openGroups.has(g.key) }">▾</span>
            </button>

            <!-- 群組內容 -->
            <transition name="accordion">
              <div v-show="openGroups.has(g.key)" class="np-items" :id="`grp-${g.key}`">
                <button
                  v-for="(a, i) in g.items"
                  :key="a.id || i"
                  class="np-item as-button"
                  @click="goAlert(a)"
                >
                  <div class="np-item-main">
                    <span class="badge" :class="badgeClass(a.level)">{{ levelText(a.level) }}</span>
                    <span class="np-item-text">{{ a.text }}</span>
                  </div>
                  <div class="np-item-sub">
                    <span v-if="a.date" class="np-sub-chip">{{ a.date }}</span>
                    <span v-if="a.extra" class="np-sub-chip">{{ a.extra }}</span>
                  </div>
                </button>
              </div>
            </transition>
          </div>
        </div>

        <div v-else class="np-empty">
          <div class="ico">✅</div>
          <div>目前沒有通知</div>
        </div>

        <div class="np-foot">
          <button class="chip-btn" @click="markAllRead">全部標為已讀</button>
          <div class="spacer"></div>
          <button class="chip-btn ghost" @click="bellOpen=false">關閉</button>
        </div>
      </div>
    </transition>

    <!-- 主體兩欄 -->
    <div class="body">
      <!-- 側欄 -->
      <aside class="sidebar">
        <div class="store-card">
          <div class="store-line title">中央廚房</div>
          <div class="store-line main">作業：分切 / 包裝 / 出貨</div>
          <div class="store-line sub">使用者：中央廚房人員</div>
        </div>

        <!-- 功能清單（字體大小與老闆一致） -->
        <nav class="nav-list" aria-label="中央廚房功能">
          <RouterLink to="/kitchen/orders" class="nav-item" :class="{ active: isActive('orders') }">
            <div class="nav-head">
              <div class="nav-title">訂單管理</div>
            </div>
            <div class="nav-desc">今日訂單 / 出貨進度</div>
          </RouterLink>

          <RouterLink to="/kitchen/records" class="nav-item" :class="{ active: isActive('records') }">
            <div class="nav-head">
              <div class="nav-title">生產紀錄</div>
            </div>
            <div class="nav-desc">批次 / 產量 / 追溯</div>
          </RouterLink>

          <RouterLink to="/kitchen/requests" class="nav-item" :class="{ active: isActive('requests') }">
            <div class="nav-head">
              <div class="nav-title">原料申請</div>
            </div>
            <div class="nav-desc">原料請購 / 補料紀錄</div>
          </RouterLink>
        </nav>
      </aside>

      <!-- 右側主內容 -->
      <main class="content-pane">
        <header class="page-head">
          <div class="page-title">{{ pageTitle }}</div>
          <div class="page-chips">
            <span class="mini-chip ghost">{{ themeLabel }}</span>
            <span class="mini-chip ghost">{{ runtimeLabel }}</span>
          </div>
        </header>

        <section class="content-card">
          <router-view />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/store/auth'
import { useRoute, useRouter } from 'vue-router'
import * as ds from '@/store/datasource'
import seed from '@/seed/seedData'

const { logout } = useAuth()
const route = useRoute()
const router = useRouter()

function onLogout() {
  try { logout?.() } catch {}
  router.replace({ name: 'login' })
}
function goSettings() {
  if (router.hasRoute('system-settings')) router.push({ name: 'system-settings' })
  else router.push('/settings')
}

/* =========================
 * 主題（讀 localStorage.theme + 切 html.dark）
 * ========================= */
const theme = computed(() => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'))
const themeLabel = computed(() => (theme.value === 'dark' ? '深色' : '淺色'))
function applyThemeClass() {
  const root = document.documentElement
  if (theme.value === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

/* =========================
 * 資料來源顯示（mock / firebase），支援跨頁同步
 * ========================= */
const dsMode = ref((ds.getMode && ds.getMode()) || localStorage.getItem('settings.datasource.mode') || 'mock')
const runtimeLabel = computed(() => (dsMode.value === 'firebase' ? 'Firebase' : 'Local（假資料）'))

/* =========================
 * 事件監聽（theme + datasource mode）
 * ========================= */
function onStorage(e) {
  if (!e) return
  if (e.key === 'theme') applyThemeClass()
  if (e.key === 'settings.datasource.mode') {
    const v = e.newValue
    if (v === 'mock' || v === 'firebase') dsMode.value = v
  }
}
onMounted(() => { applyThemeClass(); window.addEventListener('storage', onStorage) })
onUnmounted(() => { window.removeEventListener('storage', onStorage) })

/* =========================
 * 動態頁面標題、active 判定
 * ========================= */
const pageTitle = computed(() => route.meta?.title || '中央廚房作業')
const currentKey = computed(() => route.path.split('/').pop() || '')
const isActive = (name) => currentKey.value === name

/* =========================
 * 🔔 通知中心（分組＋收放＋導頁＋已讀）
 * ========================= */
const seedRef = ref(seed())
const bellOpen = ref(false)
const bellBtnRef = ref(null)
const popoverRef = ref(null)

const READ_KEY = 'notif-read-kitchen'
const ACCORDION_KEY = 'notif-accordion-open-groups-kitchen'
const todayStr = computed(() => new Date().toISOString().slice(0,10))

function toggleBell(){ bellOpen.value = !bellOpen.value }
function onDocClick(e){
  if (!bellOpen.value) return
  const t = e.target
  const inBtn = bellBtnRef.value?.contains(t)
  const inPanel = popoverRef.value?.contains(t)
  if (!inBtn && !inPanel) bellOpen.value = false
}
function onKey(e){ if (e.key === 'Escape') bellOpen.value = false }
onMounted(()=>{ document.addEventListener('click', onDocClick, { capture:true }); document.addEventListener('keydown', onKey) })
onUnmounted(()=>{ document.removeEventListener('click', onDocClick, { capture:true }); document.removeEventListener('keydown', onKey) })

/** 狀態字詞統一 */
function statusText(s){
  if (s === 'preparing') return '準備中'
  if (s === 'packaging') return '包裝中'
  if (s === 'shipping' ) return '運送中'
  if (s === 'arrived'  ) return '已到店'
  if (s === 'pending'  ) return '待處理'
  if (s === 'submitted') return '已送出'
  if (s === 'delivered') return '已出貨'
  if (s === 'delayed'  ) return '延誤'
  return s || '—'
}

/** 彙整通知：依中央廚房視角製作 target 導頁 */
const alerts = computed(()=>{
  const s = seedRef.value || {}
  const list = []

  // A. 今日訂單 / 出貨進度 -> /kitchen/orders
  for (const o of (s.kitchenOrders || [])){
    if (o.date === todayStr.value){
      list.push({
        id: `ko-${o.id}`,
        level: o.status === 'delayed' ? 'warn' : 'info',
        text: `今日訂單 #${o.id}（${o.items?.length||0} 項）狀態：${statusText(o.status)}`,
        date: o.date,
        target: { path: '/kitchen/orders', query: { oid: o.id } }
      })
    }
  }

  // B. 生產批次 / 紀錄 -> /kitchen/records
  for (const b of (s.kitchenBatches || [])){
    if (b.date === todayStr.value){
      list.push({
        id: `kb-${b.id}`,
        level: 'info',
        text: `生產批次 ${b.batchNo || b.id}（產量：${b.yield || 0}）狀態：${statusText(b.status)}`,
        date: b.date,
        extra: b.line ? `產線：${b.line}` : '',
        target: { path: '/kitchen/records', query: { bid: b.id } }
      })
    }
  }

  // C. 原料申請 / 補料 -> /kitchen/requests
  for (const r of (s.kitchenRequests || [])){
    list.push({
      id: `kr-${r.id}`,
      level: r.status === 'pending' ? 'warn' : 'info',
      text: `原料申請單 ${r.id}（${r.items?.length||0} 項）狀態：${statusText(r.status)}`,
      date: r.date,
      target: { path: '/kitchen/requests', query: { rid: r.id } }
    })
  }

  // D. 低庫存（若 seed 內有 centralized 庫存） -> /kitchen/requests（引導補料）
  const productsMap = new Map((s.products||[]).map(p=>[p.id,p]))
  for (const it of (s.kitchenInventory || [])){
    const p = productsMap.get(it.sku)
    if (!p) continue
    if (typeof p.safeStock==='number' && typeof it.qty==='number' && it.qty < p.safeStock){
      list.push({
        id: `klow-${it.sku}`,
        level: 'warn',
        text: `中廚庫存 ${it.name} 低於安全量（${it.qty}/${p.safeStock}）`,
        date: todayStr.value,
        target: { path: '/kitchen/requests', query: { sku: it.sku, action: 'replenish' } }
      })
    }
  }

  // 去重
  const uniq = new Map()
  for (const a of list) uniq.set(a.id, a)
  return Array.from(uniq.values())
})

/** 已讀紅點 */
const hasUnread = computed(()=>{
  const read = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
  const set = new Set(read)
  return alerts.value.some(a => !set.has(a.id))
})
function markAllRead(){
  const ids = alerts.value.map(a=>a.id)
  localStorage.setItem(READ_KEY, JSON.stringify(ids))
}

/** 分組（訂單/生產/申請/庫存） */
const groupedAlerts = computed(()=>{
  const groups = { orders:[], records:[], requests:[], stock:[], other:[] }
  for (const a of alerts.value){
    const id = String(a.id)
    if (id.startsWith('ko-')) groups.orders.push(a)
    else if (id.startsWith('kb-')) groups.records.push(a)
    else if (id.startsWith('kr-')) groups.requests.push(a)
    else if (id.startsWith('klow-')) groups.stock.push(a)
    else groups.other.push(a)
  }
  const titleOf = k =>
    k==='orders'  ? '訂單 / 出貨' :
    k==='records' ? '生產紀錄' :
    k==='requests'? '原料申請' :
    k==='stock'   ? '庫存情況' : '其他'
  return Object.entries(groups)
    .filter(([,arr])=>arr.length)
    .map(([k,arr])=>({ key:k, title:titleOf(k), items:arr }))
})

/** 點通知：標已讀＋導頁＋關閉 */
function goAlert(a){
  const read = new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'))
  read.add(a.id)
  localStorage.setItem(READ_KEY, JSON.stringify([...read]))
  if (a?.target?.path) router.push({ path:a.target.path, query:a.target.query || {} })
  bellOpen.value = false
}

/** Badge 與文字 */
function levelText(l){ return l==='warn' ? '注意' : l==='error' ? '警示' : '資訊' }
function badgeClass(l){
  if (l==='warn') return 'badge-warn'
  if (l==='error') return 'badge-error'
  return 'badge-info'
}

/** 收放狀態（會記住） */
const openGroups = ref(new Set(['orders','requests'])) // 預設展開 訂單 / 申請
function saveOpenGroups(){ try{ localStorage.setItem(ACCORDION_KEY, JSON.stringify([...openGroups.value])) }catch{} }
function toggleGroup(key){
  if (openGroups.value.has(key)) openGroups.value.delete(key)
  else openGroups.value.add(key)
  saveOpenGroups()
}
onMounted(()=>{
  try{
    const raw = localStorage.getItem(ACCORDION_KEY)
    if (raw) openGroups.value = new Set(JSON.parse(raw))
  }catch{}
})
</script>

<style scoped>
/* === 變數（與 Boss 對齊） === */
.kitchen-shell{
  --bg-page:#f6f8fc; --bg-card:#ffffff; --bg-side:#ffffff; --bg-top:#ffffff;
  --border:#e5e7eb; --border-strong:#cbd5e1;
  --text-main:#1e293b; --text-sub:#64748b; --text-invert:#ffffff;
  --chip-bg:#f8fafc; --chip-border:#e2e8f0; --chip-text:#1e293b;
  --chip-bg-danger:#fee2e2; --chip-border-danger:#fecaca; --chip-text-danger:#b91c1c;

  /* 與老闆一致的功能欄字體尺寸 */
  --nav-title-size:14px;
  --nav-desc-size:12px;

  background:var(--bg-page); color:var(--text-main); min-height:100vh;
  font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif; display:flex; flex-direction:column;
}
.dark .kitchen-shell{
  --bg-page:#0f172a; --bg-card:#1e2535; --bg-side:#1e2535; --bg-top:#1e2535;
  --border:#2f3a4f; --border-strong:#475569;
  --text-main:#e2e8f0; --text-sub:#94a3b8; --text-invert:#0f172a;
  --chip-bg:#1e2535; --chip-border:#475569; --chip-text:#e2e8f0;
  --chip-bg-danger:#4b1f1f; --chip-border-danger:#7f1d1d; --chip-text-danger:#fecaca;
}

/* 頂欄（與 Boss 同） */
.topbar{
  background:var(--bg-top); border-bottom:1px solid var(--border);
  box-shadow:0 10px 24px rgba(0,0,0,.05);
  padding:16px 20px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;
}
.dark .topbar{ box-shadow:0 10px 24px rgba(0,0,0,.6) }

.brand{ display:flex; align-items:flex-start; gap:12px; min-width:0; color:var(--text-main) }
.avatar{
  width:42px; height:42px; border-radius:50%; background:#eef2ff; border:1px solid #c7d2fe;
  box-shadow:0 2px 4px rgba(0,0,0,.05); display:flex; align-items:center; justify-content:center;
  font-size:18px; font-weight:600; color:#1e3a8a;
}
.dark .avatar{ background:#1e293b; border:1px solid #475569; color:#e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,.6) }
.brand-text{ display:flex; flex-direction:column; line-height:1.3; min-width:0 }
.brand-title{ font-weight:600; font-size:15px; color:var(--text-main) }
.brand-sub{ font-size:12px; color:var(--text-sub); white-space:nowrap }

/* 右上按鈕/膠囊（與 Boss 共用） */
.actions{ display:flex; flex-wrap:wrap; align-items:center; gap:10px }
.chip{
  border-radius:8px; padding:6px 8px; font-size:12px; line-height:1.2; font-weight:500; white-space:nowrap;
  border:1px solid var(--chip-border); background:var(--chip-bg); color:var(--chip-text);
  box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.role-chip{
  border:1px solid #c7d2fe; background:#eef2ff; color:#1e3a8a; box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.dark .role-chip{ border:1px solid #6366f1; background:#312e81; color:#fff; box-shadow:0 2px 4px rgba(0,0,0,.6) }
.chip-btn{
  border-radius:8px; font-size:13px; line-height:1.2; min-height:32px; padding:6px 10px; display:inline-flex; align-items:center; justify-content:center;
  cursor:pointer; background:var(--chip-bg); color:var(--chip-text); border:1px solid var(--chip-border); box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.chip-btn.icon-only{ width:32px; padding:0; font-size:14px; font-weight:600 }
.chip-btn.danger{ background:var(--chip-bg-danger); border-color:var(--chip-border-danger); color:var(--chip-text-danger); font-weight:500 }
.chip-btn.ghost{ background:var(--bg-top) }
.chip-btn:hover{ filter:brightness(0.97) }

/* 🔔 鈴鐺紅點 */
.bell-btn{ position:relative; }
.bell-btn .dot{
  position:absolute; top:-2px; right:-2px; width:9px; height:9px;
  background:#ef4444; border:2px solid var(--bg-top); border-radius:999px;
}

/* 通知面板 */
.notif-popover{
  position:absolute; right:88px; top:66px; width:480px; max-width:calc(100vw - 24px); z-index:60;
  background:var(--bg-card); border:1px solid var(--border); border-radius:12px; box-shadow:0 24px 60px rgba(0,0,0,.12); overflow:hidden;
}
.dark .notif-popover{ box-shadow:0 28px 80px rgba(0,0,0,.9); }
.np-head{ padding:12px 14px; border-bottom:1px solid var(--border); background:linear-gradient(to bottom, rgba(0,0,0,.02), transparent); }
.np-title{ font-size:14px; font-weight:700; }
.np-sub{ font-size:12px; color:var(--text-sub); }
.np-list{ max-height:52vh; overflow:auto; padding:8px 10px 2px; }
.np-group{ margin-bottom:10px; }
.np-group-head{ display:flex; align-items:center; gap:8px; padding:6px 8px; }
.np-group-title{ font-size:13px; font-weight:700; color: var(--text-main); }
.np-group-badge{ font-size:11px; padding: 2px 6px; border:1px solid var(--border); border-radius: 999px; color: var(--text-sub); }
.np-items{ display:flex; flex-direction:column; gap:8px; }

/* 可點通知卡 */
.np-item{
  border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card);
  padding: 8px 10px; box-shadow: 0 2px 6px rgba(0,0,0,.03); width:100%; text-align:left;
}
.as-button{ cursor:pointer; background:none; border:none; }
.as-button:hover{ background:rgba(0,0,0,.02); }
.dark .as-button:hover{ background:rgba(255,255,255,.04); }

.np-item-main{ display:flex; align-items:center; gap:8px; }
.np-item-text{ font-size:13px; color: var(--text-main); }
.np-item-sub{ display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
.np-sub-chip{ font-size:11px; color: var(--text-sub); border:1px solid var(--border); border-radius:999px; padding:2px 6px; }

.np-empty{ padding:28px 16px; text-align:center; color: var(--text-sub); }
.np-empty .ico{ font-size:24px; margin-bottom:6px; }

.np-foot{
  padding:10px 12px; border-top:1px solid var(--border); background:var(--bg-card);
  display:flex; align-items:center; gap:8px;
}

/* 通知等級 badge */
.badge{
  border-radius:999px; font-size:11px; line-height:1.2; padding:3px 6px;
  border:1px solid var(--border); align-self:flex-start; font-weight:600;
}
.badge-info{ background:#eff6ff; border-color:#bfdbfe; color:#1e3a8a; }
.badge-warn{ background:#fffbeb; border-color:#fde68a; color:#92400e; }
.badge-error{ background:#fee2e2; border-color:#fecaca; color:#991b1b; }

/* 群組標題（可收放） */
.np-group-head.as-button{
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  width:100%; padding:6px 8px; background:none; border:none; cursor:pointer; text-align:left;
  color: var(--text-main); font-weight:600; border-radius:10px;
}
.np-group-head.as-button:hover{ background:rgba(0,0,0,.03); }
.dark .np-group-head.as-button:hover{ background:rgba(255,255,255,.05); }
.arrow{ transition: transform .2s ease; }
.arrow.open{ transform: rotate(180deg); }

/* Accordion 動畫 */
.accordion-enter-active,
.accordion-leave-active { transition: max-height .25s ease, opacity .2s ease; }
.accordion-enter-from,
.accordion-leave-to { max-height: 0; opacity: 0; }
.accordion-enter-to,
.accordion-leave-from { max-height: 500px; opacity: 1; }

/* 面板淡入淡出 */
.fade-enter-active,.fade-leave-active{ transition: opacity .15s ease; }
.fade-enter-from,.fade-leave-to{ opacity:0; }

/* 兩欄、側欄與內容 */
.body{ flex:1; min-height:0; display:grid; grid-template-columns:280px 1fr; background:var(--bg-page) }

.sidebar{
  background:var(--bg-side); border-right:1px solid var(--border);
  box-shadow:0 16px 40px rgba(0,0,0,0.04);
  padding:16px 16px 24px; display:flex; flex-direction:column; gap:16px; min-height:calc(100vh - 72px);
}
.dark .sidebar{ box-shadow:0 16px 40px rgba(0,0,0,.8) }
.store-card{ background:var(--bg-side); border:1px solid var(--border); border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.03); padding:12px 14px; line-height:1.4 }
.store-line.title{ font-size:14px; font-weight:600; margin-bottom:4px }
.store-line.main{ font-size:13px; font-weight:500 }
.store-line.sub{ font-size:12px; color:var(--text-sub) }

.nav-list{ display:flex; flex-direction:column; gap:10px }
.nav-item{
  width:100%; text-decoration:none; border-radius:12px; border:1px solid var(--border);
  background:var(--bg-side); color:var(--text-main); box-shadow:0 2px 6px rgba(0,0,0,.03);
  padding:12px 14px; transition:.15s; cursor:pointer; display:block;
}
.nav-item:hover{ background:rgba(0,0,0,.02); box-shadow:0 6px 14px rgba(0,0,0,.06); transform:translateY(-1px) }
.dark .nav-item{ box-shadow:0 2px 6px rgba(0,0,0,.7) }
.dark .nav-item:hover{ background:rgba(255,255,255,.04); box-shadow:0 6px 14px rgba(0,0,0,.9) }
.nav-item.active{
  border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.15), 0 8px 20px rgba(0,0,0,.06);
  background:linear-gradient(to bottom right,#f8faff 0%,#ffffff 60%);
}
.dark .nav-item.active{
  border-color:#60a5fa; box-shadow:0 0 0 3px rgba(96,165,250,.25), 0 12px 30px rgba(0,0,0,.8);
  background:linear-gradient(to bottom right,#1e2535 0%,#1e293b 60%);
}

/* 與老闆一致的字體大小 */
.nav-title{ font-size:var(--nav-title-size); font-weight:600; line-height:1.35; letter-spacing:.2px; }
.nav-desc{ font-size:var(--nav-desc-size); line-height:1.3; color:var(--text-sub); margin-top:4px; }

.content-pane{ display:flex; flex-direction:column; min-width:0; padding:16px 20px 40px }
.page-head{
  display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px;
  background:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.02) 100%);
  border:1px solid var(--border); border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,0.04); padding:16px;
}
.dark .page-head{
  background:linear-gradient(to bottom, rgba(255,255,255,.03) 0%, rgba(0,0,0,0) 100%);
  box-shadow:0 12px 32px rgba(0,0,0,0.8);
}
.page-title{ font-size:18px; font-weight:600; display:flex; align-items:center; gap:8px }
.page-chips{ display:flex; flex-wrap:wrap; gap:8px; align-items:center }
.mini-chip{
  border-radius:8px; border:1px solid var(--border); background:var(--bg-side);
  padding:6px 8px; font-size:12px; line-height:1.2; box-shadow:0 2px 4px rgba(0,0,0,0.03);
}
.dark .mini-chip{ box-shadow:0 2px 4px rgba(0,0,0,.7) }
.content-card{
  background:var(--bg-card); border:1px solid var(--border); border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,0.04);
  padding:16px; min-height:360px; min-width:0;
}
.dark .content-card{ box-shadow:0 12px 32px rgba(0,0,0,0.8) }

/* RWD */
@media (max-width:1024px){
  .body{ grid-template-columns:100% }
  .sidebar{ border-right:none; border-bottom:1px solid var(--border); min-height:auto }

  .notif-popover{
    right:16px;
    top:72px;
    width:calc(100vw - 32px);
  }
}
@media (max-width:640px){
  .topbar{ padding:12px 14px }
  .content-pane{ padding:12px 12px 28px }
}
</style>
