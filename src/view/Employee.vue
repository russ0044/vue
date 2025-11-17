<template>
  <!-- 根容器會依主題套 class: emp-shell 或 emp-shell dark -->
  <div :class="['emp-shell', themeClass]">
    <!-- 頂部列 -->
    <header class="topbar">
      <!-- 左側品牌資訊 -->
      <div class="brand">
        <div class="avatar">🏪</div>
        <div class="brand-text">
          <div class="brand-title">{{ brandTitle }}</div>
          <div class="brand-sub">
            門市：{{ storeName }}
            <span class="store-id">({{ storeId }})</span>
          </div>
        </div>
      </div>

      <!-- 右側 chips / 按鈕 -->
      <div class="actions">
        <!-- 通知鈴鐺（含小紅點） -->
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

        <!-- 系統設定：只有圖示 -->
        <button
          class="chip-btn ghost icon-only"
          @click="goSettings"
          title="系統設定"
          aria-label="系統設定"
        >⚙</button>

        <!-- 身分 / 角色：依權限推斷（店長 / 門市人員） -->
        <span class="chip role-chip">
          {{ roleLabel }}
        </span>

        <!-- 登出 -->
        <button class="chip-btn danger" @click="onLogout">登出</button>
      </div>
    </header>

    <!-- 通知面板（含群組收放） -->
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
            {{ roleLabel }}・{{ runtimeLabel }}・{{ todayStr }}
          </div>
        </div>

        <div v-if="alerts.length" class="np-list">
          <div
            v-for="(g, gi) in groupedAlerts"
            :key="g.key || gi"
            class="np-group"
          >
            <!-- 群組標題：可收放 -->
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

            <!-- 群組內容：收放 + 動畫 -->
            <transition name="accordion">
              <div
                v-show="openGroups.has(g.key)"
                class="np-items"
                :id="`grp-${g.key}`"
              >
                <!-- 可點擊導頁 -->
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

    <div class="body">
      <!-- 側邊欄 -->
      <aside class="sidebar">
        <!-- 門市卡片（若 scope 缺值，會自動用 seed fallback） -->
        <div class="store-card">
          <div class="store-line title">{{ brandTitle }}</div>
          <div class="store-line main">門市：{{ storeName }}</div>
          <div class="store-line sub">使用者：{{ userName }}</div>
        </div>

        <!-- 功能清單 -->
        <nav class="nav-list">
          <!-- 門市庫存 -->
          <button
            class="nav-item"
            :class="['clickable', isActive('emp-inventory') && 'active']"
            @click="goNamed('emp-inventory')"
          >
            <div class="nav-head">
              <div class="nav-title">門市庫存</div>
            </div>
            <div class="nav-desc">即時庫存 / 效期 / 低庫存警示</div>
          </button>

          <!-- 訂單情況 -->
          <button
            class="nav-item"
            :class="[can('orders.view') ? 'clickable' : 'locked', isActive('emp-orders') && 'active']"
            :disabled="!can('orders.view')"
            @click="clickProtected('emp-orders','orders.view')"
          >
            <div class="nav-head">
              <div class="nav-title">
                訂單情況
                <span v-if="!can('orders.view')" class="lock">🔒</span>
              </div>
            </div>
            <div class="nav-desc">需求單 / 準備進度 / 缺料</div>
          </button>

          <!-- 檢視報表（店長可見） -->
          <button
            class="nav-item"
            :class="[can('reports.view') ? 'clickable' : 'locked', isActive('emp-reports') && 'active']"
            :disabled="!can('reports.view')"
            @click="clickProtected('emp-reports','reports.view')"
          >
            <div class="nav-head">
              <div class="nav-title">
                檢視報表
                <span v-if="!can('reports.view')" class="lock">🔒</span>
              </div>
            </div>
            <div class="nav-desc">銷量 / 耗材用量 / 趨勢</div>
          </button>

          <!-- 配送情況 -->
          <button
            class="nav-item"
            :class="[can('delivery.view') ? 'clickable' : 'locked', isActive('emp-delivery') && 'active']"
            :disabled="!can('delivery.view')"
            @click="clickProtected('emp-delivery','delivery.view')"
          >
            <div class="nav-head">
              <div class="nav-title">
                配送情況
                <span v-if="!can('delivery.view')" class="lock">🔒</span>
              </div>
            </div>
            <div class="nav-desc">車次進度 / 到貨狀態</div>
          </button>
        </nav>
      </aside>

      <!-- 右側主內容 -->
      <main class="content-pane">
        <!-- 區塊標題列 -->
        <header class="page-head">
          <div class="page-title">
            {{ route.meta?.title || fallbackTitle }}
          </div>

          <!-- 狀態 chips（角色 / 主題 / 資料來源） -->
          <div class="page-chips">
            <span class="mini-chip ghost">
              {{ roleLabel }}
            </span>
            <span class="mini-chip ghost">
              {{ themeLabel }}
            </span>
            <span class="mini-chip ghost">
              {{ runtimeLabel }}
            </span>
          </div>
        </header>

        <!-- 子頁內容 -->
        <section class="content-card">
          <RouterView />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useScope } from '@/store/scope'
