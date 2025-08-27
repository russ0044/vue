<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <div class="top-bar">
        <div class="title-box">訂單情況</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <div class="scrollbar">
        <div class="menu-box">
          <div class="menu-button" @click="goTo('manage')">管理訂單</div>
          <div class="menu-button" @click="goTo('history')">訂單紀錄</div>
          <div class="spacer"></div>
        </div>
      </div>

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
  if (p === 'manage') router.push('/orders/manage')
  if (p === 'history') router.push('/orders/history')
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
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
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
