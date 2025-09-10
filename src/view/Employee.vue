<template>
  <div class="login-page ios-safe">
    <!-- 背景（食材圖 + 藍色覆蓋層） -->
    <div class="bg"></div>
    <div class="bg-overlay"></div>

    <!-- 置中白卡 -->
    <div class="card" role="form" aria-labelledby="employee-title">
      <div class="title-box" id="employee-title">員工資料</div>

      <!-- 頭像上傳 -->
      <div class="avatar-box">
        <label class="avatar-wrapper">
          <div class="avatar">
            <img :src="avatarUrl" alt="頭像預覽" />
          </div>
          <div class="camera-icon" aria-hidden="true">📷</div>
          <input
            type="file"
            accept="image/*"
            @change="handleUpload"
            hidden
          />
        </label>
      </div>

      <!-- 表單 -->
      <form @submit.prevent="submit" class="form" novalidate>
        <label class="field">
          <span class="label">電子郵件</span>
          <input
            type="email"
            v-model.trim="email"
            placeholder="name@example.com"
            inputmode="email"
            autocomplete="email"
            required
            class="input"
          />
        </label>

        <label class="field">
          <span class="label">密碼</span>
          <input
            type="password"
            v-model="password"
            placeholder="請輸入密碼"
            autocomplete="current-password"
            minlength="6"
            required
            class="input"
          />
        </label>

        <label class="field">
          <span class="label">邀請碼</span>
          <input
            type="text"
            v-model.trim="inviteCode"
            placeholder="請輸入邀請碼"
            class="input"
            required
          />
        </label>

        <!-- 按鈕區 -->
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
const email = ref('')
const password = ref('')
const inviteCode = ref('')

const avatarUrl = ref('https://cdn-icons-png.flaticon.com/512/149/149071.png')
const handleUpload = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  avatarUrl.value = URL.createObjectURL(file)
}

const goBack = () => router.back()
const submit = () => {
  alert(`送出成功：
信箱：${email.value}
邀請碼：${inviteCode.value}`)
  // TODO: 呼叫後端 API
}
</script>

<style scoped>
:root { -webkit-text-size-adjust: 100%; }
.ios-safe {
  padding-left:  max(0px, env(safe-area-inset-left));
  padding-right: max(0px, env(safe-area-inset-right));
  padding-top:   max(0px, env(safe-area-inset-top));
  padding-bottom:max(0px, env(safe-area-inset-bottom));
}

.login-page{
  position: relative;
  min-height: 100svh;
  min-height: 100dvh;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--app-bg, #dceeff);
  overflow: hidden;
}

.bg{
  position: absolute; inset: 0;
  background-image: url('@/assets/food-bg.jpg');
  background-position: center;
  background-size: cover;
  filter: saturate(1.05);
  transform: scale(1.02);
}

.bg-overlay{
  position: absolute; inset: 0;
  background:
    radial-gradient(60vmax 60vmax at 80% 20%, rgba(14,165,233,.28), transparent 60%),
    radial-gradient(50vmax 50vmax at 10% 90%, rgba(99,102,241,.22), transparent 60%),
    linear-gradient(180deg, color-mix(in oklab, var(--app-bg,#dceeff), #ffffff 20%), var(--app-bg,#dceeff));
  mix-blend-mode: multiply;
  pointer-events: none;
}

.card{
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
}

.title-box{
  display:inline-block;
  border: 2px solid #000;
  background: #fff;
  padding: 10px 14px;
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 auto 10px;
  border-radius: 12px;
}

/* avatar 區 */
.avatar-box{
  display:flex; justify-content:center; margin-bottom:12px;
}
.avatar-wrapper{ position: relative; display:inline-block; cursor:pointer; }
.avatar{
  width: 100px; height: 100px; border-radius: 50%;
  overflow: hidden; border: 2px solid #334155; background:#e2e8f0;
}
.avatar img{ width:100%; height:100%; object-fit:cover; display:block; }
.camera-icon{
  position:absolute; right:0; bottom:0; transform: translate(10%, 10%);
  background:#fff; border:1px solid #334155; border-radius:999px;
  padding:4px 6px; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,.12);
}

/* 表單一致風格 */
.form{ display:grid; gap:12px; }
.field{ display:block; }
.label{ display:block; font-size:.75rem; color:#64748b; margin-bottom:6px; }

.input{
  width:100%; padding:12px; border-radius:12px;
  border:1px solid #cbd5e1; background:#fff; color:#0f172a; outline:none; font-size:1rem;
}
.input:focus{
  border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,.25);
}

/* 按鈕一致風格 */
.button-group{ display:flex; gap:10px; margin-top:8px; }
.btn{
  flex:1; padding:12px 10px; border:none; border-radius:12px; cursor:pointer;
  font-weight:700; font-size:1rem;
}
.primary{ background:#0ea5e9; color:#fff; box-shadow:0 8px 20px rgba(14,165,233,.35) }
.ghost{ background:#e5e7eb; color:#0f172a }

/* 深色主題（可選） */
:global(html.theme-dark) .card{
  background:#111827; color:#e5e7eb; border-color: rgba(255,255,255,.06);
}
:global(html.theme-dark) .title-box{ background:#0b1220; color:#e5e7eb; }
:global(html.theme-dark) .input{ background:#0b1220; color:#e5e7eb; border-color:#334155; }
</style>
