<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 標題 -->
      <div class="top-bar">
        <div class="title-box">AI 自動訂貨建議</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 建議清單 -->
      <div class="scrollbar">
        <div class="section">
          <h4>熟食區</h4>
          <ul>
            <li v-for="i in foods" :key="i.name">{{ i.name }} <span>{{ i.qty }}</span></li>
          </ul>
        </div>
        <div class="section">
          <h4>醬料區</h4>
          <ul>
            <li v-for="i in sauces" :key="i.name">{{ i.name }} <span>{{ i.qty }}</span></li>
          </ul>
        </div>
        <div class="section">
          <h4>香料區</h4>
          <ul>
            <li v-for="i in spices" :key="i.name">{{ i.name }} <span>{{ i.qty }}</span></li>
          </ul>
        </div>
      </div>

      <!-- 底部按鈕 -->
      <div class="footer-btns">
        <button class="btn">送出</button>
        <button class="btn">生成</button>
        <button class="btn">修改</button>
        <button class="btn">取消</button>
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

const foods = [
  { name: '新鮮雞腿', qty: 50 },
  { name: '新鮮鴨腿', qty: 20 },
  { name: '新鮮魚腿', qty: 40 },
  { name: '新鮮豬腿', qty: 15 }
]
const sauces = [
  { name: '某牌辣椒醬', qty: 2 },
  { name: '某牌醬油', qty: 2 },
  { name: '某牌香油', qty: 1 }
]
const spices = [
  { name: '胡椒粉', qty: 1 }
]
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
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
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
  padding-right: 6px;
}

/* Sections */
.section {
  margin-bottom: 16px;
}

.section h4 {
  margin: 8px 0;
  font-weight: 700;
}

.section ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.section li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

/* Footer buttons */
.footer-btns {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
}

.btn {
  background: #fff;
  padding: 6px 12px;
  border: 1px solid #000;
  border-radius: 999px;
  cursor: pointer;
}

/* Back */
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