import { usePerm } from '@/store/perm'
import * as ds from '@/store/datasource'
import seed from '@/seed/seedData'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const scope = useScope()
const perm = usePerm()
perm.ensureLoaded?.()

/* 假資料做顯示 fallback */
const seedRef = ref(seed())

/* 資料來源標籤 */
const dsMode = ref((ds.getMode && ds.getMode()) || localStorage.getItem('settings.datasource.mode') || 'mock')
function onDsStorage(e){
  if (e && e.key === 'settings.datasource.mode') {
    const v = e.newValue
    if (v === 'mock' || v === 'firebase') dsMode.value = v
  }
}
const runtimeLabel = computed(() => dsMode.value === 'firebase' ? 'Firebase' : 'Local（假資料）')

/* 顯示資訊（優先 scope，否則 seed） */
const storeId = computed(() => scope.storeId || seedRef.value.settings?.store?.defaultStoreId || 'hn-taipei')
const storeObj = computed(() => seedRef.value.stores.find(s => s.id === storeId.value) || { id: 's1', name: '某某餐飲-1號' })
const storeName = computed(() => scope.storeName || storeObj.value.name)
const brandTitle = computed(() => scope.brandName || '海南雞 餐飲')
const userName = computed(() => {
  if (scope.userName) return scope.userName
  const u = seedRef.value.users.find(u => u.storeId === storeId.value) || seedRef.value.users[0]
  return u?.name || '員工'
})

/* 權限與角色顯示 */
function can(key){
  try{
    if (typeof perm?.can === 'function') return !!perm.can(key)
    return !!perm?.perms?.[key]
  }catch{ return false }
}
const roleLabel = computed(() => (perm?.isManager ? '店長' : '門市人員'))

/* 主題處理 */
const theme = ref('light')
function updateThemeFromLocal(){ theme.value = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light' }
function onStorage(e){
  if (!e) return
  if (e.key === 'theme') updateThemeFromLocal()
  onDsStorage(e)
}
onMounted(()=>{ updateThemeFromLocal(); window.addEventListener('storage', onStorage) })
onBeforeUnmount(()=> window.removeEventListener('storage', onStorage))
const themeClass = computed(() => (theme.value === 'dark' ? 'dark' : ''))
const themeLabel = computed(() => (theme.value === 'dark' ? '深色' : '淺色'))

/* ===== 通知中心 ===== */
const bellOpen = ref(false)
const bellBtnRef = ref(null)
const popoverRef = ref(null)
const todayStr = computed(() => new Date().toISOString().slice(0,10))
const READ_KEY = 'notif-read-emp'
const ACCORDION_KEY = 'notif-accordion-open-groups-emp'

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
})
onBeforeUnmount(()=>{
  document.removeEventListener('click', onDocClick, { capture:true })
  document.removeEventListener('keydown', onKey)
})

