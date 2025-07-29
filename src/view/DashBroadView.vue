<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 使用者資訊卡片 -->
      <div class="profile-card">
        <div class="user-info">
          <div class="avatar"></div>
          <div>
            <div>{{ user.name }}</div>
            <div>ID：{{ user.id }}</div>
          </div>
        </div>
        <div class="gear-icon"></div>
      </div>

      <!-- 功能選單 -->
      <div class="scrollbar">
        <div class="menu-box">
          <!-- 老闆 -->
          <template v-if="role === 'boss'">
            <div class="menu-button" v-for="item in bossMenu" :key="item">{{ item }}</div>
          </template>

          <!-- 員工 -->
          <template v-else-if="role === 'staff'">
            <div
              v-for="(item, index) in staffMenu"
              :key="item"
              class="menu-button"
              style="position: relative;"
            >
              {{ item }}
              <div v-if="index === 0" class="alert-dot">!</div>
            </div>
          </template>

          <!-- 中央廚房 -->
          <template v-else-if="role === 'kitchen'">
            <div class="menu-button" v-for="item in kitchenMenu" :key="item">{{ item }}</div>
          </template>
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

// 角色可以是 'boss'、'staff'、'kitchen'，等後端資料庫偵測資料
const role = 'boss'

const user = {
  name: '某某餐飲店',
  id: '123456789'
}

const bossMenu = ['檢視店面庫存', '食材資料', '群組權限', '店面設置', '訂單設置', '報表中心']
const staffMenu = ['門市庫存', '訂單情況', '檢視報表', '配送情況']
const kitchenMenu = ['中央廚房管理']

const goBack = () => {
  router.back()
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

/* 頭像卡片 */
.profile-card {
  border: 1px solid #000;
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ccc;
  margin-right: 10px;
}

.gear-icon {
  width: 24px;
  height: 24px;
  background-color: #888;
  border-radius: 50%;
}

/* 捲動區域 */
.scrollbar {
  height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 按鈕區 */
.menu-box {
  background-color: white;
  border: 1px solid black;
  border-radius: 20px;
  padding: 20px;
}

.menu-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid black;
  border-radius: 10px;
  background-color: white;
  text-align: center;
  position: relative;
}

.alert-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background-color: red;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
  text-align: center;
}
</style>
