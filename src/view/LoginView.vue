<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="system-title">餐易館</h1>
      <div class="avatar"><img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="user"/></div>

      <form @submit.prevent="onLogin">
        <input type="email" v-model.trim="email" placeholder="請輸入電子郵件" autocomplete="username" required />
        <div class="password-box">
          <input :type="showPassword?'text':'password'" v-model.trim="password" placeholder="請輸入密碼" autocomplete="current-password" required />
          <button type="button" @click="showPassword=!showPassword">{{ showPassword?'隱藏':'顯示' }}</button>
        </div>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <a href="#" class="forgot" @click.prevent="onForgot">忘記密碼</a>
        <div class="button-group">
          <button type="submit" :disabled="!canSubmit || loading">{{ loading?'登入中…':'登入' }}</button>
          <button type="button" @click="goRegister" :disabled="loading">註冊</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'

const router = useRouter()
const { login } = useAuth()
const { setRole } = useRoleStore()

const email = ref(''), password = ref(''), showPassword = ref(false)
const errorMsg = ref(''), loading = ref(false)

const DEMO = {
  'boss@example.com':    { name:'老闆', role:'Boss',     password:'boss123' },
  'staff@example.com':   { name:'員工A', role:'Employee', password:'emp123'  },
  'kitchen@example.com': { name:'中央廚', role:'Kitchen',  password:'ck123'   }
}

const emailOk = computed(()=> /\S+@\S+\.\S+/.test(email.value))
const canSubmit = computed(()=> emailOk.value && password.value.length>=3)
watch([email,password], ()=> errorMsg.value='')

function onForgot(){ errorMsg.value='請聯繫管理員或之後串 Firebase 重設密碼'; setTimeout(()=>errorMsg.value='', 2200) }
function goRegister(){ router.push('/register') }

async function onLogin(){
  if(!canSubmit.value || loading.value) return
  loading.value = true
  try{
    const u = DEMO[email.value.toLowerCase()]
    if(!u || u.password!==password.value){ errorMsg.value='電子郵件或密碼錯誤'; return }
    login({ name:u.name, role:u.role, email:email.value })
    setRole(u.role)
    if(u.role==='Boss') router.push('/boss')
    else if(u.role==='Employee') router.push('/emp')
    else router.push('/kitchen')
  } finally {
    loading.value=false
  }
}
</script>

<style scoped>
.login-container{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#e0efff;padding:16px}
.login-box{background:#fff;padding:2rem;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.1);width:min(92vw,360px);text-align:center}
.system-title{margin:0 0 .5rem}
.avatar img{width:80px;margin-bottom:1rem;border-radius:50%}
input{width:100%;padding:.6rem .7rem;margin-bottom:.6rem;border:1px solid #cbd5e1;border-radius:8px;font-size:14px}
.password-box{display:flex;align-items:center;gap:8px}
.password-box input{flex:1}
.password-box button{padding:.45rem .6rem;font-size:12px;cursor:pointer;border:1px solid #e2e8f0;border-radius:8px;background:#fff}
.forgot{display:block;font-size:12px;margin:.2rem 0 1rem;color:#0077cc;text-decoration:none;text-align:right}
.button-group{display:flex;gap:.5rem}
.button-group button{flex:1;padding:.6rem;border:none;border-radius:8px;cursor:pointer;background:#0077cc;color:#fff;font-size:14px}
.button-group button:disabled{opacity:.6;cursor:not-allowed}
.button-group button:last-child{background:#e2e8f0;color:#111}
.error{color:#dc2626;font-size:12px;margin:.2rem 0 0}
</style>
