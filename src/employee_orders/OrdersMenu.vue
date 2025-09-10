<template>
  <div class="login-page ios-safe">
    <!-- 背景 -->
    <div class="bg"></div>
    <div class="bg-overlay"></div>

    <!-- 白卡 -->
    <div class="card">
      <!-- 標題 + 齒輪 -->
      <div class="top-bar">
        <div class="title-box">訂單情況</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 功能選單 -->
      <div class="scrollbar">
        <div class="menu-box">
          <div class="menu-button" @click="goTo('manage')">📋 管理訂單</div>
          <div class="menu-button" @click="goTo('history')">🧾 訂單紀錄</div>
          <div class="spacer"></div>
        </div>
      </div>

      <!-- 返回按鈕 -->
      <div class="button-group">
        <button type="button" class="btn ghost" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goBack = () => router.back()
const goToSetting = () => router.push('/setting')
const goTo = (p) => {
  if (p === 'manage') router.push('/orders/manage')
  if (p === 'history') router.push('/orders/history')
}
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
  background-image: url('@/assets/food-bg.jpg'); /* 換成你的食材背景圖 */
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
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  padding: 20px;
  border: 1px solid rgba(0,0,0,.08);
  display: flex;
  flex-direction: column;
  z-index: 1;
  height: 90vh;
}

/* —— 標題列 —— */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.title-box {
  border: 2px solid #000;
  background: #fff;
  padding: 10px 14px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
}
.gear-icon {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

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
  padding: 16px;
}
.menu-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 14px;
  border: 1px solid #000;
  border-radius: 10px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.spacer {
  height: 200px;
}

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
.ghost {
  background:#e5e7eb;
  color:#0f172a;
}
</style>
