<!-- src/components/BossShell.vue -->
<template>
  <div class="boss-shell">
    <!-- 頂部列 -->
    <header class="topbar">
      <!-- 左側：品牌 / 門市資訊 -->
      <div class="brand">
        <div class="avatar" aria-hidden="true">🏪</div>
        <div class="brand-text">
          <div class="brand-title">{{ brandName }}</div>
          <div class="brand-sub">門市：{{ storeName }} ({{ storeId }})</div>
        </div>
      </div>

      <!-- 右側：操作區 -->
      <div class="actions">
        <!-- 鈴鐺（通知） -->
        <button
          ref="bellBtnRef"
          class="chip-btn ghost icon-only bell-btn"
          @click="toggleBell"
          title="通知中心"
          aria-label="通知中心"
          :aria-expanded="bellOpen ? 'true' : 'false'"
          aria-haspopup="dialog"
        >
          🔔
          <span v-if="hasUnread" class="dot" aria-hidden="true"></span>
        </button>

        <!-- 設定 -->
        <button
          class="chip-btn ghost icon-only"
          @click="goSettings"
          title="系統設定"
          aria-label="系統設定"
        >⚙</button>

        <!-- 依角色顯示 -->
        <span class="chip role-chip">{{ roleLabel }}</span>

        <button class="chip-btn danger" @click="onLogout">登出</button>
      </div>
    </header>

    <!-- 通知面板（含收放式群組） -->
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
          <div class="np-sub">
            {{ roleLabel }}・{{ dataSourceLabel }}・{{ todayStr }}
          </div>
        </div>

        <div v-if="alerts.length" class="np-list">
          <div
            v-for="(g, gi) in groupedAlerts"
            :key="g.key || gi"
            class="np-group"
          >
            <!-- 群組標題列（可收放） -->
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

            <!-- 群組內容（可收放 + 動畫） -->
            <transition name="accordion">
              <div
                v-show="openGroups.has(g.key)"
                class="np-items"
                :id="`grp-${g.key}`"
              >
                <!-- 通知卡（可點：導頁 + 已讀） -->
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
                    <span v-if="a.storeName" class="np-sub-chip">{{ a.storeName }}</span>
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

    <!-- 主體 -->
    <div class="body">
      <aside class="sidebar">
        <div class="store-card">
          <div class="store-line title">{{ brandName }}</div>
          <div class="store-line main">門市：{{ storeName }}</div>
          <div class="store-line sub">使用者：{{ userName }}</div>
        </div>

        <nav class="nav-list">
          <button
            :class="['nav-item', isActive('inventory') && 'active']"
            @click="go('inventory')"
          >
            <div class="nav-head"><div class="nav-title">檢視店面庫存</div></div>
            <div class="nav-desc">即時庫存 / 效期 / 低庫存警示</div>
          </button>

          <button
            :class="['nav-item', isActive('ingredients') && 'active']"
            @click="go('ingredients')"
          >
            <div class="nav-head"><div class="nav-title">食材資料</div></div>
            <div class="nav-desc">品項與單位 / 採購基準</div>
          </button>

          <button
            :class="['nav-item', isActive('rolegroups') && 'active']"
            @click="go('rolegroups')"
          >
            <div class="nav-head"><div class="nav-title">群組權限</div></div>
            <div class="nav-desc">角色 / 權限分配 / 安全</div>
          </button>

          <button
            :class="['nav-item', isActive('stores') && 'active']"
            @click="go('stores')"
          >
            <div class="nav-head"><div class="nav-title">店面管理</div></div>
            <div class="nav-desc">門市資料 / 中央廚房</div>
          </button>

          <button
            :class="['nav-item', isActive('thresholds') && 'active']"
            @click="go('thresholds')"
          >
            <div class="nav-head"><div class="nav-title">警示門檻</div></div>
            <div class="nav-desc">低庫存 / 安全庫存線</div>
          </button>

          <button
            :class="['nav-item', isActive('order-settings') && 'active']"
            @click="go('order-settings')"
          >
            <div class="nav-head"><div class="nav-title">訂單設定</div></div>
            <div class="nav-desc">請貨流程 / 審核規則</div>
          </button>

          <button
            :class="['nav-item', isActive('invite') && 'active']"
            @click="go('invite')"
          >
            <div class="nav-head"><div class="nav-title">生成邀請碼</div></div>
            <div class="nav-desc">加入店員 / 中央廚房人員</div>
          </button>

          <button
            :class="['nav-item', isActive('reports') && 'active']"
            @click="go('reports')"
          >
            <div class="nav-head"><div class="nav-title">報表中心</div></div>
            <div class="nav-desc">銷量 / 耗材 / 趨勢</div>
          </button>
        </nav>
      </aside>

      <!-- 右側主內容 -->
      <main class="content-pane">
        <header class="page-head">
          <div class="page-title">{{ currentPageTitle }}</div>
          <div class="page-chips">
            <span class="mini-chip ghost">{{ roleLabel }}</span>
            <span class="mini-chip ghost">{{ themeLabel }}</span>
            <span class="mini-chip ghost">{{ dataSourceLabel }}</span>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'