/** 依「目前門市」彙整通知，並附上導頁資訊 target:{ name, query } */
const alerts = computed(()=>{
  const s = seedRef.value || {}
  const sid = storeId.value
  const list = []
  const productsMap = new Map((s.products||[]).map(p=>[p.id,p]))

  // 1) 低庫存 / 到期 -> emp-inventory
  for (const it of (s.inventory||[]).filter(x=>x.storeId===sid)){
    const p = productsMap.get(it.sku)
    if (!p) continue
    if (typeof p.safeStock==='number' && typeof it.qty==='number' && it.qty < p.safeStock){
      list.push({
        id:`low-${sid}-${it.sku}`,
        level:'warn',
        text:`${it.name} 低於安全量（${it.qty}/${p.safeStock}）`,
        date: todayStr.value,
        target:{ name:'emp-inventory', query:{ sku: it.sku } }
      })
    }
    if (it.exp && it.exp <= todayStr.value){
      list.push({
        id:`exp-${sid}-${it.sku}`,
        level:'info',
        text:`${it.name} 已過期或今日到期（${it.exp}）`,
        date: it.exp,
        target:{ name:'emp-inventory', query:{ sku: it.sku, exp: it.exp } }
      })
    }
  }

  // 2) 今日配送 -> emp-delivery
  for (const d of (s.empDeliveries||[])){
    if (d.storeId===sid){
      list.push({
        id:`ed-${d.id}`, level:'info',
        text:`配送 ${d.date}：${d.items?.length||0} 項，狀態：${statusText(d.status)}`,
        date: d.date,
        target:{ name:'emp-delivery', query:{ date: d.date, id: d.id } }
      })
    }
  }
  for (const sch of (s.delivery?.schedule||[])){
    for (const stop of (sch.stops||[])){
      if (stop.storeId===sid){
        list.push({
          id:`sch-${sch.id}-${sid}`, level:'info',
          text:`${sch.date}｜${sch.routeName||'配送路線'}・車 ${sch.vehicle||''}・ETA ${stop.eta||''}`.trim(),
          date: sch.date,
          target:{ name:'emp-delivery', query:{ date: sch.date } }
        })
      }
    }
  }

  // 3) 請貨 / 訂單 -> emp-orders
  for (const r of (s.demo?.empRequests||[])){
    if (r.storeId===sid){
      list.push({
        id:`req-${r.id}`,
        level: r.status==='pending' ? 'warn' : 'info',
        text:`請貨單 ${r.id}（${r.items?.length||0} 項）狀態：${statusText(r.status)}`,
        date: r.date,
        target:{ name:'emp-orders', query:{ rid: r.id } }
      })
    }
  }
  for (const o of (s.demo?.empOrders||[])){
    if (o.storeId===sid){
      list.push({
        id:`ord-${o.id}`,
        level:'info',
        text:`訂單 ${o.id} 已建立（${o.items?.length||0} 項）`,
        date: o.date,
        target:{ name:'emp-orders', query:{ oid: o.id } }
      })
    }
  }

  const uniq = new Map()
  for (const a of list) uniq.set(a.id, a)
  return Array.from(uniq.values())
})

const hasUnread = computed(()=>{
  const read = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
  const readSet = new Set(read)
  return alerts.value.some(a => !readSet.has(a.id))
})
function markAllRead(){
  const ids = alerts.value.map(a=>a.id)
  localStorage.setItem(READ_KEY, JSON.stringify(ids))
}

/* 點通知 => 標已讀 + 導頁 + 關閉面板 */
function goAlert(a){
  // 標記已讀
  const read = new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'))
  read.add(a.id)
  localStorage.setItem(READ_KEY, JSON.stringify([...read]))

  // 導頁（安全降級：若 target 缺失就不導）
  if (a?.target?.name){
    router.push({ name:a.target.name, query:a.target.query || {} })
  }
  bellOpen.value = false
}

/** 輔助：狀態字眼統一 */
function statusText(s){
  if (s === 'preparing') return '準備中'
  if (s === 'shipping')  return '運送中'
  if (s === 'arrived')   return '已到店'
  if (s === 'pending')   return '待處理'
  if (s === 'submitted') return '已送出'
  if (s === 'delivered') return '已到貨'
  if (s === 'on_the_way')return '運送中'
  if (s === 'delayed')   return '延誤'
  return s || '—'
}

/* 依類別分組（庫存/配送/請貨） */
const groupedAlerts = computed(()=>{
  const g = { stock:[], delivery:[], request:[], other:[] }
  for (const a of alerts.value){
    const id = String(a.id)
    if (id.startsWith('low-') || id.startsWith('exp-')) g.stock.push(a)
    else if (id.startsWith('ed-') || id.startsWith('sch-')) g.delivery.push(a)
    else if (id.startsWith('req-') || id.startsWith('ord-')) g.request.push(a)
    else g.other.push(a)
  }
  const titleOf = k => k==='stock'?'庫存情況':k==='delivery'?'配送情況':k==='request'?'請貨／訂單':'其他'
  return Object.entries(g)
    .filter(([,arr])=>arr.length)
    .map(([k,arr])=>({ key:k, title:titleOf(k), items:arr }))
})

