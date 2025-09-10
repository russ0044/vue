<template>
  <div class="login-page ios-safe">
    <!-- 背景（食材圖 + 藍色覆蓋層） -->
    <div class="bg"></div>
    <div class="bg-overlay"></div>

    <!-- 置中白卡 -->
    <div class="card" role="dialog" aria-labelledby="login-title">
      <!-- 上方品牌列（可當標題區） -->
      <div class="brand">
        <div class="logo-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l2.4 4.86 5.37.78-3.88 3.78.92 5.36L12 15.9l-4.81 2.88.92-5.36L4.23 8.64l5.37-.78L12 3z" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="system-title">ERP</h1>
      </div>

      <div class="title-box" id="login-title">餐易館</div>

      <form @submit.prevent="login" novalidate>
        <!-- Email -->
        <label class="field">
          <span class="label">電子郵件</span>
          <input
            type="email"
            v-model.trim="email"
            placeholder="name@example.com"
            inputmode="email"
            autocomplete="email"
            autocapitalize="off"
            autocorrect="off"
            required
            class="input"
          />
        </label>

        <!-- Password -->
        <label class="field">
          <span class="label">密碼</span>
          <div class="password-box">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="請輸入密碼"
              autocomplete="current-password"
              required
              minlength="6"
              class="input"
            />
            <button type="button" class="toggle" @click="togglePassword">
              {{ showPassword ? '隱藏' : '顯示' }}
            </button>
          </div>
        </label>

        <div class="row">
          <label class="remember">
            <input type="checkbox" v-model="remember" />
            <span>記住我</span>
          </label>
          <a href="#" class="forgot">忘記密碼</a>
        </div>

        <div class="button-group">
          <button type="submit" class="btn primary">登入</button>
          <button type="button" class="btn ghost" @click="register">註冊</button>
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
const showPassword = ref(false)
const remember = ref(true)

const togglePassword = () => (showPassword.value = !showPassword.value)
const login = () => router.push('/DashBroadView')
const register = () => router.push('/role')
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
  min-height: 100svh;  /* iOS 16+ */
  min-height: 100dvh;  /* 現代瀏覽器 */
  min-height: 100vh;   /* 回退 */
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
  background: var(--card-bg, #fff);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  padding: 20px;
  border: 1px solid rgba(0,0,0,.08);
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.brand{
  display:flex; align-items:center; justify-content:center; gap:10px;
  margin-bottom: 10px;
}
.logo-badge{
  width:32px; height:32px; border-radius:10px;
  display:grid; place-items:center; color:#fff;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
}
.logo-badge svg{ width:18px; height:18px; }
.system-title{ margin:0; font-size: 1.125rem; color:#0f172a; }

.title-box{
  display:inline-block;
  border: 2px solid #000;
  background: #fff;
  padding: 10px 14px;
  font-size: 1.125rem; /* 18px */
  font-weight: 700;
  margin: 0 auto 6px;
  border-radius: 12px;
}
.subtitle{
  margin: 0 0 12px;
  font-size: .875rem; /* 14px */
  color: #475569;
  text-align:center;
}


form{ display:grid; gap:12px; }
.field{ display:block; }
.label{ display:block; font-size:.75rem; color:#64748b; margin-bottom:6px; }

.input, .toggle, .btn, .forgot, .remember { font-size: 1rem; } /* iOS 避免自動放大 */
.input{
  width:100%;
  padding:12px;
  border-radius:12px;
  border:1px solid #cbd5e1;
  background:#fff;
  color:#0f172a;
  outline:none;
}
.input:focus{
  border-color:#0ea5e9;
  box-shadow: 0 0 0 3px rgba(14,165,233,.25);
}

.password-box{ display:flex; gap:8px; align-items:center }
.password-box .input{ flex:1 }
.toggle{
  padding:10px 12px;
  border:1px solid #0f172a; border-radius:10px; cursor:pointer;
  background:#fff; color:#0f172a; white-space:nowrap;
}

/* Remember / Forgot */
.row{ display:flex; justify-content:space-between; align-items:center; margin:2px 0 0 }
.remember{ display:flex; align-items:center; gap:8px; color:#334155 }
.remember input{ width:18px; height:18px }
.forgot{ color:#0ea5e9; text-decoration:none }
.forgot:active, .btn:active, .toggle:active { opacity:.9 }

.button-group{ display:flex; gap:10px; margin-top:8px }
.btn{
  flex:1; padding:12px 10px; border:none; border-radius:12px; cursor:pointer;
  font-weight:700;
}
.primary{ background:#0ea5e9; color:#fff; box-shadow:0 8px 20px rgba(14,165,233,.35) }
.ghost{ background:#e5e7eb; color:#0f172a }

/* 深色主題適配（吃 theme.css 的變數也 OK） */
:global(html.theme-dark) .card{
  background:#111827; color:#e5e7eb; border-color: rgba(255,255,255,.06);
}
:global(html.theme-dark) .title-box{ background:#0b1220; color:#e5e7eb; }
:global(html.theme-dark) .input{ background:#0b1220; color:#e5e7eb; border-color:#334155; }
:global(html.theme-dark) .subtitle{ color:#94a3b8; }
:global(html.theme-dark) .toggle{ background:#e5e7eb; color:#0f172a; }

/* 小螢幕優化 */
@media (max-width: 380px){
  .card{ max-width: calc(100% - 20px); border-radius: 14px; padding: 18px }
  .btn{ padding: 11px 8px }
}
</style>
