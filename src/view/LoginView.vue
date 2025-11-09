<template>
  <div class="login-shell">
    <div class="login-card">
      <!-- 系統標頭 / 品牌 -->
      <header class="card-head">
        <div class="app-mark">
          <div class="logo-circle"><span class="logo-text">餐</span></div>
          <div class="meta">
            <div class="app-name">餐易管</div>
            <div class="app-desc">中小型餐飲 庫存／門市／中央廚房 一站式管理</div>
          </div>
        </div>
      </header>

      <!-- avatar -->
      <div class="avatar-wrap">
        <div class="avatar-circle">
          <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="user" />
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
            placeholder="boss@hunanchicken.example"
            autocomplete="username"
            required
            @keydown.enter="onLogin"
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
              ref="pwRef"
              @keydown.enter="onLogin"
              @keyup="detectCaps"
            />
            <button type="button" class="btn tiny ghost pw-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? '隱藏' : '顯示' }}
            </button>
          </div>
          <p v-if="capsOn" class="caps-hint">看起來 Caps Lock 已開啟</p>
        </label>

        <div class="row-between">
          <button type="button" class="link" @click="onForgot">忘記密碼？</button>
          <button type="button" class="link ghost" @click="onInviteJoin">使用邀請碼加入</button>
        </div>

        <transition name="fade">
          <p v-if="errorMsg" class="msg err">{{ errorMsg }}</p>
        </transition>
        <transition name="fade">
          <p v-if="infoMsg" class="msg info">{{ infoMsg }}</p>
        </transition>

        <div class="btn-row">
          <button type="submit" class="btn primary" :disabled="!canSubmit || loading">
            {{ loading ? '登入中…' : '登入' }}
          </button>
          <button type="button" class="btn ghost" :disabled="loading" @click="goRegister">
            註冊老闆帳號
          </button>
        </div>
      </form>

      <!-- Demo 帳號 -->
      <footer class="demo-hint">
        <details open>
          <summary>示範登入帳號（四種角色，點一下自動貼入）</summary>
          <ul class="demo-list">
            <li v-for="u in demoList" :key="u.email" class="demo-item">
              <div class="demo-info">
                <b>{{ u.title }}</b>
                <span class="muted">（{{ u.roleLabel }}）</span>
                <div class="demo-cred">
                  <code>{{ u.email }}</code>
                  <span>/</span>
                  <code>{{ u.password }}</code>
                </div>
              </div>
              <button class="btn tiny ghost" @click="quickFill(u.email, u.password)">一鍵貼入</button>
            </li>
          </ul>
        </details>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'
import { usePerm } from '@/store/perm'

const router = useRouter()
const { login } = useAuth()
const { setRole } = useRoleStore()
const { reset } = usePerm()

/** 示範帳號（與 seedData 對齊） */
const DEMO = {
  'boss@hunanchicken.example': {
    id: 'U001',
    name: '老闆',
    role: 'Boss',
    roleGroupId: 'rg-boss',
    password: 'boss123',
  },
  'kitchen@hunanchicken.example': {
    id: 'U900',
    name: '中央廚房人員',
    role: 'Kitchen',
    roleGroupId: 'rg-kitchen',
    password: 'ck123',
  },
  'tpe-manager@hunanchicken.example': {
    id: 'U101',
    name: '台北店長A',
    role: 'Employee',
    roleGroupId: 'rg-store-manager',
    password: 'emp123',
  },
  'tpe-staff-b@hunanchicken.example': {
    id: 'U102',
    name: '台北店員B',
    role: 'Employee',
    roleGroupId: 'rg-staff',
    password: 'emp123',
  },
}

const demoList = computed(() => ([
  { title:'老闆',         roleLabel:'Boss',     email:'boss@hunanchicken.example',        password:'boss123' },
  { title:'中央廚房',     roleLabel:'Kitchen',  email:'kitchen@hunanchicken.example',     password:'ck123'   },
  { title:'店長（台北）', roleLabel:'Employee', email:'tpe-manager@hunanchicken.example', password:'emp123'  },
  { title:'員工（台北）', roleLabel:'Employee', email:'tpe-staff-b@hunanchicken.example', password:'emp123' },
]))

// 表單狀態
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const infoMsg = ref('')
const loading = ref(false)
const pwRef = ref(null)
const capsOn = ref(false)

const emailOk = computed(() => /\S+@\S+\.\S+/.test(email.value))
const canSubmit = computed(() => emailOk.value && password.value.length >= 3)

watch([email, password], () => { errorMsg.value = ''; infoMsg.value = '' })

function onForgot(){ infoMsg.value = '請聯繫老闆／管理者重設密碼。'; setTimeout(()=>infoMsg.value='', 2600) }
function onInviteJoin(){ infoMsg.value = '員工／中央廚房可使用「邀請碼」加入（示範）。'; setTimeout(()=>infoMsg.value='', 2600) }
function goRegister(){ router.push('/register') }

// 偵測 Caps Lock
function detectCaps(e){
  const isLetter = (c) => c && c.length === 1 && /[a-zA-Z]/.test(c)
  if (!isLetter(e.key)) return
  const caps = (e.getModifierState && e.getModifierState('CapsLock')) || false
  capsOn.value = !!caps
}

// 一鍵貼入：統一樣式 + 自動聚焦密碼
async function quickFill(e,p){
  email.value = e
  password.value = p
  showPassword.value = false
  await nextTick()
  pwRef.value?.focus()
}