import { useScope } from '@/store/scope'
import * as ds from '@/store/datasource'
import seed from '@/seed/seedData'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const { state: roleState } = useRoleStore()
const scope = useScope()

/* ---------- 鈴鐺 / 通知 ---------- */
const bellOpen = ref(false)
const bellBtnRef = ref(null)
const popoverRef = ref(null)
const todayStr = computed(() => new Date().toISOString().slice(0,10))

const READ_KEY = 'notif-read-boss'
const ACCORDION_KEY = 'notif-accordion-open-groups' // 記憶展開群組

function toggleBell(){ bellOpen.value = !bellOpen.value }
function onDocClick(e){
  if (!bellOpen.value) return
  const t = e.target
  const inBtn = bellBtnRef.value?.contains(t)
  const inPanel = popoverRef.value?.contains(t)
  if (!inBtn && !inPanel) bellOpen.value = false
}
function onKey(e){ if (e.key === 'Escape') bellOpen.value = false }
onMounted(()=>{
  document.addEventListener('click', onDocClick, { capture:true })
  document.addEventListener('keydown', onKey)
  // 還原上次展開狀態
  try {
    const raw = localStorage.getItem(ACCORDION_KEY)
    if (raw) openGroups.value = new Set(JSON.parse(raw))
  } catch {}
})
onBeforeUnmount(()=>{
  document.removeEventListener('click', onDocClick, { capture:true })
  document.removeEventListener('keydown', onKey)
})

