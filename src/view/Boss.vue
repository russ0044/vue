<template>
  <div class="boss-shell">
    <!-- 頂部列 -->
    <header class="topbar">
      <!-- 左：品牌 / 門市資訊 -->
      <div class="brand">
        <div class="avatar">🏪</div>
        <div class="brand-text">
          <div class="brand-title">某某餐飲店</div>
          <div class="brand-sub">ID: 123456789</div>
        </div>
      </div>

      <!-- 右：操作區 -->
      <div class="actions">
        <!-- 系統設定（只有圖示） -->
        <button
          class="chip-btn ghost icon-only"
          @click="goSettings"
          title="系統設定"
          aria-label="系統設定"
        >⚙</button>

        <!-- 角色標籤 -->
        <RoleBadge />

        <!-- 登出 -->
        <button class="chip-btn danger" @click="onLogout">登出</button>
      </div>
    </header>

    <div class="body">
      <!-- 側欄 -->
      <aside class="sidebar">
        <!-- 公司 / 使用者卡片 -->
        <div class="store-card">
          <div class="store-line title">某某餐飲店</div>
          <div class="store-line main">門市：某某餐飲-1號</div>
          <div class="store-line sub">使用者：老闆</div>
        </div>

        <!-- 功能清單 -->
        <nav class="nav-list">
          <button
            :class="['nav-item', isActive('inventory')]"
            @click="go('inventory')"
          >
            <div class="nav-head">
              <div class="nav-title">檢視店面庫存</div>
            </div>
            <div class="nav-desc">即時庫存 / 效期 / 低庫存警示</div>
          </button>

          <button
            :class="['nav-item', isActive('ingredients')]"
            @click="go('ingredients')"
          >
            <div class="nav-head">
              <div class="nav-title">食材資料</div>
            </div>
            <div class="nav-desc">品項與單位 / 採購基準</div>
          </button>

          <button
            :class="['nav-item', isActive('rolegroups')]"
            @click="go('rolegroups')"
          >
            <div class="nav-head">
              <div class="nav-title">群組權限</div>
            </div>
            <div class="nav-desc">角色 / 權限分配 / 安全</div>
          </button>

          <button
            :class="['nav-item', isActive('stores')]"
            @click="go('stores')"
          >
            <div class="nav-head">
              <div class="nav-title">店面管理</div>
            </div>
            <div class="nav-desc">門市資料 / 中央廚房</div>
          </button>

          <button
            :class="['nav-item', isActive('thresholds')]"
            @click="go('thresholds')"
          >
            <div class="nav-head">
              <div class="nav-title">警示門檻</div>
            </div>
            <div class="nav-desc">低庫存 / 安全庫存線</div>
          </button>

          <button
            :class="['nav-item', isActive('order-settings')]"
            @click="go('order-settings')"
          >
            <div class="nav-head">
              <div class="nav-title">訂單設定</div>
            </div>
            <div class="nav-desc">請貨流程 / 審核規則</div>
          </button>

          <button
            :class="['nav-item', isActive('invite')]"
            @click="go('invite')"
          >
            <div class="nav-head">
              <div class="nav-title">生成邀請碼</div>
            </div>
            <div class="nav-desc">加入店員 / 中央廚房人員</div>
          </button>

          <button
            :class="['nav-item', isActive('reports')]"
            @click="go('reports')"
          >
            <div class="nav-head">
              <div class="nav-title">報表中心</div>
            </div>
            <div class="nav-desc">銷量 / 耗材 / 趨勢</div>
          </button>
        </nav>
      </aside>

      <!-- 右側主內容 -->
      <main class="content-pane">
        <!-- 頁面頭 -->
        <header class="page-head">
          <div class="page-title">
            {{ currentPageTitle }}
          </div>

          <div class="page-chips">
            <span class="mini-chip ghost">
              管理者
            </span>
            <span class="mini-chip ghost">
              {{ themeLabel }}
            </span>
            <span class="mini-chip ghost">
              Local（假資料）
            </span>
          </div>
        </header>

        <!-- 內容卡片 -->
        <section class="content-card">
          <router-view />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import RoleBadge from '@/components/RoleBadge.vue'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()

// █ 主題處理：讀 localStorage.theme，並把 .dark 掛到 <html>
const theme = computed(() => {
  const t = localStorage.getItem('theme') || 'light' // 你的系統設定頁應該會存 'light' / 'dark'
  return t === 'dark' ? 'dark' : 'light'
})
const themeLabel = computed(() => theme.value === 'dark' ? '深色主題' : '淺色主題')

function applyThemeClass(){
  const rootEl = document.documentElement // <html>
  if (theme.value === 'dark') {
    rootEl.classList.add('dark')
  } else {
    rootEl.classList.remove('dark')
  }
}

