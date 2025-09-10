<template>
  <div class="login-page ios-safe">
    <!-- 背景 -->
    <div class="bg"></div>
    <div class="bg-overlay"></div>

    <!-- 白卡 -->
    <div class="card">
      <!-- 使用者資訊（黑框） -->
      <div class="title-box profile-card">
        <div class="user-info">
          <div class="user-name">{{ user.name }}</div>
          <div class="user-id">ID：{{ user.id }}</div>
        </div>
        <button class="gear-icon" aria-label="設定" @click="goSetting">⚙</button>
      </div>

      <!-- 選單 -->
      <div class="scrollbar">
        <div class="menu-box">
          <div class="grid">
            <button class="tile" @click="router.push('/storeinventory')">
              <div class="tile-icon">📦</div>
              <span class="tile-label">門市庫存</span>
            </button>
            <button class="tile" @click="router.push('/orders')">
              <div class="tile-icon">🧾</div>
              <span class="tile-label">訂單情況</span>
            </button>
            <button class="tile" @click="router.push('/reports')">
              <div class="tile-icon">📊</div>
              <span class="tile-label">檢視報表</span>
            </button>
            <button class="tile" @click="router.push('/delivery')">
              <div class="tile-icon">🚚</div>
              <span class="tile-label">配送情況</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 左下返回 -->
      <div class="button-group">
        <button type="button" class="btn ghost" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const role = 'staff'
const user = {
  name: role === 'boss' ? '某某餐飲店' : role === 'kitchen' ? '某某中央廚房' : '某某員工',
  id: '123456789'
}

const goBack = () => router.back()
const goSetting = () => router.push('/setting')
</script>

<style scoped>
/* —— 背景 —— */
.login-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #dceeff;
  overflow: hidden;
}
.bg {
  position: absolute; inset: 0;
  background-image: url('@/assets/food-bg.jpg'); /* ← 這裡換你的食材背景圖 */
  background-size: cover;
  background-position: center;
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
}

/* —— 卡片 —— */
.card {
  position: relative;
  width: 320px;
  max-width: calc(100% - 32px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 20px;
  border: 1px solid rgba(0,0,0,.08);
  display: flex;
  flex-direction: column;
  z-index: 1;
  height: 90vh;
}

/* —— 使用者資訊黑框 —— */
.title-box {
  border: 2px solid #000;
  background: #fff;
  padding: 10px 14px;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 auto 14px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.user-info { display: flex; flex-direction: column; align-items: flex-start; }
.user-name { font-weight: 700; }
.user-id { font-size: .875rem; color: #666; }
.gear-icon { border: none; background: none; font-size: 20px; cursor: pointer; }

/* —— 選單 —— */
.scrollbar {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}
.menu-box {
  background: #fff;
  border: 1px solid #000;
  border-radius: 16px;
  padding: 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #000;
  border-radius: 14px;
  padding: 16px;
  aspect-ratio: 1/1;
  font-size: 24px;
  cursor: pointer;
  background: #f8fafc;
}
.tile-icon { font-size: 28px; margin-bottom: 6px; }
.tile-label { font-weight: 700; font-size: 14px; }

/* —— 返回按鈕 —— */
.button-group { margin-top: 10px; }
.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
}
.ghost { background:#e5e7eb; color:#0f172a; }
</style>