/** 從 seed 組合通知清單（依角色與門市），並附導頁 target */
const alerts = computed(()=>{
  const s = seed() || {}
  const curStoreId = scope?.storeId
  const storeNameById = (id)=>{
    const found = (s.stores || []).find(x=>x.id===id)
    return found ? found.name : id
  }

  const list = []

  // 低庫存（依 products.safeStock）-> /boss/inventory
  const productsMap = new Map((s.products||[]).map(p=>[p.id,p]))
  const inv = (s.inventory||[])
  const invByScope = roleState?.role==='Boss' ? inv : inv.filter(x=>!curStoreId || x.storeId===curStoreId)

  for (const it of invByScope){
    const p = productsMap.get(it.sku)
    if (!p) continue
    if (typeof p.safeStock==='number' && typeof it.qty==='number' && it.qty < p.safeStock){
      list.push({
        id:`low-${it.storeId}-${it.sku}`,
        level:'warn',
        text:`${it.name} 低於安全量（${it.qty}/${p.safeStock}）`,
        storeId: it.storeId,
        storeName: storeNameById(it.storeId),
        target:{ path:'/boss/inventory', query:{ sku: it.sku, store: it.storeId } }
      })
    }
    if (it.exp && it.exp <= todayStr.value){
      list.push({
        id:`exp-${it.storeId}-${it.sku}`,
        level:'info',
        text:`${it.name} 已過期或今日到期（${it.exp}）`,
        storeId: it.storeId,
        storeName: storeNameById(it.storeId),
        target:{ path:'/boss/inventory', query:{ sku: it.sku, exp: it.exp, store: it.storeId } }
      })
    }
  }

  // 今日配送（empDeliveries 或 delivery.schedule）-> /boss/stores
  for (const d of (s.empDeliveries || [])){
    if (d.date===todayStr.value && (!curStoreId || d.storeId===curStoreId)){
      list.push({
        id: `ed-${d.id}`,
        level:'info',
        text:`今日配送 ${d.items?.length||0} 項，狀態：${d.status}`,
        storeId: d.storeId,
        storeName: storeNameById(d.storeId),
        date: d.date,
        target:{ path:'/boss/stores', query:{ date: d.date, store: d.storeId } }
      })
    }
  }
  for (const sch of (s.delivery?.schedule||[])){
    if (sch.date===todayStr.value){
      for (const stop of (sch.stops||[])){
        if (!curStoreId || stop.storeId===curStoreId){
          list.push({
            id:`sch-${sch.id}-${stop.storeId}`,
            level:'info',
            text:`${sch.routeName||'配送路線'} 車次：${sch.vehicle||''} ETA ${stop.eta||''}`.trim(),
            storeId: stop.storeId,
            storeName: storeNameById(stop.storeId),
            date: sch.date,
            target:{ path:'/boss/stores', query:{ date: sch.date, store: stop.storeId } }
          })
        }
      }
    }
  }

  // 門市請貨 / 中央廚房 -> /boss/order-settings（訂單設定）
  for (const r of (s.demo?.empRequests||[])){
    if (!curStoreId || r.storeId===curStoreId){
      list.push({
        id:`req-${r.id}`,
        level: r.status==='pending' ? 'warn' : 'info',
        text:`請貨單 ${r.id}（${r.items?.length||0} 項）狀態：${r.status}`,
        storeId: r.storeId,
        storeName: storeNameById(r.storeId),
        date: r.date,
        target:{ path:'/boss/order-settings', query:{ rid: r.id, store: r.storeId } }
      })
    }
  }
  for (const kr of (s.kitchenRequests||[])){
    list.push({
      id:`kr-${kr.id}`,
      level: kr.status==='pending' ? 'warn' : 'info',
      text:`中央廚房請貨單 ${kr.id}（${kr.items?.length||0} 項）狀態：${kr.status}`,
      storeId: kr.storeId,
      storeName: storeNameById(kr.storeId),
      date: kr.date,
      target:{ path:'/boss/order-settings', query:{ kid: kr.id, store: kr.storeId } }
    })
  }

  // 去重
  const uniq = new Map()
  for (const a of list) uniq.set(a.id, a)
  return Array.from(uniq.values())
})

/* 紅點：有未讀就顯示 */
const hasUnread = computed(()=>{
  const read = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
  const set = new Set(read)
  return alerts.value.some(a => !set.has(a.id))
})
function markAllRead(){
  const ids = alerts.value.map(a=>a.id)
  localStorage.setItem(READ_KEY, JSON.stringify(ids))
}

/* 點通知 => 標已讀 + 導頁 + 關閉 */
function goAlert(a){
  const read = new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'))
  read.add(a.id)
  localStorage.setItem(READ_KEY, JSON.stringify([...read]))

  if (a?.target?.path){
    router.push({ path:a.target.path, query:a.target.query || {} })
  }
  bellOpen.value = false
}

/* 分組顯示：庫存 / 配送 / 申請 / 其他 */
const groupedAlerts = computed(()=>{
  const groups = { stock:[], delivery:[], request:[], other:[] }
  for (const a of alerts.value){
    const id = String(a.id)
    if (id.startsWith('low-') || id.startsWith('exp-')) groups.stock.push(a)
    else if (id.startsWith('ed-') || id.startsWith('sch-')) groups.delivery.push(a)
    else if (id.startsWith('req-') || id.startsWith('kr-')) groups.request.push(a)
    else groups.other.push(a)
  }
  const toTitle = (k)=> k==='stock'?'庫存情況':k==='delivery'?'配送情況':k==='request'?'請貨／訂單':'其他'
  return Object.entries(groups)
    .filter(([,arr])=>arr.length)
    .map(([k,arr])=>({ key:k, title:toTitle(k), items:arr }))
})

/* 收放控制：預設展開第一個群組，並記憶上次狀態 */
const openGroups = ref(new Set(['stock']))
function saveOpenGroups(){
  try { localStorage.setItem(ACCORDION_KEY, JSON.stringify([...openGroups.value])) } catch {}
}
function toggleGroup(key){
  if (openGroups.value.has(key)) openGroups.value.delete(key)
  else openGroups.value.add(key)
  saveOpenGroups()
}

