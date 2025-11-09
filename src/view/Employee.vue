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
import seed from '@/seed/seedData' // 👉 假資料後備來源

// 路由/登入/範圍/權限
const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const scope = useScope()
const perm = usePerm()
perm.ensureLoaded?.() // 若有定義則呼叫

/* =========================
 * 假資料載入作為顯示層 fallback（不覆寫全域 store）
 * ========================= */
const seedRef = ref(seed()) // 一份只讀副本

/* =========================
 * 資料來源標籤（支持跨頁同步）
 * ========================= */
const dsMode = ref((ds.getMode && ds.getMode()) || localStorage.getItem('settings.datasource.mode') || 'mock')
function onDsStorage(e){
  if (e && e.key === 'settings.datasource.mode') {
    const v = e.newValue
    if (v === 'mock' || v === 'firebase') dsMode.value = v
  }
}
const runtimeLabel = computed(() => dsMode.value === 'firebase' ? 'Firebase' : 'Local（假資料）')

/* =========================
 * 從 scope 或 seed 推導品牌/門市/使用者顯示用資訊（只顯示，不改 store）
 * ========================= */
const storeId = computed(() => {
  return scope.storeId || seedRef.value.settings?.store?.defaultStoreId || 'hn-taipei'
})
const storeObj = computed(() => seedRef.value.stores.find(s => s.id === storeId.value) || { id: 's1', name: '某某餐飲-1號' })
const storeName = computed(() => scope.storeName || storeObj.value.name)
const brandTitle = computed(() => scope.brandName || '海南雞 餐飲')

// 使用者名稱：優先 scope.userName，否則從 seed 找同門市的一位使用者顯示
const userName = computed(() => {
  if (scope.userName) return scope.userName
  const u = seedRef.value.users.find(u => u.storeId === storeId.value) || seedRef.value.users[0]
  return u?.name || '員工'
})

/* =========================
 * 權限與角色顯示（店長 / 門市人員）
 * ========================= */
function can(key){
  try{
    if (typeof perm?.can === 'function') return !!perm.can(key)
    return !!perm?.perms?.[key]
  }catch{
    return false
  }
}
const roleLabel = computed(() => (perm?.isManager ? '店長' : '門市人員'))

/* =========================
 * 主題處理：localStorage.theme -> 'light' / 'dark'
 * ========================= */
const theme = ref('light')
function updateThemeFromLocal(){
  const t = localStorage.getItem('theme')
  theme.value = t === 'dark' ? 'dark' : 'light'
}
function onStorage(e){
  if (!e) return
  if (e.key === 'theme') updateThemeFromLocal()
  onDsStorage(e) // 同步監聽資料來源切換
}
onMounted(() => {
  updateThemeFromLocal()
  window.addEventListener('storage', onStorage)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
})
const themeClass = computed(() => (theme.value === 'dark' ? 'dark' : ''))
const themeLabel = computed(() => (theme.value === 'dark' ? '深色' : '淺色'))

/* =========================
 * 導航
 * ========================= */
function isActive(name){ return route.name === name }
function goNamed(name){ router.push({ name }) }
function clickProtected(name, permissionKey){
  if (can(permissionKey)) goNamed(name)
  // 無權限：保留靜默不導頁；若要提示可在此加上 toast
}
const fallbackTitle = computed(() => {
  if (isActive('emp-inventory')) return '門市庫存'
  if (isActive('emp-orders'))    return '訂單情況'
  if (isActive('emp-reports'))   return '檢視報表'
  if (isActive('emp-delivery'))  return '配送情況'
  return '門市作業'
})

function goSettings(){
  if (router.hasRoute('system-settings')){
    router.push({ name:'system-settings' })
  } else {
    router.push('/settings')
  }
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
  box-shadow:0 12px 32px rgba(0,0,0,.04); padding:16px;
}
.emp-shell.dark .page-head{
  background:linear-gradient(to bottom,rgba(255,255,255,.03) 0%,rgba(0,0,0,0) 60%);
  box-shadow:0 20px 40px rgba(0,0,0,.8);
}
.page-title{ font-size:18px; font-weight:600; color:var(--text-main); line-height:1.3; display:flex; align-items:center; gap:8px; }

.page-chips{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.mini-chip{
  border-radius:8px; border:1px solid var(--border); background:var(--bg-side);
  color:var(--text-main); font-size:12px; line-height:1.2; padding:6px 8px; box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.emp-shell.dark .mini-chip{ box-shadow:0 2px 8px rgba(0,0,0,.8); }
.mini-chip.ghost{ background:var(--bg-side); }

/* 主內容卡片 */
.content-card{
  background:var(--bg-card); border:1px solid var(--border); border-radius:12px;
  box-shadow:0 12px 32px rgba(0,0,0,.04); padding:16px; min-height:360px; min-width:0; color:var(--text-main);
}
.emp-shell.dark .content-card{ box-shadow:0 24px 48px rgba(0,0,0,.9); }

/* RWD */
@media (max-width:1024px){
  .body{ grid-template-columns:100%; }
  .sidebar{ border-right:none; border-bottom:1px solid var(--border); min-height:auto; }
}
</style>
