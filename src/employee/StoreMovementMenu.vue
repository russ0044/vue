<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 上方標題 + 設定 -->
      <div class="top-bar">
        <div class="title-box">庫存管理</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 可捲動內容區 -->
      <div class="scrollbar">
        <div class="menu-box">
          <div class="menu-button" @click="goTo('move')">
            庫存異動
          </div>
          <div class="menu-button" @click="goTo('log')">
            庫存異動記錄
          </div>

          <!-- 若之後要再放別的功能，空白區域保留 -->
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

// 依你的路由調整實際前往的頁面
const goTo = (page) => {
  if (page === 'move') router.push('/StockMove')       // 庫存異動（入庫/出庫/調撥）
  if (page === 'log')  router.push('/StockMoveLog')   // 異動記錄列表
}
</script>

<style scoped>
/* 與其他頁面一致的外框與置中 */
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
  width: 320px;               /* 與前幾個畫面一致 */
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 90vh;               /* 保留右側捲動 */
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

/* 可捲動區域（右側會出現瀏覽器原生滾動條） */
.scrollbar {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

/* 功能卡片 */
.menu-box {
  background-color: #fff;
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
  background-color: #fff;
  text-align: center;
  cursor: pointer;
}

/* 預留下方空白，讓版面更像草圖 */
.spacer {
  height: 240px;
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
