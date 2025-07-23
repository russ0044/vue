<template>
  <div class="role-select-container">
    <div class="role-select-box">
    
      <h2>請選擇您的角色</h2>

      <div class="buttons">
        <button class="role-button boss" @click="selectRole('boss')">我是老闆</button>
        <button class="role-button staff" @click="selectRole('staff')">我是員工</button>
      </div>

      <div class="back">
        <button class="back-button" @click="goBack">◀</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const selectRole = (role) => {
  if (role === 'boss') {
    router.push('/boss') // 導向老闆註冊頁（可自訂）
  } else if (role === 'staff') {
    router.push('/employee') // 導向員工註冊頁
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.role-select-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e0efff;
}

.role-select-box {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 320px;
  text-align: center;
  position: relative;
}

.system-title {
  font-size: 28px;
  font-weight: bold;
  color: #0077cc;
  margin-bottom: 1rem;
}

h2 {
  margin-bottom: 1.5rem;
  font-size: 18px;
  color: #333;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.role-button {
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  color: white;
  transition: background-color 0.3s;
}

.role-button:hover {
  opacity: 0.9;
}

.boss {
  background-color: #d5340fff;
}

.staff {
  background-color: #28a745;
}

 .back { 
    position: absolute; 
    bottom: rem; 
    left: 0.5rem; } 

.back-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
</style>
