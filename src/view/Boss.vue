<!-- src/components/BossShell.vue -->
<template>
  <div class="boss-shell">
    <!-- 頂部列 -->
    <header class="topbar">
      <!-- 左側：品牌 / 門市資訊 -->
      <div class="brand">
        <div class="avatar" aria-hidden="true">🏪</div>
        <div class="brand-text">
          <div class="brand-title">某某餐飲店</div>
          <div class="brand-sub">門市：某某餐飲-1號 (s1)</div>
        </div>
      </div>

      <!-- 右側：操作區 -->
      <!-- 注意：⚙ / 角色 / 登出 的樣式在 .actions 底下一致，顏色會跟主題變數走 -->
      <div class="actions">
        <button
          class="chip-btn ghost icon-only"
          @click="goSettings"
          title="系統設定"
          aria-label="系統設定"
        >⚙</button>

        <!-- 這顆可依角色改文字，例如 '門市人員'、'中央廚房人員' -->
        <span class="chip role-chip">老闆</span>

        <button class="chip-btn danger" @click="onLogout">登出</button>
      </div>
    </header>

    <div class="body">
      <!-- 側欄 -->
      <aside class="sidebar">
        <!-- 使用者卡片 -->
        <div class="store-card">
          <div class="store-line title">某某餐飲店</div>
          <div class="store-line main">門市：某某餐飲-1號</div>
          <div class="store-line sub">使用者：老闆</div>
        </div>

        <!-- 功能清單 -->
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
        <!-- 頂部資訊列 -->
        <header class="page-head">
          <div class="page-title">{{ currentPageTitle }}</div>
          <div class="page-chips">
            <span class="mini-chip ghost">管理者</span>
            <span class="mini-chip ghost">{{ themeLabel }}</span>
            <span class="mini-chip ghost">Local（假資料）</span>
          </div>
        </header>

        <!-- 主要畫面卡片 -->
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

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()

// --------------------- 主題狀態顯示 ---------------------
// 我們不再自己操作 document.documentElement.classList，
// 因為 main.js 已經會處理 .dark。
// 這裡只負責「顯示目前主題字樣」和「當別的頁面修改後即時更新」。

const themeMode = ref(localStorage.getItem('theme') || 'light')

function handleStorage(e) {
  if (e.key === 'theme') {
    themeMode.value = e.newValue || 'light'
  }
}

// 如果別的地方呼叫 window.setTheme(...)，本組件也需要即時刷新
onMounted(() => {
  window.addEventListener('storage', handleStorage)
})

// 頁面離開時清掉監聽
onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorage)
})

const themeLabel = computed(() => {
  // 顯示成「淺色 / 深色 / 自動」
  const mode = themeMode.value
  if (mode === 'dark') return '深色'
  if (mode === 'auto') {
    // 判斷目前實際上是不是 dark，來加註
    const isDarkNow = document.documentElement.classList.contains('dark')
    return isDarkNow ? '自動・深色中' : '自動・淺色中'
  }
  return '淺色'
})

// --------------------- 導航相關 ---------------------
const currentKey = computed(() => route.path.split('/').pop() || '')

function go(name) {
  router.push(`/boss/${name}`)
}

function isActive(name) {
  return currentKey.value === name
}

const currentPageTitle = computed(() => {
  return (
    route.meta?.title ||
    {
      inventory: '檢視店面庫存',
      ingredients: '食材資料',
      rolegroups: '群組權限',
      stores: '店面管理',
      thresholds: '警示門檻',
      'order-settings': '訂單設定',
      invite: '生成邀請碼',
      reports: '報表中心'
    }[currentKey.value] ||
    '管理後台'
  )
})

// --------------------- 功能按鈕 ---------------------
function goSettings() {
  if (router.hasRoute('system-settings')) {
    router.push({ name: 'system-settings' })
  } else {
    router.push('/settings')
  }
}

