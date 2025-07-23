<template>
  <div class="employee-container">
    <div class="form-box">
      <!-- 系統名稱 -->
      <!-- 頭像與上傳功能 -->
      <div class="avatar-box">
        <label class="avatar-wrapper">
          <img class="avatar" :src="avatarUrl" alt="頭像" />
          <input type="file" accept="image/*" @change="handleUpload" hidden />
          <div class="camera-icon">📷</div>
        </label>
      </div>

      <!-- 表單欄位 -->
      <input type="email" placeholder="請輸入電子郵件" v-model="email" />
      <input type="password" placeholder="請輸入密碼" v-model="password" />
      <input type="text" placeholder="請輸入邀請碼" v-model="inviteCode" />

      <!-- 底部按鈕 -->
      <div class="bottom-buttons">
        <button class="back-button" @click="goBack">◀</button>
        <button class="submit-button" @click="submit">確認</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表單資料
const email = ref('')
const password = ref('')
const inviteCode = ref('')

// 頭像上傳預覽
const avatarUrl = ref('https://cdn-icons-png.flaticon.com/512/149/149071.png')

const handleUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    avatarUrl.value = URL.createObjectURL(file)
  }
}

const goBack = () => {
  router.back()
}

const submit = () => {
  alert('送出成功')
  // 可在此處送資料到後端 API
}
</script>

<style scoped>
.employee-container {
  background-color: #dceeff;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-box {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 320px;
  text-align: center;
  position: relative;
}

.system-title {
  font-size: 24px;
  font-weight: bold;
  color: #0077cc;
  margin-bottom: 1.2rem;
}

.avatar-box {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #333;
}

.camera-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background:#fff;
  border: 1px solid #333;
  border-radius: 50%;
  padding: 4px;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: 1px solid #333;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.bottom-buttons {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.back-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.submit-button {
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
}
</style>