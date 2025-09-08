<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="system-title">餐易館</h1>
      <div class="avatar">
        <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="user" />
      </div>
      <input type="email" v-model="email" placeholder="請輸入電子郵件" />
      <div class="password-box">
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="請輸入密碼" />
        <button class="toggle-btn" @click="togglePassword">{{ showPassword ? '隱藏' : '顯示' }}</button>
      </div>
      <a href="#" class="forgot">忘記密碼</a>
      <div class="button-group">
        <button class="primary" @click="login">登入</button>
        <button class="secondary" @click="register">註冊</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}

function login() {
  router.push('/DashBroadView')
}

function register() {
  router.push('/role')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #e0efff, #ffffff);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-box {
  background: #ffffff;
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 340px;
  text-align: center;
}

.system-title {
  margin-bottom: 1rem;
  font-size: 24px;
  color: #333333;
}

.avatar img {
  width: 80px;
  margin-bottom: 1rem;
  border-radius: 50%;
}

input {
  width: 100%;
  padding: 0.6rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
}

.password-box {
  display: flex;
  align-items: center;
}

.password-box input {
  flex: 1;
}

.toggle-btn {
  margin-left: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 12px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: #e0e7ff;
}

.toggle-btn:hover {
  background-color: #c7d2fe;
}

.forgot {
  display: block;
  font-size: 12px;
  margin-bottom: 1rem;
  color: #0077cc;
  text-decoration: none;
}

.forgot:hover {
  text-decoration: underline;
}

.button-group {
  display: flex;
  justify-content: space-between;
}

.button-group button {
  flex: 1;
  padding: 0.6rem;
  margin: 0 0.25rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.button-group .primary {
  background-color: #0077cc;
  color: #ffffff;
}

.button-group .primary:hover {
  background-color: #005fa3;
}

.button-group .secondary {
  background-color: #cccccc;
  color: #000000;
}

.button-group .secondary:hover {
  background-color: #b3b3b3;
}
</style>
