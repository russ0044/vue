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
        <button class="chip-btn ghost icon-only" title="系統設定" aria-label="系統設定" @click="goSettings">⚙</button>
        <span class="chip role-chip">中央廚房人員</span>
        <button class="chip-btn danger" @click="onLogout">登出</button>
      </div>
    </header>

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
            <span class="mini-chip ghost">Local（假資料）</span>
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
import { computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/store/auth'
import { useRoute, useRouter } from 'vue-router'

const { logout } = useAuth()
const route = useRoute()
const router = useRouter()

function onLogout() {
  logout()
  router.replace({ name: 'login' })
}
function goSettings() { router.push('/settings') }

/* 主題（與 Boss 相同寫法） */
const theme = computed(() => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'))
const themeLabel = computed(() => (theme.value === 'dark' ? '深色' : '淺色'))

function applyThemeClass() {
  const root = document.documentElement
  if (theme.value === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}
const onStorage = (e) => { if (e.key === 'theme') applyThemeClass() }

onMounted(() => { applyThemeClass(); window.addEventListener('storage', onStorage) })
onUnmounted(() => { window.removeEventListener('storage', onStorage) })

/* 動態頁面標題、active 判定 */
const pageTitle = computed(() => route.meta?.title || '中央廚房作業')
const currentKey = computed(() => route.path.split('/').pop() || '')
const isActive = (name) => currentKey.value === name
</script>

<style scoped>
/* === 變數（與 Boss 對齊） === */
.kitchen-shell{
  --bg-page:#f6f8fc; --bg-card:#ffffff; --bg-side:#ffffff; --bg-top:#ffffff;
  --border:#e5e7eb; --border-strong:#cbd5e1;
  --text-main:#1e293b; --text-sub:#64748b; --text-invert:#ffffff;
  --chip-bg:#f8fafc; --chip-border:#e2e8f0; --chip-text:#1e293b;
  --chip-bg-danger:#fee2e2; --chip-border-danger:#fecaca; --chip-text-danger:#b91c1c;

  /* 👉 與老闆一致的功能欄字體尺寸 */
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

/* 兩欄、側欄與內容 */
.body{ flex:1; min-height:0; display:grid; grid-template-columns:280px 1fr; background:var(--bg-page) }

.sidebar{
  background:var(--bg-side); border-right:1px solid var(--border);
  box-shadow:0 16px 40px rgba(0,0,0,.04);
  padding:16px 16px 24px; display:flex; flex-direction:column; gap:16px; min-height:calc(100vh - 72px);
}
.dark .sidebar{ box-shadow:0 16px 40px rgba(0,0,0,.8) }
.store-card{ background:var(--bg-side); border:1px solid var(--border); border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,.03); padding:12px 14px; line-height:1.4 }
.store-line.title{ font-size:14px; font-weight:600; margin-bottom:4px }
.store-line.main{ font-size:13px; font-weight:500 }
.store-line.sub{ font-size:12px; color:var(--text-sub) }

/* 功能清單（字體大小鎖定與老闆一致） */
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

/* ✅ 與老闆一致的字體大小 */
.nav-title{
  font-size:var(--nav-title-size);
  font-weight:600;
  line-height:1.35;
  letter-spacing:.2px;
}
.nav-desc{
  font-size:var(--nav-desc-size);
  line-height:1.3;
  color:var(--text-sub);
  margin-top:4px;
}

.content-pane{ display:flex; flex-direction:column; min-width:0; padding:16px 20px 40px }
.page-head{
  display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px;
  background:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.02) 100%);
  border:1px solid var(--border); border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,.04); padding:16px;
}
.dark .page-head{
  background:linear-gradient(to bottom, rgba(255,255,255,.03) 0%, rgba(0,0,0,0) 100%);
  box-shadow:0 12px 32px rgba(0,0,0,.8);
}
.page-title{ font-size:18px; font-weight:600; display:flex; align-items:center; gap:8px }
.page-chips{ display:flex; flex-wrap:wrap; gap:8px; align-items:center }
.mini-chip{
  border-radius:8px; border:1px solid var(--border); background:var(--bg-side);
  padding:6px 8px; font-size:12px; line-height:1.2; box-shadow:0 2px 4px rgba(0,0,0,.03);
}
.dark .mini-chip{ box-shadow:0 2px 4px rgba(0,0,0,.7) }
.content-card{
  background:var(--bg-card); border:1px solid var(--border); border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,.04);
  padding:16px; min-height:360px; min-width:0;
}
.dark .content-card{ box-shadow:0 12px 32px rgba(0,0,0,.8) }

/* RWD */
@media (max-width:1024px){
  .body{ grid-template-columns:100% }
  .sidebar{ border-right:none; border-bottom:1px solid var(--border); min-height:auto }
}
@media (max-width:640px){
  .topbar{ padding:12px 14px }
  .content-pane{ padding:12px 12px 28px }
}
</style>
