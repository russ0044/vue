<template>
  <div class="login-page ios-safe">
    <!-- 背景 -->
    <div class="bg"></div>
    <div class="bg-overlay"></div>

    <!-- 白卡 -->
    <div class="card" role="form" aria-labelledby="kitchen-title">
      <div class="title-box" id="kitchen-title">中央廚房資料</div>

      <!-- Logo 上傳 -->
      <div class="avatar-box">
        <label class="avatar-wrapper">
          <div class="avatar">
            <img :src="logoUrl" alt="廚房 Logo 預覽" />
          </div>
          <div class="camera-icon">📷</div>
          <input type="file" accept="image/*" @change="onLogoUpload" hidden />
        </label>
      </div>

      <!-- 表單 -->
      <form class="form" @submit.prevent="submit" novalidate>
        <label class="field">
          <span class="label">廚房名稱</span>
          <input class="input" type="text" v-model.trim="kitchenName" placeholder="例如：中區中央廚房" required />
        </label>

        <label class="field">
          <span class="label">聯絡電話</span>
          <input class="input" type="tel" v-model.trim="phone" placeholder="0912-345-678" />
        </label>

        <label class="field">
          <span class="label">地址</span>
          <input class="input" type="text" v-model.trim="address" placeholder="請輸入地址" />
        </label>

        <label class="kitchen-option">
          <span>接受門市訂單</span>
          <input type="checkbox" v-model="acceptOrders" />
        </label>

        <!-- 按鈕 -->
        <div class="button-group">
          <button type="button" class="btn ghost" @click="goBack">返回</button>
          <button type="submit" class="btn primary">確認</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const kitchenName = ref('')
const phone = ref('')
const address = ref('')
const acceptOrders = ref(true)
const logoUrl = ref('https://cdn-icons-png.flaticon.com/512/3075/3075977.png')

const onLogoUpload = (e) => {
  const file = e.target.files?.[0]
  if (file) logoUrl.value = URL.createObjectURL(file)
}

const goBack = () => router.back()
const submit = () => {
  alert(`中央廚房已送出：
名稱：${kitchenName.value}
電話：${phone.value}
地址：${address.value}
接受門市訂單：${acceptOrders.value ? '是' : '否'}`)
}
</script>

<style scoped>
/* —— 背景一致 —— */
.login-page{ position:relative; min-height:100vh; display:grid; place-items:center; background:#dceeff; overflow:hidden; }
.bg{ position:absolute; inset:0; background-image:url('@/assets/food-bg.jpg'); background-size:cover; background-position:center; filter:saturate(1.05); transform:scale(1.02); }
.bg-overlay{ position:absolute; inset:0; background:radial-gradient(60vmax 60vmax at 80% 20%, rgba(14,165,233,.28), transparent 60%),radial-gradient(50vmax 50vmax at 10% 90%, rgba(99,102,241,.22), transparent 60%),linear-gradient(180deg, #dceeff, #ffffff); mix-blend-mode:multiply; }

/* —— 卡片 —— */
.card{ position:relative; width:320px; max-width:calc(100% - 32px); background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,.12); padding:20px; border:1px solid rgba(0,0,0,.08); display:flex; flex-direction:column; z-index:1; }
.title-box{ display:inline-block; border:2px solid #000; background:#fff; padding:10px 14px; font-size:1.125rem; font-weight:700; margin:0 auto 10px; border-radius:12px; }

/* —— Avatar —— */
.avatar-box{ display:flex; justify-content:center; margin-bottom:12px; }
.avatar-wrapper{ position:relative; display:inline-block; cursor:pointer; }
.avatar{ width:100px; height:100px; border-radius:50%; overflow:hidden; border:2px solid #334155; background:#e2e8f0; }
.avatar img{ width:100%; height:100%; object-fit:cover; display:block; }
.camera-icon{ position:absolute; right:0; bottom:0; transform:translate(10%,10%); background:#fff; border:1px solid #334155; border-radius:999px; padding:4px 6px; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,.12); }

/* —— 表單 —— */
.form{ display:grid; gap:12px; }
.field{ display:block; }
.label{ display:block; font-size:.75rem; color:#64748b; margin-bottom:6px; }
.input{ width:100%; padding:12px; border-radius:12px; border:1px solid #cbd5e1; font-size:1rem; }
.input:focus{ border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,.25); }

/* —— 開關/按鈕 —— */
.kitchen-option{ display:flex; align-items:center; justify-content:space-between; padding:0 4px; font-size:14px; color:#334155; }
.button-group{ display:flex; gap:10px; margin-top:8px; }
.btn{ flex:1; padding:12px 10px; border:none; border-radius:12px; cursor:pointer; font-weight:700; font-size:1rem; }
.primary{ background:#0ea5e9; color:#fff; box-shadow:0 8px 20px rgba(14,165,233,.35); }
.ghost{ background:#e5e7eb; color:#0f172a; }
</style>
