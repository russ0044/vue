<template>
  <div class="login-page ios-safe">
    <!-- 背景 -->
    <div class="bg"></div>
    <div class="bg-overlay"></div>

    <!-- 白卡 -->
    <div class="card">
      <!-- 上方標題 + 設定 -->
      <div class="top-bar">
        <div class="title-box">庫存異動記錄</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 可捲動內容 -->
      <div class="scrollbar">
        <!-- 報廢 -->
        <div class="record-card">
          <div class="record-header">
            <span>🗑️ 報廢</span>
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
            <span>⚠️ 損耗</span>
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
            <span>🤝 借調</span>
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

      <!-- 返回 -->
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
  background-image: url('@/assets/food-bg.jpg');
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

/* —— 可捲動內容 —— */
.scrollbar {
  margin-top: 12px;
  padding-right: 6px;
  overflow-y: auto;
  flex: 1;
}

/* —— 單筆紀錄卡片 —— */
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
