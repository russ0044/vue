<template>
  <div class="login-shell">
    <div class="login-card">
      <!-- 系統標頭 / 品牌 -->
      <header class="card-head">
        <div class="app-mark">
          <div class="logo-circle">
            <span class="logo-text">餐</span>
          </div>
          <div class="meta">
            <div class="app-name">餐易管</div>
            <div class="app-desc">中小型餐飲 庫存 / 門市 / 中央廚房 一站式管理</div>
          </div>
        </div>
      </header>

      <!-- avatar -->
      <div class="avatar-wrap">
        <div class="avatar-circle">
          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="user"
          />
        </div>
        <div class="avatar-hint">請先登入帳號以進入系統</div>
      </div>

      <!-- 登入表單 -->
      <form class="form-area" @submit.prevent="onLogin">
        <label class="field">
          <span class="label">電子郵件</span>
          <input
            type="email"
            v-model.trim="email"
            class="input"
            placeholder="boss@example.com"
            autocomplete="username"
            required
          />
        </label>

        <label class="field">
          <span class="label">密碼</span>
          <div class="pw-box">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model.trim="password"
              class="input pw-input"
              placeholder="請輸入密碼"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="pw-toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隱藏' : '顯示' }}
            </button>
          </div>
        </label>

        <div class="row-between">
          <button type="button" class="link" @click="onForgot">忘記密碼？</button>
          <button type="button" class="link ghost" @click="onInviteJoin">
            使用邀請碼加入
          </button>
        </div>

        <!-- 錯誤訊息 -->
        <p v-if="errorMsg" class="msg err">{{ errorMsg }}</p>
        <p v-if="infoMsg" class="msg info">{{ infoMsg }}</p>

        <!-- 動作按鈕 -->
        <div class="btn-row">
          <button
            type="submit"
            class="btn primary"
            :disabled="!canSubmit || loading"
          >
            {{ loading ? '登入中…' : '登入' }}
          </button>

          <button
            type="button"
            class="btn ghost"
            :disabled="loading"
            @click="goRegister"
          >
            註冊老闆帳號
          </button>
        </div>
      </form>

      <!-- Demo 帳號小提醒 -->
      <footer class="demo-hint">
        <details>
          <summary>示範登入帳號（展示用）</summary>
          <ul>
            <li><b>老闆</b>：boss@example.com / boss123</li>
            <li><b>店員</b>：staff@example.com / emp123</li>
            <li><b>中央廚房</b>：kitchen@example.com / ck123</li>
          </ul>
        </details>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'

// Router / Store
const router = useRouter()
const { login } = useAuth()
const { setRole } = useRoleStore()

// 表單欄位
const email = ref('')
const password = ref('')
const showPassword = ref(false)

// UI 狀態
const errorMsg = ref('')
const infoMsg = ref('')
const loading = ref(false)

// （暫時）本地模擬使用者，後面可以改為從 ds.read() 取得真實使用者
const DEMO = {
  'boss@example.com': {
    name: '老闆',
    role: 'Boss',
    password: 'boss123',
  },
  'staff@example.com': {
    name: '員工A',
    role: 'Employee',
    password: 'emp123',
  },
  'kitchen@example.com': {
    name: '中央廚',
    role: 'Kitchen',
    password: 'ck123',
  },
}

// 驗證
const emailOk = computed(() => /\S+@\S+\.\S+/.test(email.value))
const canSubmit = computed(() => emailOk.value && password.value.length >= 3)

// 每次輸入都清掉錯誤
watch([email, password], () => {
  errorMsg.value = ''
  infoMsg.value = ''
})

// 忘記密碼（暫時本地提示）
function onForgot() {
  infoMsg.value = '請聯繫老闆／管理者重設密碼，或未來接 Firebase Auth 後由系統寄送。'
  setTimeout(() => {
    infoMsg.value = ''
  }, 2600)
}

// 邀請碼加入（員工 / 廚房才用）
// 這裡先做提示，不破版。未來可 router.push('/join')。
function onInviteJoin() {
  infoMsg.value = '員工 / 中央廚房請使用「老闆給的邀請碼」加入系統（功能待接）'
  setTimeout(() => {
    infoMsg.value = ''
  }, 2600)
}

// 新註冊（老闆專用）
function goRegister() {
  router.push('/register')
}

