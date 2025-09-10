<template>
  <div class="login-page ios-safe">
    <!-- 背景（食材圖 + 藍色覆蓋層） -->
    <div class="bg"></div>
    <div class="bg-overlay"></div>

    <!-- 置中白卡 -->
    <div class="card" role="dialog" aria-labelledby="role-title">
      <div class="title-box" id="role-title">選擇角色</div>

      <!-- 單欄角色清單 -->
      <div class="role-list">
        <!-- 老闆 -->
        <button class="role-item" @click="selectRole('boss')">
          <div class="role-thumb" :style="bgStyle('boss2.jpg')">
            <span class="emoji">🧑‍💼</span>
          </div>
          <div class="role-text">
            <div class="role-name">老闆</div>
            <div class="role-desc">門市/報表與權限管理</div>
          </div>
          <span class="chevron">›</span>
        </button>

        <!-- 員工 -->
        <button class="role-item" @click="selectRole('staff')">
          <div class="role-thumb" :style="bgStyle('staff.jpg')">
            <span class="emoji">🧑‍🔧</span>
          </div>
          <div class="role-text">
            <div class="role-name">員工</div>
            <div class="role-desc">日常作業、盤點與出入庫</div>
          </div>
          <span class="chevron">›</span>
        </button>

        <!-- 廚房 -->
        <button class="role-item" @click="selectRole('kitchen')">
          <div class="role-thumb" :style="bgStyle('kitchen2.jpg')">
            <span class="emoji">👨‍🍳</span>
          </div>
          <div class="role-text">
            <div class="role-name">廚房</div>
            <div class="role-desc">中央廚房生產與調度</div>
          </div>
          <span class="chevron">›</span>
        </button>
      </div>

      <div class="button-group">
        <button type="button" class="btn ghost" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const selectRole = (role) => {
  if (role === 'boss') router.push('/boss')
  else if (role === 'staff') router.push('/employee')
  else if (role === 'kitchen') router.push('/kitchen')
}

const bgStyle = (filename) => ({
  backgroundImage: `url('@/assets/roles/${filename}')`
})

const goBack = () => router.back()
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--app-bg, #dceeff);
  overflow: hidden;
}

.bg {
  position: absolute; inset: 0;
  background-image: url('@/assets/food-bg.jpg');
  background-position: center;
  background-size: cover;
  filter: saturate(1.05);
  transform: scale(1.02);
}

.bg-overlay {
  position: absolute; inset: 0;
  background:
    radial-gradient(60vmax 60vmax at 80% 20%, rgba(14,165,233,.28), transparent 60%),
    radial-gradient(50vmax 50vmax at 10% 90%, rgba(99,102,241,.22), transparent 60%),
    linear-gradient(180deg, #dceeff, #ffffff);
  mix-blend-mode: multiply;
  pointer-events: none;
}

.card {
  position: relative;
  width: 320px;
  max-width: calc(100% - 32px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  padding: 20px;
  border: 1px solid rgba(0,0,0,.08);
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.title-box {
  display:inline-block;
  border: 2px solid #000;
  background: #fff;
  padding: 10px 14px;
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 auto 10px;
  border-radius: 12px;
}

.role-list {
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-top: 8px;
}

.role-item {
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  padding:10px;
  border:1px solid #cbd5e1;
  background:#fff;
  border-radius:12px;
  box-shadow: 0 3px 10px rgba(0,0,0,.04);
  cursor:pointer;
  transition: all .15s ease;
}
.role-item:hover {
  border-color:#0ea5e9;
  box-shadow: 0 6px 16px rgba(14,165,233,.15);
}

.role-thumb {
  width:56px; height:56px;
  border-radius:10px;
  background-size: cover;
  background-position: center;
  background-color: #e2e8f0;
  flex: 0 0 56px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size: 22px;
}
.emoji {
  text-shadow: 0 1px 4px rgba(0,0,0,.3);
}
.role-text { flex:1; min-width:0; }
.role-name {
  font-size: 1rem;
  font-weight: 700;
  color:#0f172a;
}
.role-desc {
  font-size: .875rem;
  color:#475569;
}
.chevron {
  font-size: 22px;
  color:#94a3b8;
}

.button-group {
  display:flex; gap:10px; margin-top:12px;
}
.btn {
  flex:1; padding:12px 10px; border:none; border-radius:12px;
  cursor:pointer; font-weight:700; font-size:1rem;
}
.ghost { background:#e5e7eb; color:#0f172a }
</style>