// 第一次載入時同步
onMounted(() => {
  applyThemeClass()
})

// 如果 localStorage.theme 之後被改了（例如你在其他頁切主題然後回來）
// 這邊可以額外監聽 storage event 或用輪詢。最簡單：每次進頁面時都會 onMounted 執行一次。
// 如果你要即時同步，也可以加：
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') applyThemeClass()
})

// █ 目前在哪一個 /boss/... 子頁
const currentKey = computed(() => route.path.split('/').pop() || '')

function go(name){
  router.push(`/boss/${name}`)
}

function isActive(name){
  return currentKey.value === name ? 'active' : ''
}

const currentPageTitle = computed(()=>{
  return route.meta?.title
    || ({
      inventory:'檢視店面庫存',
      ingredients:'食材資料',
      rolegroups:'群組權限',
      stores:'店面管理',
      thresholds:'警示門檻',
      'order-settings':'訂單設定',
      invite:'生成邀請碼',
      reports:'報表中心'
    }[currentKey.value] || '管理後台')
})

function goSettings(){
  router.push('/settings')
}
function onLogout(){
  logout()
  router.push('/login')
}
</script>

<style scoped>
/* -------------------------------------------------
   淺色主題（預設）
   用 CSS 變數統一控制
------------------------------------------------- */
.boss-shell{
  --bg-page:#f6f8fc;
  --bg-card:#ffffff;
  --bg-side:#ffffff;
  --bg-top:#ffffff;

  --border:#e5e7eb;
  --border-strong:#cbd5e1;

  --text-main:#1e293b;
  --text-sub:#64748b;
  --text-invert:#ffffff;

  background:var(--bg-page);
  color:var(--text-main);
  min-height:100vh;
  font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;
  display:flex;
  flex-direction:column;
}

/* -------------------------------------------------
   深色主題（當 <html class="dark"> 時）
   注意：選擇器用 .dark .boss-shell
   這樣不會影響其他頁面沒改到的地方
------------------------------------------------- */
.dark .boss-shell{
  --bg-page:#0f172a;
  --bg-card:#1e2535;
  --bg-side:#1e2535;
  --bg-top:#1e2535;

  --border:#334155;
  --border-strong:#475569;

  --text-main:#e2e8f0;
  --text-sub:#94a3b8;
  --text-invert:#0f172a;
}

/* ===== 頂部列 ===== */
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
  color:var(--text-main);
}
.dark .topbar{
  box-shadow:0 10px 24px rgba(0,0,0,.6);
}

.brand{
  display:flex;
  align-items:flex-start;
  gap:12px;
  min-width:0;
  color:var(--text-main);
}
.avatar{
  width:42px;
  height:42px;
  border-radius:50%;
  background:#eef2ff;
  border:1px solid #c7d2fe;
  box-shadow:0 2px 4px rgba(0,0,0,.05);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:18px;
  line-height:1;
  font-weight:600;
  color:#1e3a8a;
}
.dark .avatar{
  background:#1e293b;
  border:1px solid #475569;
  box-shadow:0 2px 4px rgba(0,0,0,.6);
  color:#c7d2fe;
}

.brand-text{
  display:flex;
  flex-direction:column;
  line-height:1.3;
  min-width:0;
}
.brand-title{
  font-weight:600;
  font-size:15px;
  color:var(--text-main);
}
.brand-sub{
  font-size:12px;
  color:var(--text-sub);
  white-space:nowrap;
}

/* ===== 右上角小按鈕列 ===== */
.actions{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:10px;
}

.chip-btn{
  border-radius:8px;
  font-size:13px;
  line-height:1.2;
  min-height:32px;
  padding:6px 10px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  background:var(--bg-top);
  border:1px solid var(--border);
  box-shadow:0 2px 4px rgba(0,0,0,.03);
  color:var(--text-main);
}
.dark .chip-btn{
  box-shadow:0 2px 4px rgba(0,0,0,.6);
}

.chip-btn.icon-only{
  width:32px;
  padding:0;
  font-size:14px;
  font-weight:600;
}

.chip-btn.danger{
  background:#fee2e2;
  border-color:#fecaca;
  color:#b91c1c;
  font-weight:500;
}
.chip-btn.danger:hover{
  filter:brightness(.97);
}

/* 暗色時 danger 按鈕看起來太亮，稍微壓一點 */
.dark .chip-btn.danger{
  background:#7f1d1d;
  border-color:#991b1b;
  color:#fff;
  box-shadow:0 2px 6px rgba(0,0,0,.8);
}

/* ===== 主體兩欄 ===== */
.body{
  flex:1;
  min-height:0;
  display:grid;
  grid-template-columns:280px 1fr;
  background:var(--bg-page);
  color:var(--text-main);
}

