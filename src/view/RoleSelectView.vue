<template>
  <div class="role-select-container">
    <div class="role-select-box">
      <h2>請選擇您的角色</h2>

      <div class="buttons">
        <button class="role-button boss" @click="selectRole('boss')">我是老闆</button>
        <button class="role-button staff" @click="selectRole('staff')">我是員工</button>
      </div>

      <div class="back">
        <button class="back-button" @click="goBack" title="返回登入">◀</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const selectRole = (role) => {
  if (role === 'boss') {
    router.push('/boss')
  } else if (role === 'staff') {
    router.push('/employee')
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
  background: var(--bg, #e0efff);
  color: var(--text, #1e293b);
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
}

.role-select-box {
  background: var(--card-bg, #fff);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  width: 320px;
  text-align: center;
  position: relative;
  border: 1px solid var(--border, #e5e7eb);
}

h2 {
  margin-bottom: 1.5rem;
  font-size: 20px;
  font-weight: 600;
  color: var(--text, #1e293b);
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
  font-weight: 500;
  color: #fff;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.role-button:hover {
  transform: translateY(-2px);
  opacity: 0.95;
}

.boss {
  background-color: #dc2626; /* 紅色系 */
}

.staff {
  background-color: #16a34a; /* 綠色系 */
}

.back {
  position: absolute;
  bottom: 1rem;
  left: 0.5rem;
}

.back-button {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--muted, #64748b);
  cursor: pointer;
  transition: color 0.2s;
}
.back-button:hover {
  color: var(--text, #1e293b);
}
</style>