/* Badge / 文字 */
function levelText(l){ return l==='warn' ? '注意' : l==='error' ? '警示' : '資訊' }
function badgeClass(l){
  if (l==='warn') return 'badge-warn'
  if (l==='error') return 'badge-error'
  return 'badge-info'
}

/* --------------------- 主題顯示 --------------------- */
const themeMode = ref(localStorage.getItem('theme') || 'light')
function handleThemeStorage(e){ if (e && e.key === 'theme') themeMode.value = e.newValue || 'light' }
onMounted(()=> window.addEventListener('storage', handleThemeStorage))
onBeforeUnmount(()=> window.removeEventListener('storage', handleThemeStorage))
const themeLabel = computed(() => {
  const mode = themeMode.value
  if (mode === 'dark') return '深色'
  if (mode === 'auto') return document.documentElement.classList.contains('dark') ? '自動・深色中' : '自動・淺色中'
  return '淺色'
})

/* --------------------- 資料來源顯示（mock / firebase） --------------------- */
const dsMode = ref((ds.getMode && ds.getMode()) || 'mock')
function handleDsStorage(e){
  if (!e) return
  if (e.key === 'settings.datasource.mode'){
    const nv = e.newValue
    if (nv === 'mock' || nv === 'firebase') dsMode.value = nv
  }
}
onMounted(()=> window.addEventListener('storage', handleDsStorage))
onBeforeUnmount(()=> window.removeEventListener('storage', handleDsStorage))
const dataSourceLabel = computed(()=> dsMode.value === 'firebase' ? 'Firebase（雲端）' : 'Local（假資料）')

/* --------------------- 角色 / 標籤 --------------------- */
const roleLabel = computed(() => {
  const r = roleState?.role || 'Employee'
  if (r === 'Boss') return '老闆'
  if (r === 'Kitchen') return '中央廚房人員'
  const name = scope?.userName || ''
  return name.includes('店長') ? '店長' : '門市人員'
})

/* --------------------- 導航 --------------------- */
function isActive(name){
  const p = route.path || ''
  return p.startsWith(`/boss/${name}`)
}
function go(name){ router.push(`/boss/${name}`) }

const currentPageTitle = computed(() => {
  if (route.meta?.title) return route.meta.title
  const p = route.path || ''
  if (p.startsWith('/boss/inventory')) return '檢視店面庫存'
  if (p.startsWith('/boss/ingredients')) return '食材資料'
  if (p.startsWith('/boss/rolegroups')) return '群組權限'
  if (p.startsWith('/boss/stores')) return '店面管理'
  if (p.startsWith('/boss/thresholds')) return '警示門檻'
  if (p.startsWith('/boss/order-settings')) return '訂單設定'
  if (p.startsWith('/boss/invite')) return '生成邀請碼'
  if (p.startsWith('/boss/reports')) return '報表中心'
  return '管理後台'
})

/* --------------------- 功能按鈕 --------------------- */
function goSettings(){
  if (router.hasRoute && router.hasRoute('system-settings')) router.push({ name: 'system-settings' })
  else router.push('/settings')
}
function onLogout(){
  try { logout?.() } catch {}
  router.push({ name: 'login' })
}

/* --------------------- 對模板輸出（來自 useScope） --------------------- */
const brandName = computed(() => scope?.brandName || '餐易管')
const storeId   = computed(() => String(scope?.storeId || '—'))
const storeName = computed(() => scope?.storeName || '—')
const userName  = computed(() => scope?.userName || '—')
</script>

<style scoped>
/* === 主背景 / 色票（亮色預設） === */
.boss-shell {
  --bg-page: #f6f8fc;
  --bg-card: #ffffff;
  --bg-side: #ffffff;
  --bg-top: #ffffff;

  --border: #e5e7eb;
  --border-strong: #cbd5e1;

  --text-main: #1e293b;
  --text-sub: #64748b;
  --text-invert: #ffffff;

  --chip-bg: #f8fafc;
  --chip-border: #e2e8f0;
  --chip-text: #1e293b;

  --chip-bg-danger: #fee2e2;
  --chip-border-danger: #fecaca;
  --chip-text-danger: #b91c1c;

  background: var(--bg-page);
  color: var(--text-main);
  min-height: 100vh;

  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
  display: flex;
  flex-direction: column;
}