/* ===== 側欄 ===== */
.sidebar{
  background:var(--bg-side);
  border-right:1px solid var(--border);
  box-shadow:0 16px 40px rgba(0,0,0,.04);
  padding:16px 16px 24px;
  display:flex;
  flex-direction:column;
  gap:16px;
  min-height:calc(100vh - 72px);
  color:var(--text-main);
}
.dark .sidebar{
  box-shadow:0 16px 40px rgba(0,0,0,.8);
}

/* 門市卡 */
.store-card{
  background:var(--bg-side);
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 8px 20px rgba(0,0,0,.03);
  padding:12px 14px;
  line-height:1.4;
  color:var(--text-main);
}
.dark .store-card{
  box-shadow:0 8px 20px rgba(0,0,0,.7);
}

.store-line.title{
  font-size:14px;
  font-weight:600;
  color:var(--text-main);
  margin-bottom:4px;
}
.store-line.main{
  font-size:13px;
  font-weight:500;
  color:var(--text-main);
}
.store-line.sub{
  font-size:12px;
  color:var(--text-sub);
}

/* 功能按鈕群 */
.nav-list{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.nav-item{
  width:100%;
  text-align:left;
  border-radius:12px;
  border:1px solid var(--border);
  background:var(--bg-side);
  color:var(--text-main);
  box-shadow:0 2px 6px rgba(0,0,0,.03);
  padding:12px 14px;
  transition:.15s;
  cursor:pointer;
}
.nav-item:hover{
  background:rgba(0,0,0,.02);
  box-shadow:0 6px 14px rgba(0,0,0,.06);
  transform:translateY(-1px);
}
.dark .nav-item{
  box-shadow:0 2px 6px rgba(0,0,0,.7);
}
.dark .nav-item:hover{
  background:rgba(255,255,255,.04);
  box-shadow:0 6px 14px rgba(0,0,0,.9);
}

.nav-item.active{
  border-color:#2563eb;
  box-shadow:
    0 0 0 3px rgba(37,99,235,.15),
    0 8px 20px rgba(0,0,0,.06);
  background:linear-gradient(to bottom right,#f8faff 0%,#ffffff 60%);
}
.dark .nav-item.active{
  background:linear-gradient(
    to bottom right,
    rgba(37,99,235,.16) 0%,
    rgba(15,23,42,0) 60%
  );
  box-shadow:
    0 0 0 3px rgba(37,99,235,.4),
    0 8px 20px rgba(0,0,0,.9);
}

.nav-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.nav-title{
  font-size:14px;
  font-weight:600;
  color:var(--text-main);
  display:flex;
  align-items:center;
  gap:4px;
}
.nav-desc{
  font-size:12px;
  line-height:1.3;
  color:var(--text-sub);
  margin-top:4px;
}

/* ===== 右側內容區 ===== */
.content-pane{
  display:flex;
  flex-direction:column;
  min-width:0;
  padding:16px 20px 40px;
  color:var(--text-main);
}

/* 頁面頭卡片 */
.page-head{
  display:flex;
  flex-wrap:wrap;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
  margin-bottom:16px;

  background:linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,.02) 100%
  );
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 12px 32px rgba(0,0,0,.04);
  padding:16px;
  color:var(--text-main);
}
.dark .page-head{
  background:linear-gradient(
    to bottom,
    rgba(255,255,255,.03) 0%,
    rgba(0,0,0,0) 100%
  );
  box-shadow:0 12px 32px rgba(0,0,0,.8);
}

.page-title{
  font-size:18px;
  font-weight:600;
  color:var(--text-main);
  line-height:1.3;
  display:flex;
  align-items:center;
  gap:8px;
}

.page-chips{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}

.mini-chip{
  border-radius:8px;
  border:1px solid var(--border);
  background:var(--bg-side);
  color:var(--text-main);
  font-size:12px;
  line-height:1.2;
  padding:6px 8px;
  box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.dark .mini-chip{
  box-shadow:0 2px 4px rgba(0,0,0,.7);
}
.mini-chip.ghost{
  background:var(--bg-side);
}

/* 右側主卡片 */
.content-card{
  background:var(--bg-card);
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 12px 32px rgba(0,0,0,.04);
  padding:16px;
  min-height:360px;
  min-width:0;
  color:var(--text-main);
}
.dark .content-card{
  box-shadow:0 12px 32px rgba(0,0,0,.8);
}

/* RWD */
@media (max-width:1024px){
  .body{
    grid-template-columns:100%;
  }
  .sidebar{
    border-right:none;
    border-bottom:1px solid var(--border);
    min-height:auto;
  }
}
</style>
