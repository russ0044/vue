<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 上方標題 + 設定 -->
      <div class="top-bar">
        <div class="title-box">庫存異動記錄</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 固定高度的可捲動區（確保會出現捲軸） -->
      <div class="scrollbar">
        <!-- 報廢 -->
        <div class="record-card">
          <div class="record-header">
            <span>報廢</span>
            <span class="record-date">2025/05/15</span>
          </div>

          <div class="record-section">
            <div class="record-subtitle">熟食區</div>
            <ul class="record-list">
              <li>
                1. 新鮮雞腿　
                <span class="status">已過期</span>　
                <span class="action">報廢</span>
              </li>
            </ul>
          </div>

          <div class="record-section">
            <div class="record-subtitle">原因</div>
            <p class="reason">效期已過，依SOP報廢。</p>
          </div>
        </div>

        <!-- 損耗 -->
        <div class="record-card">
          <div class="record-header">
            <span>損耗</span>
            <span class="record-date">2025/05/15</span>
          </div>

          <div class="record-section">
            <div class="record-subtitle">冷藏區</div>
            <ul class="record-list">
              <li>
                1. 生菜　
                <span class="status">外觀不良</span>　
                <span class="action">損耗</span>
              </li>
            </ul>
          </div>

          <div class="record-section">
            <div class="record-subtitle">原因</div>
            <p class="reason">存放過久導致葉面軟化、無法上架。</p>
          </div>
        </div>

        <!-- 借調 -->
        <div class="record-card">
          <div class="record-header">
            <span>借調</span>
            <span class="record-date">2025/05/15</span>
          </div>

          <div class="record-section">
            <div class="record-subtitle">門市間借調</div>
            <ul class="record-list">
              <li>
                1. 牛排(200g) × 5　
                <span class="status">A店 → B店</span>　
                <span class="action">借調</span>
              </li>
            </ul>
          </div>

          <div class="record-section">
            <div class="record-subtitle">原因</div>
            <p class="reason">B店當日備料不足，向A店臨時借調。</p>
          </div>
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
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 320px;              /* 與前面畫面一致 */
  height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 標題 + 齒輪 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.scrollbar {
  margin-top: 12px;
  padding-right: 6px;
  overflow-y: auto;
  height: 360px;  
}

/* 單筆紀錄卡片 */
.record-card {
  border: 1px solid #000;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
  background-color: #fff;
}

.record-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 8px;
}

.record-date {
  font-size: 14px;
  color: #666;
}

.record-section {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #000;
  border-radius: 6px;
  background: #fafafa;
}

.record-subtitle {
  font-weight: bold;
  margin-bottom: 4px;
}

.record-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.record-list li {
  font-size: 14px;
  margin-bottom: 4px;
}

.status {
  color: #d9534f;
}
.action {
  font-weight: bold;
  color: #000;
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