function onLogout() {
  logout()
  router.push({ name: 'login' })
}
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
.dark .topbar {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6);
}

.brand {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}
.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #1e3a8a;
}
.dark .avatar {
  background: #1e293b;
  border: 1px solid #475569;
  color: #e2e8f0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  min-width: 0;
}
.brand-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-main);
}
.brand-sub {
  font-size: 12px;
  color: var(--text-sub);
  white-space: nowrap;
}

/* === 右上角操作區（⚙ / 角色 / 登出）=== */
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

/* 角色膠囊 */
.chip {
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
  white-space: nowrap;

  border: 1px solid var(--chip-border);
  background: var(--chip-bg);
  color: var(--chip-text);

  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

/* 老闆 / 員工 / 中央廚房 的角色膠囊可共用這顆 role-chip */
.role-chip {
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #1e3a8a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.dark .role-chip {
  border: 1px solid #6366f1;
  background: #312e81;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
}

/* 小按鈕（包含⚙與登出） */
.chip-btn {
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.2;
  min-height: 32px;
  padding: 6px 10px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  background: var(--chip-bg);
  color: var(--chip-text);
  border: 1px solid var(--chip-border);

  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.chip-btn.icon-only {
  width: 32px;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
}
.chip-btn.danger {
  background: var(--chip-bg-danger);
  border-color: var(--chip-border-danger);
  color: var(--chip-text-danger);
  font-weight: 500;
}
.chip-btn.ghost {
  background: var(--bg-top);
}
.chip-btn:hover {
  filter: brightness(0.97);
}

/* === 主體兩欄 === */
.body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px 1fr;
  background: var(--bg-page);
}

/* 側欄 */
.sidebar {
  background: var(--bg-side);
  border-right: 1px solid var(--border);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.04);

  padding: 16px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 72px);
}
.dark .sidebar {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
}

/* 側欄最上面的卡片 */
.store-card {
  background: var(--bg-side);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
  padding: 12px 14px;
  line-height: 1.4;
}
.store-line.title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}
.store-line.main {
  font-size: 13px;
  font-weight: 500;
}
.store-line.sub {
  font-size: 12px;
  color: var(--text-sub);
}

/* 側欄按鈕群 */
.nav-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.nav-item {
  width: 100%;
  text-align: left;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-side);
  color: var(--text-main);

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  padding: 12px 14px;
  cursor: pointer;
  transition: 0.15s;
}
.nav-item:hover {
  background: rgba(0, 0, 0, 0.02);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}
.dark .nav-item {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
}
.dark .nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.9);
}

/* active 狀態 */
.nav-item.active {
  border-color: #2563eb;
  box-shadow:
    0 0 0 3px rgba(37, 99, 235, 0.15),
    0 8px 20px rgba(0, 0, 0, 0.06);
  background: linear-gradient(
    to bottom right,
    #f8faff 0%,
    #ffffff 60%
  );
}
.dark .nav-item.active {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px rgba(96, 165, 250, 0.25),
    0 12px 30px rgba(0, 0, 0, 0.8);
  background: linear-gradient(
    to bottom right,
    #1e2535 0%,
    #1e293b 60%
  );
}

/* 右側內容區 */
.content-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 20px 40px;
}

/* 頁面頂部資訊列 */
.page-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;

  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.02) 100%
  );
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.04);
  padding: 16px;
}
.dark .page-head {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(0, 0, 0, 0) 60%
  );
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.mini-chip {
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-side);
  color: var(--text-main);

  font-size: 12px;
  line-height: 1.2;
  padding: 6px 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.dark .mini-chip {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

/* 主要內容卡片 */
.content-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.04);

  padding: 16px;
  min-height: 360px;
  min-width: 0;
}
.dark .content-card {
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.9);
}

/* RWD: 小螢幕時側欄收成上方區塊 */
@media (max-width: 1024px) {
  .body {
    grid-template-columns: 100%;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border);
    min-height: auto;
  }
}
</style>
