<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 頁面標題（黑框） -->
      <div class="title-card">
        門市庫存
      </div>

      <!-- 功能選單 -->
      <div class="scrollbar">
        <div class="menu-box">
          <div class="menu-button" @click="goTo('manage')">庫存管理</div>

          <div class="menu-button" @click="goTo('status')">
            門市庫存狀況
            <div v-if="hasWarning" class="alert-dot">!</div>
          </div>
        </div>
      </div>

      <!-- 左下返回按鈕 -->
      <button class="back-button" @click="goBack">◀</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const hasWarning = ref(true) // 模擬警示狀態

const goBack = () => {
  router.back()
}

const goTo = (page) => {
  if (page === 'manage') {
    router.push('/StoreMovementMenu')
  } else if (page === 'status') {
    router.push('/stockStatus')
  }
}
</script>

<style scoped>
.dashboard-container {
  background-color: #dceeff;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard-box {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 320px;
  text-align: center;
  position: relative;
}

/* 左下返回按鈕 */
.back-button {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

/* 頁面標題黑框 */
.title-card {
  border: 2px solid #000;
  background-color: white;
  padding: 16px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
}

/* 捲動區域 */
.scrollbar {
  height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 功能按鈕外框 */
.menu-box {
  background-color: white;
  border: 1px solid black;
  border-radius: 20px;
  padding: 20px;
}

/* 單一按鈕 */
.menu-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid black;
  border-radius: 10px;
  background-color: white;
  text-align: center;
  position: relative;
  cursor: pointer;
}

/* 紅色驚嘆號 */
.alert-dot {
  position: absolute;
  top: 5px;
  right: 10px;
  width: 20px;
  height: 20px;
  background-color: red;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}
</style>
