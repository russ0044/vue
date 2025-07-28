<template>

  <div class="login-container"> 
    <div class="login-box">  <h1 class="system-title">餐易館</h1>
      <div class="avatar">
        <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="user" />
      </div>
      <input type="email" v-model="email" placeholder="請輸入電子郵件" />
      <div class="password-box">
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="請輸入密碼" />
        <button @click="togglePassword">{{ showPassword ? '隱藏' : '顯示' }}</button>
      </div>
      <a href="#" class="forgot">忘記密碼</a>
      <div class="button-group">
        <button @click="login">登入</button>
        <button @click="register">註冊</button>
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

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

 const login = () => 
   router.push('/DashBroadView')
const register = () => {
   router.push('/role')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e0efff;
}

.login-box {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 320px;
  text-align: center;
  position: relative;
}

.avatar img {
  width: 80px;
  margin-bottom: 1rem;
  border-radius: 50%;
}

input {
  width: 100%;
  padding: 0.5rem;
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

.password-box button {
  margin-left: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 12px;
  cursor: pointer;
}

.forgot {
  display: block;
  font-size: 12px;
  margin-bottom: 1rem;
  color: #0077cc;
  text-decoration: none;
}

.button-group button {
  width: 45%;
  padding: 0.5rem;
  margin: 0.25rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background-color: #0077cc;
  color: white;
  font-size: 14px;
}

.button-group button:last-child {
  background-color: #ccc;
  color: black;
}
</style>