// 登入
async function onLogin () {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  try {
    const acc = DEMO[email.value.toLowerCase()]
    if (!acc || acc.password !== password.value) {
      errorMsg.value = '電子郵件或密碼錯誤'
      return
    }

    // 清掉上一位使用者的權限快取
    reset()
    await nextTick()

    // 建立完整 user 物件（auth.login 需要 user 與 user.role）
    const user = {
      id: acc.id,
      name: acc.name,
      email: email.value,
      role: acc.role,              // 'Boss' | 'Employee' | 'Kitchen'
      roleGroupId: acc.roleGroupId // 'rg-boss' | 'rg-store-manager' | ...
    }

    await Promise.resolve(login({ user }))
    setRole(acc.role)

    // 依角色導頁
    if (acc.role === 'Boss')        router.push('/boss')
    else if (acc.role === 'Kitchen')router.push('/kitchen')
    else                            router.push('/emp') // Employee（店長／員工）
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 背景與卡片 */
.login-shell{
  min-height:100vh;
  background:
    radial-gradient(circle at 20% 20%, #dbeafe 0%, rgba(219,234,254,0) 60%),
    #f8fafc;
  display:grid;place-items:center;padding:16px;
  font-family:"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif
}
.login-card{
  width:min(94vw,400px);
  background:#fff;border-radius:20px;border:1px solid #e2e8f0;
  box-shadow:0 32px 80px rgba(0,0,0,.08),0 6px 20px rgba(0,0,0,.04);
  padding:22px 22px 16px;display:grid;gap:20px
}

/* 標頭 */
.card-head{display:flex;align-items:flex-start;justify-content:center}
.app-mark{display:flex;align-items:center;gap:12px}
.logo-circle{width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);color:#fff;display:grid;place-items:center;font-weight:700;font-size:15px;box-shadow:0 10px 20px rgba(37,99,235,.4)}
.logo-text{line-height:1}
.meta{display:grid;gap:2px}
.app-name{font-size:1rem;font-weight:800;line-height:1.2;color:#0f172a}
.app-desc{font-size:.7rem;color:#64748b;line-height:1.4}

/* avatar */
.avatar-wrap{text-align:center;display:grid;justify-items:center;gap:8px}
.avatar-circle{width:64px;height:64px;border-radius:16px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 12px 24px rgba(0,0,0,.06),0 2px 4px rgba(0,0,0,.04);display:grid;place-items:center;overflow:hidden}
.avatar-circle img{width:40px;height:40px;object-fit:cover}
.avatar-hint{font-size:.8rem;color:#475569;line-height:1.4}

/* 表單 */
.form-area{display:grid;gap:14px}
.field{display:grid;gap:6px}
.label{font-size:.8rem;font-weight:600;color:#334155}
.input{width:100%;padding:.65rem .7rem;border:1px solid #cbd5e1;border-radius:10px;font-size:.9rem;line-height:1.4;color:#0f172a;background:#fff;transition:.15s border, .15s box-shadow}
.input:focus{outline:2px solid #2563eb33;border-color:#2563eb}

/* 密碼切換 */
.pw-box{display:flex;align-items:stretch;gap:8px}
.pw-input{flex:1}
.pw-toggle{white-space:nowrap}

/* CapsLock 提示 */
.caps-hint{margin-top:6px;font-size:.72rem;color:#b45309;background:#fff7ed;border:1px solid #fed7aa;padding:6px 8px;border-radius:8px}

/* 連結列 */
.row-between{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.link{background:transparent;border:none;padding:0;font-size:.75rem;line-height:1.4;color:#2563eb;cursor:pointer;text-decoration:none}
.link.ghost{color:#475569}
.link:hover{text-decoration:underline}

/* 訊息 */
.msg{font-size:.75rem;line-height:1.4;border-radius:10px;padding:8px 10px;border:1px solid}
.msg.err{background:#fff1f2;border-color:#fecdd3;color:#9f1239}
.msg.info{background:#eff6ff;border-color:#bae6fd;color:#1e3a8a}

/* 按鈕群（統一按鈕系統） */
.btn-row{display:flex;flex-wrap:wrap;gap:10px}
.btn{flex:1;border-radius:10px;font-size:.9rem;font-weight:700;padding:.7rem 1rem;cursor:pointer;border:1px solid transparent;text-align:center;box-shadow:0 10px 20px rgba(0,0,0,.07);transition:.15s transform,.15s box-shadow,.15s background,.15s border}
.btn:active{transform:translateY(1px)}
.btn.primary{background:#2563eb;border-color:#2563eb;color:#fff;box-shadow:0 14px 28px rgba(37,99,235,.35)}
.btn.primary:disabled{background:#94a3b8;border-color:#94a3b8;box-shadow:none;cursor:not-allowed}
.btn.ghost{background:#fff;color:#475569;border-color:#cbd5e1;box-shadow:none}
.btn.ghost:hover{border-color:#2563eb;color:#2563eb}
.btn.tiny{flex:unset;padding:.46rem .6rem;font-size:.78rem;border-radius:8px}

/* Demo 區塊 */
.demo-hint{font-size:.7rem;line-height:1.4;color:#64748b;background:#f8fafc;border:1px dashed #e2e8f0;border-radius:12px;padding:10px 12px}
.demo-hint summary{cursor:pointer;font-weight:600;color:#475569;margin-bottom:4px;outline:none}
.demo-list{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:8px}
.demo-item{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:8px 10px}
.demo-info{display:grid;gap:4px}
.demo-cred{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
code{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 6px}

/* 動畫 */
.fade-enter-active,.fade-leave-active{transition:opacity .18s}
.fade-enter-from,.fade-leave-to{opacity:0}
</style>