// 登入
async function onLogin() {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  try {
    const acc = DEMO[email.value.toLowerCase()]
    if (!acc || acc.password !== password.value) {
      errorMsg.value = '電子郵件或密碼錯誤'
      return
    }

    // 寫入 session / pinia / whatever
    login({
      name: acc.name,
      role: acc.role,
      email: email.value,
    })
    setRole(acc.role)

    // 依角色導頁
    if (acc.role === 'Boss') {
      router.push('/boss')
    } else if (acc.role === 'Employee') {
      router.push('/emp')
    } else {
      router.push('/kitchen')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 整體背景：柔和漸層＋置中卡片 */
.login-shell {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #dbeafe 0%, #f8fafc 60%);
  display: grid;
  place-items: center;
  padding: 16px;
  font-family: "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
}

/* 登入卡片外觀 */
.login-card {
  width: min(94vw, 380px);
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 32px 80px rgba(0,0,0,.08),
    0 6px 20px rgba(0,0,0,.04);
  padding: 20px 20px 16px;
  display: grid;
  gap: 20px;
}

/* 頂部品牌區 */
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.app-mark {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);
  color:#fff;
  display:grid;
  place-items:center;
  font-weight:700;
  font-size:15px;
  box-shadow:0 10px 20px rgba(37,99,235,.4);
}
.logo-text {
  line-height:1;
}
.meta {
  display: grid;
  gap: 2px;
}
.app-name {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
}
.app-desc {
  font-size: .7rem;
  color: #64748b;
  line-height: 1.4;
}

/* avatar + 提示 */
.avatar-wrap {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 8px;
}
.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow:
    0 12px 24px rgba(0,0,0,.06),
    0 2px 4px rgba(0,0,0,.04);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.avatar-circle img {
  width: 40px;
  height: 40px;
  object-fit: cover;
}
.avatar-hint {
  font-size: .8rem;
  color: #475569;
  line-height: 1.4;
}

/* 表單 */
.form-area {
  display: grid;
  gap: 14px;
}
.field {
  display: grid;
  gap: 6px;
}
.label {
  font-size: .8rem;
  font-weight: 600;
  color: #334155;
}
.input {
  width: 100%;
  padding: .65rem .7rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: .9rem;
  line-height: 1.4;
  color: #0f172a;
  background: #fff;
}
.input:focus {
  outline: 2px solid #2563eb33;
  border-color: #2563eb;
}

/* 密碼 with 顯示/隱藏 */
.pw-box {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.pw-input {
  flex: 1;
}
.pw-toggle {
  white-space: nowrap;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background:#fff;
  color:#475569;
  font-size:.8rem;
  padding:0 .6rem;
  cursor:pointer;
}
.pw-toggle:hover {
  background:#f8fafc;
}

/* links row */
.row-between {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}
.link {
  background:transparent;
  border:none;
  padding:0;
  font-size:.75rem;
  line-height:1.4;
  color:#2563eb;
  cursor:pointer;
  text-decoration:none;
}
.link.ghost {
  color:#475569;
}
.link:hover {
  text-decoration:underline;
}

/* 訊息條 */
.msg {
  font-size:.75rem;
  line-height:1.4;
  border-radius:10px;
  padding:8px 10px;
  border:1px solid;
}
.msg.err {
  background:#fff1f2;
  border-color:#fecdd3;
  color:#9f1239;
}
.msg.info {
  background:#eff6ff;
  border-color:#bae6fd;
  color:#1e3a8a;
}

/* 按鈕群 */
.btn-row {
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}
.btn {
  flex:1;
  border-radius:10px;
  font-size:.9rem;
  font-weight:600;
  padding:.7rem 1rem;
  cursor:pointer;
  border:1px solid transparent;
  text-align:center;
  box-shadow:0 10px 20px rgba(0,0,0,.07);
}
.btn.primary {
  background:#2563eb;
  border-color:#2563eb;
  color:#fff;
  box-shadow:0 14px 28px rgba(37,99,235,.35);
}
.btn.primary:disabled {
  background:#94a3b8;
  border-color:#94a3b8;
  box-shadow:none;
  cursor:not-allowed;
}
.btn.ghost {
  background:#fff;
  color:#475569;
  border-color:#cbd5e1;
  box-shadow:none;
}
.btn.ghost:disabled {
  opacity:.5;
  cursor:not-allowed;
}

/* Demo 區塊 */
.demo-hint {
  font-size:.7rem;
  line-height:1.4;
  color:#64748b;
  background:#f8fafc;
  border:1px dashed #e2e8f0;
  border-radius:12px;
  padding:10px 12px;
}
.demo-hint summary {
  cursor:pointer;
  font-weight:600;
  color:#475569;
  margin-bottom:4px;
  outline:none;
}
.demo-hint ul {
  margin:6px 0 0;
  padding-left:1.2em;
}
.demo-hint li {
  margin:2px 0;
}
.demo-hint b {
  color:#0f172a;
}
</style>
