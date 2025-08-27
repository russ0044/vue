<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 標題 -->
      <div class="top-bar">
        <div class="title-box">管理訂單</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 選單 -->
      <div class="scrollbar">
        <div class="menu-box">
          <div class="menu-button" @click="goTo('ai')">AI 自動訂貨建議</div>
          <div class="menu-button" @click="goTo('manual')">手動訂單申請</div>
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
const goTo = (p) => {
  if (p === 'ai') router.push('/orders/manage/ai')
  if (p === 'manual') router.push('/orders/manage/manual')
}
</script>

<style scoped>
.dashboard-container {
  background: #dceeff;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard-box {
  background: #fff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  width: 320px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  text-align: center;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title-box {
  border: 2px solid #000;
  background: #fff;
  padding: 12px 16px;
  font-size: 18px;
  font-weight: bold;
}

.gear-icon {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.scrollbar {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.menu-box {
  background: #fff;
  border: 1px solid #000;
  border-radius: 20px;
  padding: 20px;
  text-align: left;
}

.menu-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 14px;
  border: 1px solid #000;
  border-radius: 10px;
  background: #fff;
  text-align: center;
  cursor: pointer;
}

.spacer {
  height: 260px;
}

.back-button {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
</style>