function levelText(l){
  if (l==='warn') return '注意'
  if (l==='error') return '警示'
  return '資訊'
}
function badgeClass(l){
  if (l==='warn') return 'badge-warn'
  if (l==='error') return 'badge-error'
  return 'badge-info'
}

/* ====== 群組收放狀態（會記住） ====== */
const openGroups = ref(new Set(['stock'])) // 預設展開庫存群組
function saveOpenGroups(){
  try { localStorage.setItem(ACCORDION_KEY, JSON.stringify([...openGroups.value])) } catch {}
}
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

/* ====== 導航 ====== */
function isActive(name){ return route.name === name }
function goNamed(name){ router.push({ name }) }
function clickProtected(name, permissionKey){
  if (can(permissionKey)) goNamed(name)
}
const fallbackTitle = computed(() => {
  if (isActive('emp-inventory')) return '門市庫存'
  if (isActive('emp-orders'))    return '訂單情況'
  if (isActive('emp-reports'))   return '檢視報表'
  if (isActive('emp-delivery'))  return '配送情況'
  return '門市作業'
})

function goSettings(){
  if (router.hasRoute('system-settings')) router.push({ name:'system-settings' })
  else router.push('/settings')
}
function onLogout(){
  try { logout?.() } catch {}
  if (router.currentRoute.value.name !== 'login'){
    router.replace({ name:'login' })
  }
}
</script>

<style scoped>
/* -------------------------------------------------
   基本色票（淺色主題）
------------------------------------------------- */
.emp-shell{
  --bg-page:#f6f8fc;
  --bg-card:#ffffff;
  --bg-side:#ffffff;
  --bg-top:#ffffff;

  --border:#e5e7eb;
  --border-strong:#cbd5e1;

  --text-main:#1e293b;
  --text-sub:#64748b;
  --text-invert:#ffffff;

  --chip-bg:#f8fafc;
  --chip-border:#e2e8f0;
  --chip-text:#1e293b;

  --chip-bg-danger:#fee2e2;
  --chip-border-danger:#fecaca;
  --chip-text-danger:#b91c1c;

  --table-head-bg:#0f172a;
  --table-head-text:#fff;

  background:var(--bg-page);
  color:var(--text-main);
  min-height:100vh;
  font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;
  display:flex;
  flex-direction:column;
}

/* 深色主題覆蓋 */
.emp-shell.dark{
  --bg-page:#0f172a;
  --bg-card:#1e2535;
  --bg-side:#1e2535;
  --bg-top:#1e2535;

  --border:#2f3a4f;
  --border-strong:#475569;

  --text-main:#e2e8f0;
  --text-sub:#94a3b8;
  --text-invert:#0f172a;

  --chip-bg:#1e2535;
  --chip-border:#475569;
  --chip-text:#e2e8f0;

  --chip-bg-danger:#4b1f1f;
  --chip-border-danger:#7f1d1d;
  --chip-text-danger:#fecaca;

  --table-head-bg:#0a0f1a;
  --table-head-text:#f8fafc;
}

/* -------------------------------------------------
   頂部列
------------------------------------------------- */
.topbar{
  background:var(--bg-top);
  border-bottom:1px solid var(--border);
  box-shadow:0 10px 24px rgba(0,0,0,.05);
  padding:16px 20px;
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  flex-wrap:wrap;
  gap:12px;
}

.brand{ display:flex; align-items:flex-start; gap:12px; min-width:0; }
.avatar{
  width:42px; height:42px; border-radius:50%;
  background:#eef2ff; border:1px solid #c7d2fe;
  box-shadow:0 2px 4px rgba(0,0,0,.05);
  display:flex; align-items:center; justify-content:center;
  font-size:18px; line-height:1; font-weight:600; color:#1e3a8a;
}
.emp-shell.dark .avatar{
  background:#1e293b; border:1px solid #475569; color:#e2e8f0;
}
.brand-text{ display:flex; flex-direction:column; line-height:1.3; min-width:0; }
.brand-title{ font-weight:600; font-size:15px; color:var(--text-main); }
.brand-sub{ font-size:12px; color:var(--text-sub); white-space:nowrap; }
.store-id{ color:var(--text-sub); font-size:12px; margin-left:4px; }

.actions{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; }

