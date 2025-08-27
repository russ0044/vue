<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 標題 -->
      <div class="top-bar">
        <div class="title-box">手動訂單申請</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 選單 -->
      <div class="scrollbar">
        <div class="menu-box">
          <div class="menu-button" @click="goTo('external')">外部訂貨</div>
          <div class="menu-button" @click="goTo('kitchen')">中央廚房請貨</div>
          <div class="spacer"></div>
        </div>
      </div>

      <!-- 返回 -->
      <button class="back-button" @click="goBack">◀</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goBack = () => router.back()
const goToSetting = () => router.push('/setting')

// 點擊導向到兩個子頁
const goTo = (p) => {
  if (p === 'external') router.push('/orders/manage/external')
  if (p === 'kitchen')  router.push('/orders/manage/kitchen')
}
</script>

<style scoped>
/* Layout */
.dashboard-container {
  background: #dceeff;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard-box {
  background: #fff;
  width: 320px;
  height: 90vh;
  padding: 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  text-align: center;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .1);
}

/* Top bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.title-box {
  background: #fff;
  padding: 12px 16px;
  font-size: 18px;
  font-weight: 700;
  border: 2px solid #000;
}

.gear-icon {
  background: none;
  border: 0;
  font-size: 20px;
  cursor: pointer;
}

/* Scroll area */
.scrollbar {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

/* Menu box */
.menu-box {
  background: #fff;
  padding: 20px;
  text-align: left;
  border: 1px solid #000;
  border-radius: 20px;
}

.menu-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 14px;
  text-align: center;
  background: #fff;
  border: 1px solid #000;
  border-radius: 10px;
  cursor: pointer;
}

.spacer {
  height: 260px;
}

/* Back button */
.back-button {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: none;
  border: 0;
  font-size: 20px;
  cursor: pointer;
}
</style>