/* 當 <html> 有 .dark，這裡的變數整組覆蓋 */
.dark .boss-shell {
  --bg-page: #0f172a;
  --bg-card: #1e2535;
  --bg-side: #1e2535;
  --bg-top: #1e2535;

  --border: #2f3a4f;
  --border-strong: #475569;

  --text-main: #e2e8f0;
  --text-sub: #94a3b8;
  --text-invert: #0f172a;

  --chip-bg: #1e2535;
  --chip-border: #475569;
  --chip-text: #e2e8f0;

  --chip-bg-danger: #4b1f1f;
  --chip-border-danger: #7f1d1d;
  --chip-text-danger: #fecaca;
}

/* === 頂部列 === */
.topbar {
  background: var(--bg-top);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.05);

  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.dark .topbar { box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6); }

.brand { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
.avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: #eef2ff; border: 1px solid #c7d2fe;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 600; color: #1e3a8a;
}
.dark .avatar { background: #1e293b; border: 1px solid #475569; color: #e2e8f0; }

.brand-text { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.brand-title { font-weight: 600; font-size: 15px; color: var(--text-main); }
.brand-sub { font-size: 12px; color: var(--text-sub); white-space: nowrap; }

/* === 右上角操作區 === */
.actions{ display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }

/* 角色膠囊 */
.chip {
  border-radius: 8px; padding: 6px 8px; font-size: 12px; line-height: 1.2; font-weight: 500; white-space: nowrap;
  border: 1px solid var(--chip-border); background: var(--chip-bg); color: var(--chip-text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.role-chip {
  border: 1px solid #c7d2fe; background: #eef2ff; color: #1e3a8a; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.dark .role-chip { border: 1px solid #6366f1; background: #312e81; color: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6); }

/* 小按鈕（包含⚙與登出） */
.chip-btn {
  border-radius: 8px; font-size: 13px; line-height: 1.2; min-height: 32px; padding: 6px 10px;
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  background: var(--chip-bg); color: var(--chip-text); border: 1px solid var(--chip-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.chip-btn.icon-only { width: 32px; padding: 0; font-size: 14px; font-weight: 600; }
.chip-btn.danger { background: var(--chip-bg-danger); border-color: var(--chip-border-danger); color: var(--chip-text-danger); font-weight: 500; }
.chip-btn.ghost { background: var(--bg-top); }
.chip-btn:hover { filter: brightness(0.97); }

/* 鈴鐺紅點 */
.bell-btn { position: relative; }
.bell-btn .dot{
  position: absolute; top: -2px; right: -2px; width: 9px; height: 9px;
  background: #ef4444; border: 2px solid var(--bg-top); border-radius: 999px;
}

/* 通知面板 */
.notif-popover{
  position: absolute;
  right: 88px;
  top: 66px;
  width: 480px;
  max-width: calc(100vw - 24px);
  z-index: 60;

  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0,0,0,.12);
  overflow: hidden;
}
.dark .notif-popover{ box-shadow: 0 28px 80px rgba(0,0,0,.9); }
.np-head{ padding: 12px 14px; border-bottom: 1px solid var(--border); background: linear-gradient(to bottom, rgba(0,0,0,.02), transparent); }
.np-title{ font-size: 14px; font-weight: 700; }
.np-sub{ font-size: 12px; color: var(--text-sub); }

.np-list{ max-height: 52vh; overflow:auto; padding: 8px 10px 2px; }
.np-group{ margin-bottom: 10px; }

/* 群組標題（可收放） */
.np-group-head.as-button{
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  width:100%; padding: 6px 8px; background:none; border:none; cursor:pointer; text-align:left;
  color: var(--text-main); font-weight:600; border-radius:10px;
}
.np-group-head.as-button:hover{ background:rgba(0,0,0,.03); }
.dark .np-group-head.as-button:hover{ background:rgba(255,255,255,.05); }

.np-group-title{ font-size:13px; font-weight:700; color: var(--text-main); }
.np-group-badge{ font-size:11px; padding: 2px 6px; border:1px solid var(--border); border-radius: 999px; color: var(--text-sub); }
.arrow{ transition: transform .2s ease; }
.arrow.open{ transform: rotate(180deg); }

/* 群組內容容器 */
.np-items{ display:flex; flex-direction:column; gap:8px; }

/* 通知卡（可點） */
.np-item{
  border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card);
  padding: 8px 10px; box-shadow: 0 2px 6px rgba(0,0,0,.03); width:100%; text-align:left;
}
.as-button{ cursor:pointer; }
.as-button:hover{ background:rgba(0,0,0,.02); }
.dark .as-button:hover{ background:rgba(255,255,255,.04); }

.np-item-main{ display:flex; align-items:center; gap:8px; }
.np-item-text{ font-size:13px; color: var(--text-main); }
.np-item-sub{ display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
.np-sub-chip{ font-size:11px; color: var(--text-sub); border:1px solid var(--border); border-radius:999px; padding:2px 6px; }

.np-empty{ padding: 28px 16px; text-align:center; color: var(--text-sub); }
.np-empty .ico{ font-size:24px; margin-bottom:6px; }

.np-foot{
  padding: 10px 12px; border-top: 1px solid var(--border); background: var(--bg-card);
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

/* 動畫 */
.fade-enter-active,.fade-leave-active{ transition: opacity .15s ease; }
.fade-enter-from,.fade-leave-to{ opacity:0; }

/* Accordion 動畫 */
.accordion-enter-active,
.accordion-leave-active {
  transition: max-height .25s ease, opacity .2s ease;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
.accordion-enter-to,
.accordion-leave-from {
  max-height: 500px; /* 足夠顯示清單 */
  opacity: 1;
}

/* === 主體兩欄 === */
.body {
  flex: 1; min-height: 0; display: grid; grid-template-columns: 280px 1fr; background: var(--bg-page);
}

/* 側欄 */
.sidebar {
  background: var(--bg-side); border-right: 1px solid var(--border); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.04);
  padding: 16px 16px 24px; display: flex; flex-direction: column; gap: 16px; min-height: calc(100vh - 72px);
}
.dark .sidebar { box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8); }

/* 側欄最上面的卡片 */
.store-card {
  background: var(--bg-side); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
  padding: 12px 14px; line-height: 1.4;
}
.store-line.title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.store-line.main { font-size: 13px; font-weight: 500; }
.store-line.sub { font-size: 12px; color: var(--text-sub); }

/* 側欄按鈕群 */
.nav-list { display: flex; flex-direction: column; gap: 10px; }
.nav-item {
  width: 100%; text-align: left; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-side); color: var(--text-main);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03); padding: 12px 14px; cursor: pointer; transition: 0.15s;
}
.nav-item:hover { background: rgba(0, 0, 0, 0.02); box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06); transform: translateY(-1px); }
.dark .nav-item { box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7); }
.dark .nav-item:hover { background: rgba(255, 255, 255, 0.04); box-shadow: 0 6px 14px rgba(0, 0, 0, 0.9); }

/* active 狀態 */
.nav-item.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15), 0 8px 20px rgba(0, 0, 0, 0.06);
  background: linear-gradient(to bottom right, #f8faff 0%, #ffffff 60%);
}
.dark .nav-item.active {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.25), 0 12px 30px rgba(0, 0, 0, 0.8);
  background: linear-gradient(to bottom right, #1e2535 0%, #1e293b 60%);
}

/* 右側內容區 */
.content-pane { display: flex; flex-direction: column; min-width: 0; padding: 16px 20px 40px; }

/* 頁面頂部資訊列 */
.page-head {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.02) 100%);
  border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.04); padding: 16px;
}
.dark .page-head {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 60%);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}
.page-title { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }

.page-chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.mini-chip {
  border-radius: 8px; border: 1px solid var(--border); background: var(--bg-side); color: var(--text-main);
  font-size: 12px; line-height: 1.2; padding: 6px 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.dark .mini-chip { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8); }

/* 主要內容卡片 */
.content-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.04);
  padding: 16px; min-height: 360px; min-width: 0;
}
.dark .content-card { box-shadow: 0 24px 48px rgba(0, 0, 0, 0.9); }

/* RWD: 小螢幕時側欄收成上方區塊 */
@media (max-width: 1024px) {
  .body { grid-template-columns: 100%; }
  .sidebar { border-right: none; border-bottom: 1px solid var(--border); min-height: auto; }

  .notif-popover{
    right: 16px;
    top: 72px;
    width: calc(100vw - 32px);
  }
}
</style>
