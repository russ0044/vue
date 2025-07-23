<template>
  <div class="boss-container">
    <div class="form-box">
      <!-- 頭像與相機按鈕 -->
<div class="avatar-box">
  <label class="avatar-wrapper">
    <div class="avatar">
      <img :src="avatarUrl" alt="頭像" />
    </div>
    <div class="camera-icon">📷</div>
    <input type="file" accept="image/*" @change="handleUpload" hidden />
  </label>
</div>
      <!-- 表單欄位 -->
      <input type="email" v-model="email" placeholder="請輸入電子郵件" />
      <input type="password" v-model="password" placeholder="請輸入密碼" />
      <input type="text" v-model="storeName" placeholder="請輸入店家名稱" />
      <input type="tel" v-model="phone" placeholder="請輸入聯絡電話" />

      <!-- 中央廚房選項 -->
      <div class="kitchen-option">
        <span>中央廚房</span>
        <input type="checkbox" v-model="centralKitchen" />
      </div>

      <!-- 按鈕區 -->
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

const email = ref('')
const password = ref('')
const storeName = ref('')
const phone = ref('')
const centralKitchen = ref(false)
const imageUrl = ref(null)

const goBack = () => {
  router.back()
}

const submit = () => {
  alert(`註冊資訊：
信箱：${email.value}
密碼：${password.value}
店家名稱：${storeName.value}
電話：${phone.value}
中央廚房：${centralKitchen.value ? '是' : '否'}`)
}
const avatarUrl = ref('https://cdn-icons-png.flaticon.com/512/149/149071.png')
const uploadImage = (e) => {
  const file = e.target.files[0]
  if (file) {
    imageUrl.value = URL.createObjectURL(file)
  }
}
</script>

<style scoped>
.boss-container {
  background-color: #dceeff;
  min-height: 100vh;
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

.avatar-box {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  position: relative;
}


.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #333;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 50%;
}
.placeholder-icon {
  font-size: 48px;
  line-height: 100px;
}
.camera-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #fff;
  border: 1px solid #333;
  border-radius: 50%;
  padding: 4px;
  font-size: 14px;
  transform: translate(0%, 30%);
}

input[type="email"],
input[type="password"],
input[type="text"],
input[type="tel"] {
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: 1px solid #333;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.kitchen-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  font-size: 14px;
  padding: 0 0.5rem;
}

.bottom-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.back-button {
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
}
.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}
.submit-button {
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
}
</style>