/* chip 樣式（右上角色 / 主題 / 登出等） */
.chip{
  border-radius:8px; padding:6px 8px; font-size:12px; line-height:1.2; font-weight:500; white-space:nowrap;
  border:1px solid var(--chip-border); background:var(--chip-bg); color:var(--chip-text);
  box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.role-chip{
  border:1px solid #c7d2fe; background:#eef2ff; color:#1e3a8a; box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.emp-shell.dark .role-chip{
  border:1px solid #6366f1; background:#312e81; color:#fff; box-shadow:0 2px 4px rgba(0,0,0,.6);
}

/* 小按鈕 chip-btn（設定 / 登出） */
.chip-btn{
  border-radius:8px; font-size:13px; line-height:1.2; min-height:32px;
  padding:6px 10px; display:inline-flex; align-items:center; justify-content:center;
  cursor:pointer; background:var(--chip-bg); color:var(--chip-text);
  border:1px solid var(--chip-border); box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.chip-btn.icon-only{ width:32px; padding:0; font-size:14px; font-weight:600; }
.chip-btn.danger{ background:var(--chip-bg-danger); border-color:var(--chip-border-danger); color:var(--chip-text-danger); font-weight:500; }
.chip-btn.ghost{ background:var(--bg-top); }
.chip-btn:hover{ filter:brightness(0.97); }

/* 鈴鐺小紅點 */
.bell-btn{ position:relative; }
.bell-btn .dot{
  position:absolute; top:-2px; right:-2px; width:9px; height:9px;
  background:#ef4444; border:2px solid var(--bg-top); border-radius:999px;
}

/* 通知面板 */
.notif-popover{
  position:absolute;
  right:88px;
  top:66px;
  width:460px;
  max-width:calc(100vw - 24px);
  z-index:60;

  background:var(--bg-card);
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 24px 60px rgba(0,0,0,.12);
  overflow:hidden;
}
.emp-shell.dark .notif-popover{ box-shadow:0 28px 80px rgba(0,0,0,.9); }
.np-head{ padding:12px 14px; border-bottom:1px solid var(--border); background:linear-gradient(to bottom, rgba(0,0,0,.02), transparent); }
.np-title{ font-size:14px; font-weight:700; }
.np-sub{ font-size:12px; color:var(--text-sub); }

.np-list{ max-height:52vh; overflow:auto; padding:8px 10px 2px; }
.np-group{ margin-bottom:10px; }
.np-group-head{ display:flex; align-items:center; gap:8px; padding:6px 8px; }
.np-group-title{ font-size:13px; font-weight:700; color: var(--text-main); }
.np-group-badge{ font-size:11px; padding:2px 6px; border:1px solid var(--border); border-radius:999px; color: var(--text-sub); }
.np-items{ display:flex; flex-direction:column; gap:8px; }

/* 可點擊的通知卡 */
.np-item{
  border:1px solid var(--border); border-radius:10px; background:var(--bg-card);
  padding:8px 10px; box-shadow:0 2px 6px rgba(0,0,0,.03);
  text-align:left; width:100%;
}
.as-button{ cursor:pointer; background:none; border:none; }
.as-button:hover{ background:rgba(0,0,0,.02); }
.emp-shell.dark .as-button:hover{ background:rgba(255,255,255,.04); }

.np-item-main{ display:flex; align-items:center; gap:8px; }
.np-item-text{ font-size:13px; color: var(--text-main); }
.np-item-sub{ display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
.np-sub-chip{ font-size:11px; color: var(--text-sub); border:1px solid var(--border); border-radius:999px; padding:2px 6px; }

.np-empty{ padding:28px 16px; text-align:center; color: var(--text-sub); }
.np-empty .ico{ font-size:24px; margin-bottom:6px; }

.np-foot{ padding:10px 12px; border-top:1px solid var(--border); background:var(--bg-card); display:flex; align-items:center; gap:8px; }

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
.emp-shell.dark .np-group-head.as-button:hover{ background:rgba(255,255,255,.05); }
.arrow{ transition: transform .2s ease; }
.arrow.open{ transform: rotate(180deg); }

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
  max-height: 500px;
  opacity: 1;
}

/* 動畫 */
.fade-enter-active,.fade-leave-active{ transition:opacity .15s ease; }
.fade-enter-from,.fade-leave-to{ opacity:0; }

/* -------------------------------------------------
   主體兩欄區
------------------------------------------------- */
.body{
  flex:1; min-height:0; display:grid; grid-template-columns:280px 1fr;
  background:var(--bg-page); color:var(--text-main);
}

/* 側邊欄 */
.sidebar{
  background:var(--bg-side); border-right:1px solid var(--border);
  box-shadow:0 16px 40px rgba(0,0,0,.04);
  padding:16px 16px 24px; display:flex; flex-direction:column; gap:16px;
  min-height:calc(100vh - 72px);
}

/* 門市資訊卡 */
.store-card{
  background:var(--bg-side); border:1px solid var(--border); border-radius:12px;
  box-shadow:0 8px 20px rgba(0,0,0,.03); padding:12px 14px; line-height:1.4;
}
.store-line.title{ font-size:14px; font-weight:600; color:var(--text-main); margin-bottom:4px; }
.store-line.main{ font-size:13px; font-weight:500; color:var(--text-main); }
.store-line.sub{ font-size:12px; color:var(--text-sub); }

/* 功能列表 */
.nav-list{ display:flex; flex-direction:column; gap:10px; }

/* 功能按鈕卡 */
.nav-item{
  width:100%; text-align:left; border-radius:12px; border:1px solid var(--border);
  background:var(--bg-side); color:var(--text-main);
  box-shadow:0 2px 6px rgba(0,0,0,.03);
  padding:12px 14px; cursor:default; transition:.15s;
}
.clickable{ cursor:pointer; }
.clickable:hover{ background:rgba(0,0,0,.02); box-shadow:0 6px 14px rgba(0,0,0,.06); transform:translateY(-1px); }
.emp-shell.dark .clickable:hover{ background:rgba(255,255,255,.04); box-shadow:0 8px 20px rgba(0,0,0,.8); }

/* 當前頁面 active 狀態 */
.active{
  border-color:#2563eb;
  box-shadow:0 0 0 3px rgba(37,99,235,.15),0 8px 20px rgba(0,0,0,.06);
  background:linear-gradient(to bottom right,#f8faff 0%,#ffffff 60%);
}
.emp-shell.dark .active{
  border-color:#60a5fa;
  box-shadow:0 0 0 3px rgba(96,165,250,.25),0 12px 30px rgba(0,0,0,.8);
  background:linear-gradient(to bottom right,#1e2535 0%,#1e293b 60%);
}

/* 沒權限 locked 狀態 */
.locked{ opacity:.6; cursor:not-allowed; filter:grayscale(.4); }
.lock{ font-size:12px; margin-left:4px; }

/* 文字區 */
.nav-head{ display:flex; align-items:center; justify-content:space-between; }
.nav-title{ font-size:14px; font-weight:600; color:var(--text-main); display:flex; align-items:center; }
.nav-desc{ font-size:12px; line-height:1.3; color:var(--text-sub); margin-top:4px; }

/* 右側主內容 */
.content-pane{ display:flex; flex-direction:column; min-width:0; padding:16px 20px 40px; color:var(--text-main); }

/* 頁面標題列 */
.page-head{
  display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px;
  background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.02) 100%);
  border:1px solid var(--border); border-radius:12px;
  box-shadow:0 12px 32px rgba(0,0,0,0.04); padding:16px;
}
.emp-shell.dark .page-head{
  background:linear-gradient(to bottom,rgba(255,255,255,.03) 0%,rgba(0,0,0,0) 60%);
  box-shadow:0 20px 40px rgba(0,0,0,0.8);
}
.page-title{ font-size:18px; font-weight:600; color:var(--text-main); line-height:1.3; display:flex; align-items:center; gap:8px; }

.page-chips{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.mini-chip{
  border-radius:8px; border:1px solid var(--border); background:var(--bg-side);
  color:var(--text-main); font-size:12px; line-height:1.2; padding:6px 8px; box-shadow:0 2px 4px rgba(0,0,0,0.03);
}
.emp-shell.dark .mini-chip{ box-shadow:0 2px 8px rgba(0,0,0,0.8); }
.mini-chip.ghost{ background:var(--bg-side); }

/* 主內容卡片 */
.content-card{
  background:var(--bg-card); border:1px solid var(--border); border-radius:12px;
  box-shadow:0 12px 32px rgba(0,0,0,0.04); padding:16px; min-height:360px; min-width:0; color:var(--text-main);
}
.emp-shell.dark .content-card{ box-shadow:0 24px 48px rgba(0,0,0,0.9); }

/* RWD */
@media (max-width:1024px){
  .body{ grid-template-columns:100%; }
  .sidebar{ border-right:none; border-bottom:1px solid var(--border); min-height:auto; }

  .notif-popover{
    right:16px;
    top:72px;
    width:calc(100vw - 32px);
  }
}
</style>
