<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 上方標題 + 設定 -->
      <div class="top-bar">
        <div class="title-box">庫存異動</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 可捲動內容 -->
      <div class="scrollbar">
        <div class="menu-box">
          <div class="menu-button" @click="goTo('scrap')">報廢</div>
          <div class="menu-button" @click="goTo('loss')">損耗</div>
          <div class="menu-button" @click="goTo('borrow')">借調</div>

          <!-- 保留空白，讓卡片視覺與草圖相近 -->
          <div class="spacer"></div>
        </div>
      </div>

      <!-- 左下返回 -->
      <button class="back-button" @click="goBack">◀</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goBack = () => router.back()
const goToSetting = () => router.push('/setting')

const goTo = (page) => {
  const map = { scrap: 'scrap', loss: 'loss', borrow: 'borrow' }
  router.push({ name: 'StockMoveForm', params: { type: map[page] } })
}

</script>

<style scoped>
/* 與其他頁一致：藍底置中 */
.dashboard-container {
  background-color: #dceeff;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 白色主卡片 */
.dashboard-box {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 320px;              /* 與前幾個畫面一致 */
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 90vh;              /* 右側可出現捲動條 */
}

/* 標題 + 齒輪 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.title-box {
  border: 2px solid #000;
  background-color: #fff;
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

/* 可捲動區域 */
.scrollbar {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

/* 功能卡片容器 */
.menu-box {
  background-color: #fff;
  border: 1px solid #000;
  border-radius: 20px;
  padding: 20px;
  text-align: left;
}

/* 三個大按鈕 */
.menu-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 14px;
  border: 1px solid #000;
  border-radius: 10px;
  background-color: #fff;
  text-align: center;
  cursor: pointer;
}

/* 視覺留白，對齊草圖比例 */
.spacer {
  height: 260px;
}

/* 左下返回 */
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
